"""Tests for health and readiness endpoints."""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.config import settings
from backend.dependencies import get_gemini_service
from backend.services.gemini_service import GeminiService


@pytest.mark.asyncio
async def test_liveness_check():
    """Verify /health/liveness returns 200 and alive status without leaking config."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/liveness")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data
        assert data["version"] == "1.0.0"
        # Verify no secret leakage
        assert "api_key" not in str(data).lower()
        assert "secret" not in str(data).lower()


@pytest.mark.asyncio
async def test_readiness_check_mock_mode():
    """Verify /health/readiness reports readiness status safely."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/readiness")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "ai_configured" in data
        assert "mock_ai_mode" in data
        assert "model" in data
        # Ensure API key is NEVER exposed in readiness payload
        assert "api_key" not in data
        assert settings.gemini_api_key not in str(data) if settings.gemini_api_key else True


@pytest.mark.asyncio
async def test_security_headers_present():
    """Verify defensive HTTP security headers are injected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/liveness")
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"
        assert "strict-origin" in response.headers["referrer-policy"]
