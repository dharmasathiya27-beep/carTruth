"""Deterministic hashing for official vehicle source data."""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


def _json_safe(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return _json_safe(value.model_dump(mode="json"))
    if isinstance(value, dict):
        return {str(key): _json_safe(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def normalise_source_payload(dvla_data: dict | None, dvsa_data: dict | None) -> dict:
    """Return source data in a stable JSON shape for storage and hashing."""
    return {
        "dvla": _json_safe(dvla_data or {}),
        "dvsa": _json_safe(dvsa_data or {}),
    }


def generate_source_hash(dvla_data: dict | None, dvsa_data: dict | None) -> str:
    """Generate the same SHA256 hash for the same normalised DVLA/DVSA data."""
    payload = normalise_source_payload(dvla_data, dvsa_data)
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()
