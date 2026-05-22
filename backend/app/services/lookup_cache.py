"""Small in-memory TTL cache for external registration lookups and reports."""

from __future__ import annotations

from copy import deepcopy
from time import monotonic
from typing import Any

from app.config import settings

DEFAULT_TTL_SECONDS = 15 * 60

_cache: dict[str, tuple[float, Any]] = {}


def get_cached(key: str) -> Any:
    if not settings.cache_enabled:
        return None

    cached = _cache.get(key)
    if not cached:
        return None

    expires_at, value = cached
    if monotonic() >= expires_at:
        _cache.pop(key, None)
        return None

    return deepcopy(value)


def set_cached(key: str, value: Any, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> Any:
    if not settings.cache_enabled or ttl_seconds <= 0:
        return value

    _cache[key] = (monotonic() + ttl_seconds, deepcopy(value))
    return value


def clear_cache() -> None:
    _cache.clear()
