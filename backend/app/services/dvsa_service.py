"""DVSA MOT History API service."""

from typing import Any
from urllib.parse import quote, urlencode

import aiohttp

from app.config import settings
from app.models.mot_schema import NormalizedMOTRecord
from app.services import mock_vehicle_service
from app.services.dvsa_auth_service import get_dvsa_access_token
from app.services.mot_data_normalizer import normalise_dvsa_mot_response


def _normalise_vehicle_identity(payload: Any) -> dict:
    if not isinstance(payload, dict):
        return {}

    return {
        "make": payload.get("make"),
        "model": payload.get("model"),
        "fuel_type": payload.get("fuelType"),
        "colour": payload.get("primaryColour"),
        "registration": payload.get("registration"),
    }


def _build_mot_history_url(registration: str) -> str:
    """Build the DVSA MOT History URL while supporting older env values."""
    base_url = settings.dvsa_api_base_url.rstrip("/")
    registration_clean = registration.upper().replace(" ", "")
    encoded_registration = quote(registration_clean, safe="")

    if "{registration}" in base_url:
        return base_url.format(registration=encoded_registration)

    if "?" in base_url:
        separator = "&" if not base_url.endswith("?") else ""
        return f"{base_url}{separator}{urlencode({'registration': registration_clean})}"

    if base_url.endswith("/mot-tests"):
        return f"{base_url}?{urlencode({'registration': registration_clean})}"

    return f"{base_url}/{encoded_registration}"


async def fetch_vehicle_mot_data_from_dvsa(registration: str) -> dict:
    """Fetch and normalise MOT history from DVSA.

    In development (`USE_MOCK_DATA=true`), this returns normalised mock data.
    In non-mock mode, it calls DVSA using OAuth bearer auth and X-API-Key.
    If DVSA is unavailable, return empty values so the report can degrade gracefully.
    """
    if settings.use_mock_data:
        return {
            "mot_history": mock_vehicle_service.get_normalized_mot_history(registration),
            "vehicle_identity": {},
        }

    if not settings.dvsa_api_key:
        return {"mot_history": [], "vehicle_identity": {}}

    access_token = await get_dvsa_access_token()
    if not access_token:
        return {"mot_history": [], "vehicle_identity": {}}

    url = _build_mot_history_url(registration)

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(
                url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-API-Key": settings.dvsa_api_key,
                    "Accept": "application/json+v6",
                },
            ) as response:
                if response.status in {400, 404}:
                    return {"mot_history": [], "vehicle_identity": {}}
                if response.status >= 400:
                    return {"mot_history": [], "vehicle_identity": {}}

                payload = await response.json()
                return {
                    "mot_history": normalise_dvsa_mot_response(payload),
                    "vehicle_identity": _normalise_vehicle_identity(payload),
                }
    except (aiohttp.ClientError, TimeoutError, ValueError):
        return {"mot_history": [], "vehicle_identity": {}}


async def fetch_mot_history_from_dvsa(registration: str) -> list[NormalizedMOTRecord]:
    data = await fetch_vehicle_mot_data_from_dvsa(registration)
    return data["mot_history"]
