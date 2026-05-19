"""Integration point for the DVLA Vehicle Enquiry API."""

import re
from typing import Optional

import aiohttp

from app.config import settings

DVLA_TIMEOUT_SECONDS = 8


def normalise_registration(registration: str) -> str:
    """DVLA expects uppercase registration without spaces."""
    return re.sub(r"[^A-Z0-9]", "", registration.upper())


def is_valid_registration_format(registration: str) -> bool:
    cleaned = normalise_registration(registration)
    return 2 <= len(cleaned) <= 8 and cleaned.isalnum()


def _optional_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return value[:10]


def _optional_int(value: object) -> Optional[int]:
    if value in {None, ""}:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalise_vehicle_payload(registration: str, payload: dict) -> dict:
    engine_capacity = _optional_int(payload.get("engineCapacity"))
    year = _optional_int(payload.get("yearOfManufacture"))

    return {
        "make": payload.get("make", "Unknown"),
        # DVLA Vehicle Enquiry does not currently return model, so keep this
        # field stable for the existing frontend report contract.
        "model": payload.get("model") or "Unknown Model",
        "year": year or 0,
        "colour": payload.get("colour", "Unknown"),
        "fuel_type": payload.get("fuelType", "Unknown"),
        "engine_size": round(engine_capacity / 1000, 1) if engine_capacity else None,
        "registration": payload.get("registrationNumber") or normalise_registration(registration),
        "tax_status": payload.get("taxStatus", "Unknown"),
        "tax_due_date": _optional_date(payload.get("taxDueDate")),
    }


async def fetch_vehicle_from_dvla(registration: str) -> Optional[dict]:
    """Fetch and normalise vehicle details from DVLA.

    Returns None when credentials are missing or the API fails so callers can
    fall back to mock data without breaking the report experience.
    """
    registration_clean = normalise_registration(registration)

    if settings.use_mock_data or not settings.dvla_api_key or not is_valid_registration_format(registration):
        return None

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=DVLA_TIMEOUT_SECONDS)) as session:
            async with session.post(
                settings.dvla_api_base_url,
                headers={
                    "x-api-key": settings.dvla_api_key,
                    "Content-Type": "application/json",
                },
                json={"registrationNumber": registration_clean},
            ) as response:
                if response.status in {400, 404}:
                    return None
                if response.status >= 500:
                    return None
                payload = await response.json()
                if not isinstance(payload, dict) or not payload.get("make"):
                    return None
                return _normalise_vehicle_payload(registration_clean, payload)
    except (aiohttp.ClientError, TimeoutError, ValueError):
        return None


async def fetch_vehicle_details(registration: str) -> Optional[dict]:
    """Backward-compatible alias for older imports."""
    return await fetch_vehicle_from_dvla(registration)
