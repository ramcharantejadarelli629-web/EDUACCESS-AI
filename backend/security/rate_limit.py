"""In-memory rate limiter for EduAccess AI.

NOTE: This rate limiter is process-local and designed for single-instance hackathon
and demonstration deployments. In distributed or multi-worker production environments,
a centralized store such as Redis should be used for rate limiting.
"""

import time
import asyncio
from typing import Dict, List
from collections import defaultdict
from fastapi import Request, HTTPException, status
from backend.config import settings


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter."""

    def __init__(self):
        # Maps (ip, route_type) -> list of timestamp floats
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, now: float, window_seconds: float = 60.0):
        """Purge timestamps older than the sliding window to prevent memory leaks."""
        if now - self._last_cleanup < 30.0:
            return
        cutoff = now - window_seconds
        keys_to_remove = []
        for key, timestamps in self._requests.items():
            self._requests[key] = [t for t in timestamps if t > cutoff]
            if not self._requests[key]:
                keys_to_remove.append(key)
        for key in keys_to_remove:
            del self._requests[key]
        self._last_cleanup = now

    def reset(self):
        """Reset all rate limiter states (useful for tests)."""
        self._requests.clear()

    async def check_rate_limit(
        self,
        request: Request,
        max_requests: int,
        window_seconds: float = 60.0,
        bucket_type: str = "general",
    ):
        """Check if client IP exceeds the limit within the sliding window."""
        # Bypass in test environment if configured
        if settings.environment == "test" and getattr(settings, "bypass_rate_limit_in_tests", False):
            return

        # Extract client IP safely
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # First IP in X-Forwarded-For if behind a reverse proxy
            client_ip = forwarded_for.split(",")[0].strip()

        key = f"{client_ip}:{bucket_type}"
        now = time.time()

        async with self._lock:
            self._cleanup_old_entries(now, window_seconds)
            timestamps = self._requests[key]
            # Retain only timestamps inside window
            cutoff = now - window_seconds
            valid_timestamps = [t for t in timestamps if t > cutoff]
            self._requests[key] = valid_timestamps

            if len(valid_timestamps) >= max_requests:
                earliest = valid_timestamps[0]
                retry_after = int(window_seconds - (now - earliest)) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for {bucket_type} requests ({max_requests}/min). Please wait {retry_after} seconds.",
                    headers={"Retry-After": str(max(retry_after, 1))},
                )

            valid_timestamps.append(now)


# Global rate limiter instance
limiter = InMemoryRateLimiter()


async def rate_limit_standard(request: Request):
    """Dependency for standard endpoints."""
    await limiter.check_rate_limit(
        request,
        max_requests=settings.rate_limit_per_minute,
        window_seconds=60.0,
        bucket_type="standard",
    )


async def rate_limit_ai(request: Request):
    """Dependency for resource-intensive AI and external URL operations."""
    await limiter.check_rate_limit(
        request,
        max_requests=settings.rate_limit_ai_per_minute,
        window_seconds=60.0,
        bucket_type="ai_expensive",
    )
