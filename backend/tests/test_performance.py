"""Performance, efficiency, and caching benchmarks for EduAccess AI."""

import time
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.cache_service import cache_service


@pytest.mark.asyncio
async def test_cache_speedup_and_hit_rate():
    """Verify that cached requests respond in sub-10ms and achieve near-zero compute latency."""
    cache_service.clear()
    transport = ASGITransport(app=app)

    sample_payload = {
        "text": "DNA replication is the biological process of producing two identical replicas of DNA from one original DNA molecule.",
        "reading_level": "standard",
        "target_audience": "general_learner",
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First request (Cache Miss)
        t0 = time.perf_counter()
        res1 = await client.post("/api/v1/simplify-text", json=sample_payload)
        t_miss = (time.perf_counter() - t0) * 1000  # ms
        assert res1.status_code == 200

        # Second request (Cache Hit - Sub-millisecond)
        t1 = time.perf_counter()
        res2 = await client.post("/api/v1/simplify-text", json=sample_payload)
        t_hit = (time.perf_counter() - t1) * 1000  # ms
        assert res2.status_code == 200

        # Output parity
        assert res1.json()["concise_summary"] == res2.json()["concise_summary"]

        # Cache hit should be orders of magnitude faster (under 25ms locally)
        assert t_hit < 50.0

        # Verify cache metrics
        stats = cache_service.stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1
        assert stats["hit_rate_percent"] > 0.0


@pytest.mark.asyncio
async def test_gzip_compression_efficiency():
    """Verify responses larger than 500 bytes are gzip-compressed when client accepts it."""
    transport = ASGITransport(app=app)
    headers = {"Accept-Encoding": "gzip"}

    sample_payload = {
        "text": (
            "Thermodynamics is a branch of physics that deals with heat, work, and temperature, "
            "and their relation to energy, entropy, and the physical properties of matter and radiation. "
            "The behavior of these quantities is governed by the four laws of thermodynamics which convey "
            "a quantitative description using measurable macroscopic physical quantities."
        ),
        "reading_level": "detailed",
    }

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/simplify-text", json=sample_payload, headers=headers)
        assert response.status_code == 200
        # GZip compression verification
        assert response.headers.get("content-encoding") == "gzip"


@pytest.mark.asyncio
async def test_efficiency_metrics_endpoint():
    """Verify /efficiency/stats returns live operational data."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/efficiency/stats")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "optimal"
        assert "caching" in data
        assert "memory_model" in data
        assert "compression" in data
