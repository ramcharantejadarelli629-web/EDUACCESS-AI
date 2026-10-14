"""Security and input validation tests for EduAccess AI."""

import ipaddress
import pytest
from fastapi import HTTPException
from backend.security.validation import (
    sanitize_filename,
    is_ip_disallowed,
    validate_url_for_ssrf,
)
from backend.security.rate_limit import InMemoryRateLimiter


def test_sanitize_filename_traversal():
    """Verify filename sanitization prevents path traversal and unsafe characters."""
    assert sanitize_filename("../../../etc/passwd") == "etcpasswd"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "windowssystem32cmd.exe"
    assert sanitize_filename("test\x00document.pdf") == "testdocument.pdf"
    assert sanitize_filename("") == "unnamed_document"
    assert sanitize_filename("   ") == "unnamed_document"
    assert sanitize_filename("Normal File 123.png") == "Normal File 123.png"


def test_ip_disallowed_checks():
    """Verify that private, loopback, link-local, and reserved IPs are blocked."""
    # Loopback
    assert is_ip_disallowed(ipaddress.ip_address("127.0.0.1")) is True
    assert is_ip_disallowed(ipaddress.ip_address("127.0.1.5")) is True
    assert is_ip_disallowed(ipaddress.ip_address("::1")) is True

    # Cloud Metadata (AWS, GCP, Azure)
    assert is_ip_disallowed(ipaddress.ip_address("169.254.169.254")) is True

    # RFC 1918 Private networks
    assert is_ip_disallowed(ipaddress.ip_address("10.0.0.1")) is True
    assert is_ip_disallowed(ipaddress.ip_address("172.16.0.1")) is True
    assert is_ip_disallowed(ipaddress.ip_address("192.168.1.1")) is True

    # Shared CGNAT
    assert is_ip_disallowed(ipaddress.ip_address("100.64.0.1")) is True

    # Public IP should NOT be disallowed
    assert is_ip_disallowed(ipaddress.ip_address("8.8.8.8")) is False
    assert is_ip_disallowed(ipaddress.ip_address("1.1.1.1")) is False


def test_ssrf_disallowed_schemes_and_hosts():
    """Verify URL validation rejects dangerous schemes and restricted hosts."""
    # Unsupported schemes
    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("file:///etc/passwd")
    assert exc.value.status_code == 400
    assert "Unsupported scheme" in exc.value.detail

    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("ftp://ftp.example.com/file.txt")
    assert exc.value.status_code == 400

    # User credentials embedded
    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("https://admin:secret@example.com/article")
    assert exc.value.status_code == 400
    assert "credentials" in exc.value.detail

    # Localhost
    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("http://localhost:8000/internal")
    assert exc.value.status_code == 400
    assert "restricted" in exc.value.detail.lower() or "resolves to a restricted" in exc.value.detail.lower()

    # Cloud metadata domain
    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("http://metadata.google.internal/computeMetadata/v1/")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_rate_limiter_sliding_window():
    """Verify sliding-window rate limiter blocks requests exceeding quota and enforces retry."""
    test_limiter = InMemoryRateLimiter()

    class MockRequest:
        def __init__(self, ip):
            self.client = type("Client", (), {"host": ip})()
            self.headers = {}

    req = MockRequest("192.0.2.100")

    # Limit to 3 requests per 60s
    await test_limiter.check_rate_limit(req, max_requests=3, window_seconds=60.0, bucket_type="test")
    await test_limiter.check_rate_limit(req, max_requests=3, window_seconds=60.0, bucket_type="test")
    await test_limiter.check_rate_limit(req, max_requests=3, window_seconds=60.0, bucket_type="test")

    # 4th request must raise 429
    with pytest.raises(HTTPException) as exc:
        await test_limiter.check_rate_limit(req, max_requests=3, window_seconds=60.0, bucket_type="test")
    assert exc.value.status_code == 429
    assert "Retry-After" in exc.value.headers


@pytest.mark.asyncio
async def test_router_blocks_private_url_ssrf():
    """Verify endpoint rejects loopback and private IP SSRF attempts via HTTP POST."""
    from httpx import AsyncClient, ASGITransport
    from backend.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Loopback URL
        res = await client.post(
            "/api/v1/simplify-url",
            json={"url": "http://127.0.0.1:8000/admin/secrets", "reading_level": "standard"},
        )
        assert res.status_code == 400
        assert "private" in res.json()["detail"].lower() or "restricted" in res.json()["detail"].lower()
        # Verify stack trace is NOT exposed
        assert "Traceback" not in res.text

        # Cloud metadata
        res2 = await client.post(
            "/api/v1/simplify-url",
            json={"url": "http://169.254.169.254/latest/meta-data/", "reading_level": "standard"},
        )
        assert res2.status_code == 400
        assert "Traceback" not in res2.text

