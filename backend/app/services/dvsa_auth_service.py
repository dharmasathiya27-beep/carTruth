"""DVSA OAuth 2.0 client credentials authentication."""

import logging
import time
from typing import Optional

import aiohttp
from app.config import settings

TOKEN_EXPIRY_BUFFER_SECONDS = 60
logger = logging.getLogger(__name__)

_cached_access_token: Optional[str] = None
_cached_token_expires_at = 0.0


def _has_dvsa_auth_config() -> bool:
    return bool(
        settings.dvsa_client_id
        and settings.dvsa_client_secret
        and settings.dvsa_scope_url
        and settings.dvsa_token_url
    )


async def get_dvsa_access_token() -> Optional[str]:
    """Return a cached DVSA access token, refreshing it when expired.

    Returns None when credentials are missing or the token endpoint fails.
    Callers should treat None as "DVSA unavailable" and avoid crashing.
    """
    global _cached_access_token, _cached_token_expires_at

    now = time.time()
    if _cached_access_token and now < _cached_token_expires_at:
        return _cached_access_token

    if not _has_dvsa_auth_config():
        logger.info("DVSA token request skipped because OAuth configuration is incomplete")
        return None

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=settings.dvsa_token_timeout_seconds)
        ) as session:
            async with session.post(
                settings.dvsa_token_url,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.dvsa_client_id,
                    "client_secret": settings.dvsa_client_secret,
                    "scope": settings.dvsa_scope_url,
                },
            ) as response:
                if response.status >= 400:
                    logger.warning("DVSA token request failed with status=%s", response.status)
                    return None

                payload = await response.json()
                access_token = payload.get("access_token")
                expires_in = int(payload.get("expires_in") or 0)

                if not access_token or expires_in <= TOKEN_EXPIRY_BUFFER_SECONDS:
                    logger.warning("DVSA token response was missing a usable access token")
                    return None

                _cached_access_token = access_token
                _cached_token_expires_at = now + expires_in - TOKEN_EXPIRY_BUFFER_SECONDS
                return _cached_access_token
    except (aiohttp.ClientError, TimeoutError, ValueError, TypeError) as exc:
        logger.warning("DVSA token request unavailable error_type=%s", type(exc).__name__)
        return None
