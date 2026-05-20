"""Small in-memory TTL cache for external registration lookups."""

from __future__ import annotations

from copy import deepcopy
from time import monotonic
from typing import Any

DEFAULT_TTL_SECONDS = 15 * 60

_cache: dict[str, tuple[float, Any]] = {}


def get_cached(key: str) -> Any:
    cached = _cache.get(key)
    if not cached:
        return None

    expires_at, value = cached
    if monotonic() >= expires_at:
        _cache.pop(key, None)
        return None

    return deepcopy(value)


def set_cached(key: str, value: Any, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> Any:
    _cache[key] = (monotonic() + ttl_seconds, deepcopy(value))
    return value


def clear_cache() -> None:
    _cache.clear()
