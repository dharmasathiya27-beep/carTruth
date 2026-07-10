"""DVSA MOT History API service."""

import logging
from typing import Any
from urllib.parse import quote, urlencode

import aiohttp
from app.config import settings
from app.models.mot_schema import NormalizedMOTRecord
from app.services import mock_vehicle_service
from app.services.dvsa_auth_service import get_dvsa_access_token
from app.services.lookup_cache import get_cached, set_cached
from app.services.mot_data_normalizer import normalise_dvsa_mot_response

logger = logging.getLogger(__name__)


def _normalise_vehicle_identity(payload: Any) -> dict:
    if not isinstance(payload, dict):
        return {}

    return {
        "make": payload.get("make"),
        "model": payload.get("model"),
        "fuel_type": payload.get("fuelType"),
        "colour": payload.get("primaryColour"),
        "registration": payload.get("registration"),
        "first_used_date": payload.get("firstUsedDate"),
        "has_outstanding_recall": payload.get("hasOutstandingRecall"),
        "manufacture_date": payload.get("manufactureDate"),
        "primary_colour": payload.get("primaryColour"),
        "registration_date": payload.get("registrationDate"),
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
        logger.info("DVSA MOT lookup skipped because API key is missing")
        return {"mot_history": [], "vehicle_identity": {}}

    access_token = await get_dvsa_access_token()
    if not access_token:
        logger.info("DVSA MOT lookup skipped because access token is unavailable")
        return {"mot_history": [], "vehicle_identity": {}}

    cache_key = f"dvsa:{registration.upper().replace(' ', '')}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    url = _build_mot_history_url(registration)

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=settings.dvsa_timeout_seconds)
        ) as session:
            async with session.get(
                url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-API-Key": settings.dvsa_api_key,
                    "Accept": "application/json+v6",
                },
            ) as response:
                if response.status in {400, 404}:
                    logger.info(
                        "DVSA MOT lookup returned no data for registration=%s", registration
                    )
                    return {"mot_history": [], "vehicle_identity": {}}
                if response.status >= 400:
                    logger.warning(
                        "DVSA MOT lookup failed with upstream status=%s for registration=%s",
                        response.status,
                        registration,
                    )
                    return {"mot_history": [], "vehicle_identity": {}}

                payload = await response.json()
                return set_cached(
                    cache_key,
                    {
                        "mot_history": normalise_dvsa_mot_response(payload),
                        "vehicle_identity": _normalise_vehicle_identity(payload),
                    },
                    ttl_seconds=settings.cache_dvsa_ttl_seconds,
                )
    except (aiohttp.ClientError, TimeoutError, ValueError) as exc:
        logger.warning(
            "DVSA MOT lookup unavailable for registration=%s error_type=%s",
            registration,
            type(exc).__name__,
        )
        return {"mot_history": [], "vehicle_identity": {}}


async def fetch_mot_history_from_dvsa(registration: str) -> list[NormalizedMOTRecord]:
    data = await fetch_vehicle_mot_data_from_dvsa(registration)
    return data["mot_history"]
