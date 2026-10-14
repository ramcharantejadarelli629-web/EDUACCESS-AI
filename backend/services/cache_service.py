"""High-efficiency in-memory cache for EduAccess AI.

Provides sub-millisecond response times for repeated text simplifications
and URL extractions, eliminating redundant AI invocations and conserving bandwidth/quota.
"""

import hashlib
import time
from typing import Optional, Dict, Any, Tuple
from collections import OrderedDict

# Maximum cache capacity before LRU eviction
DEFAULT_CACHE_CAPACITY = 256
DEFAULT_TTL_SECONDS = 3600.0  # 1 hour


class EfficientLRUCache:
    """Thread-safe, high-speed LRU cache with TTL expiration."""

    def __init__(self, capacity: int = DEFAULT_CACHE_CAPACITY, ttl_seconds: float = DEFAULT_TTL_SECONDS):
        self.capacity = capacity
        self.ttl = ttl_seconds
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self.hits = 0
        self.misses = 0

    def _generate_key(self, namespace: str, *args) -> str:
        """Generate a compact SHA-256 cache key from input parameters."""
        raw = f"{namespace}:" + ":".join(str(a) for a in args)
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, namespace: str, *args) -> Optional[Any]:
        """Retrieve cached value if present and not expired."""
        key = self._generate_key(namespace, *args)
        now = time.time()

        if key in self._cache:
            value, timestamp = self._cache[key]
            if now - timestamp < self.ttl:
                # Move to end (most recently used)
                self._cache.move_to_end(key)
                self.hits += 1
                return value
            else:
                # Expired
                del self._cache[key]

        self.misses += 1
        return None

    def set(self, namespace: str, value: Any, *args):
        """Store value in LRU cache with current timestamp."""
        key = self._generate_key(namespace, *args)
        now = time.time()

        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (value, now)

        # Evict oldest if exceeding capacity
        if len(self._cache) > self.capacity:
            self._cache.popitem(last=False)

    def clear(self):
        """Purge all entries."""
        self._cache.clear()
        self.hits = 0
        self.misses = 0

    def stats(self) -> Dict[str, Any]:
        """Return cache performance statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0.0
        return {
            "size": len(self._cache),
            "capacity": self.capacity,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_percent": round(hit_rate, 2),
        }


# Global cache instance
cache_service = EfficientLRUCache()
