"""Persistent Supabase cache for vehicle source, report, and AI data.

This service uses the backend-only Supabase service role key. Every public
function fails closed and returns a cache miss when Supabase is unavailable, so
the live DVLA/DVSA report flow remains the fallback.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import aiohttp
from app.config import settings

logger = logging.getLogger(__name__)

SCHEMA = "cartruth"


def _configured() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_role_key)


def _headers() -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Profile": SCHEMA,
        "Content-Profile": SCHEMA,
        "Prefer": "return=representation,resolution=merge-duplicates",
    }


def _table_url(table: str) -> str:
    return f"{settings.supabase_url}/rest/v1/{table}"


def _parse_timestamp(value: str | None) -> Optional[datetime]:
    if not value:
        return None
    try:
        normalised = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalised)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def is_report_fresh(row: dict[str, Any] | None) -> bool:
    if not row:
        return False
    updated_at = _parse_timestamp(row.get("updated_at") or row.get("created_at"))
    if not updated_at:
        return False
    return datetime.now(timezone.utc) - updated_at <= timedelta(
        hours=settings.report_cache_ttl_hours
    )


async def _request(
    method: str,
    table: str,
    *,
    params: dict[str, str] | None = None,
    json: dict[str, Any] | None = None,
) -> Optional[Any]:
    if not _configured():
        logger.info("Supabase cache skipped because backend cache credentials are missing")
        return None

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as session:
            async with session.request(
                method,
                _table_url(table),
                headers=_headers(),
                params=params,
                json=json,
            ) as response:
                if response.status >= 400:
                    logger.warning(
                        "Supabase cache %s failed table=%s status=%s",
                        method,
                        table,
                        response.status,
                    )
                    return None
                if response.status == 204:
                    return []
                return await response.json()
    except (aiohttp.ClientError, TimeoutError, ValueError) as exc:
        logger.warning(
            "Supabase cache unavailable table=%s error_type=%s",
            table,
            type(exc).__name__,
        )
        return None


async def get_source_cache(registration: str) -> Optional[dict[str, Any]]:
    data = await _request(
        "GET",
        "vehicle_source_cache",
        params={
            "registration": f"eq.{registration}",
            "select": "*",
            "limit": "1",
        },
    )
    return data[0] if isinstance(data, list) and data else None


async def get_latest_report_cache(registration: str) -> Optional[dict[str, Any]]:
    data = await _request(
        "GET",
        "vehicle_report_cache",
        params={
            "registration": f"eq.{registration}",
            "report_version": f"eq.{settings.report_cache_version}",
            "select": "*",
            "order": "updated_at.desc",
            "limit": "1",
        },
    )
    return data[0] if isinstance(data, list) and data else None


async def get_report_cache(registration: str, source_hash: str) -> Optional[dict[str, Any]]:
    data = await _request(
        "GET",
        "vehicle_report_cache",
        params={
            "registration": f"eq.{registration}",
            "source_hash": f"eq.{source_hash}",
            "report_version": f"eq.{settings.report_cache_version}",
            "select": "*",
            "limit": "1",
        },
    )
    return data[0] if isinstance(data, list) and data else None


async def get_ai_report_cache(registration: str, source_hash: str) -> Optional[dict[str, Any]]:
    data = await _request(
        "GET",
        "ai_report_cache",
        params={
            "registration": f"eq.{registration}",
            "source_hash": f"eq.{source_hash}",
            "ai_model": f"eq.{settings.gemini_model}",
            "ai_report_version": f"eq.{settings.ai_report_version}",
            "select": "*",
            "limit": "1",
        },
    )
    return data[0] if isinstance(data, list) and data else None


async def upsert_source_cache(
    registration: str,
    source_hash: str,
    dvla_data: dict[str, Any],
    dvsa_data: dict[str, Any],
) -> bool:
    checked_at = datetime.now(timezone.utc).isoformat()
    data = await _request(
        "POST",
        "vehicle_source_cache",
        params={"on_conflict": "registration"},
        json={
            "registration": registration,
            "source_hash": source_hash,
            "dvla_data": dvla_data,
            "dvsa_data": dvsa_data,
            "last_checked_at": checked_at,
            "updated_at": checked_at,
        },
    )
    return data is not None


async def update_last_checked_at(registration: str) -> bool:
    data = await _request(
        "PATCH",
        "vehicle_source_cache",
        params={"registration": f"eq.{registration}"},
        json={"last_checked_at": datetime.now(timezone.utc).isoformat()},
    )
    return data is not None


async def upsert_report_cache(
    registration: str,
    source_hash: str,
    report_json: dict[str, Any],
) -> bool:
    updated_at = datetime.now(timezone.utc).isoformat()
    data = await _request(
        "POST",
        "vehicle_report_cache",
        params={"on_conflict": "registration,source_hash,report_version"},
        json={
            "registration": registration,
            "source_hash": source_hash,
            "report_version": settings.report_cache_version,
            "report_json": report_json,
            "updated_at": updated_at,
        },
    )
    return data is not None


async def upsert_ai_cache(
    registration: str,
    source_hash: str,
    ai_report_json: dict[str, Any],
) -> bool:
    updated_at = datetime.now(timezone.utc).isoformat()
    data = await _request(
        "POST",
        "ai_report_cache",
        params={"on_conflict": "registration,source_hash,ai_model,ai_report_version"},
        json={
            "registration": registration,
            "source_hash": source_hash,
            "ai_model": settings.gemini_model,
            "ai_report_version": settings.ai_report_version,
            "ai_report_json": ai_report_json,
            "updated_at": updated_at,
        },
    )
    return data is not None
