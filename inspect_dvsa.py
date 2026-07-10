#!/usr/bin/env python3
"""Inspect raw DVSA MOT History API responses for CarTruth.

Endpoint used:
- DVSA MOT History API, configured by `DVSA_API_BASE_URL`.

Authentication used:
- OAuth 2.0 client credentials via the existing `get_dvsa_access_token()`.
- `X-API-Key` header from backend-only `DVSA_API_KEY`.

Useful for CarTruth:
- MOT tests, odometer readings, defects, advisories, expiry dates, make/model,
  colour, and fuel type can improve MOT intelligence, mileage analysis,
  maintenance prediction, and ownership risk scoring.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlencode

import aiohttp

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.config import settings  # noqa: E402
from app.services.dvla_service import is_valid_registration_format, normalise_registration  # noqa: E402
from app.services.dvsa_auth_service import get_dvsa_access_token  # noqa: E402

try:
    from rich import print as rprint
    from rich.console import Console
    from rich.json import JSON

    console = Console()
except ImportError:  # pragma: no cover - optional local dependency
    rprint = print
    console = None
    JSON = None


DEBUG_DIR = ROOT / "debug_output"


def build_mot_history_url(registration: str) -> str:
    """Build the raw DVSA MOT History URL from `DVSA_API_BASE_URL`.

    This duplicates the tiny URL-building logic locally so this debug script
    does not import `dvsa_service`, which also imports Pydantic normalisation
    models that are not needed for raw API inspection.
    """
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


def pretty_print_json(payload: Any) -> None:
    encoded = json.dumps(payload, indent=2, sort_keys=True, default=str)
    if console and JSON:
        console.print(JSON(encoded))
    else:
        print(encoded)


def print_top_level_keys(payload: Any) -> None:
    if isinstance(payload, dict):
        rprint("\n[bold]Sorted top-level keys:[/bold]")
        for key in sorted(payload):
            rprint(f"- {key}")
    elif isinstance(payload, list):
        rprint("\nTop-level response is a list.")
        if payload and isinstance(payload[0], dict):
            rprint("[bold]Sorted keys from first list item:[/bold]")
            for key in sorted(payload[0]):
                rprint(f"- {key}")
    else:
        rprint("\nTop-level response is not an object or list.")


def _first_vehicle(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        return payload
    if isinstance(payload, list) and payload and isinstance(payload[0], dict):
        return payload[0]
    return {}


def _mot_tests(vehicle: dict[str, Any]) -> list[dict[str, Any]]:
    tests = vehicle.get("motTests") or vehicle.get("mot_tests") or []
    return tests if isinstance(tests, list) else []


def print_candidate_fields(payload: Any) -> None:
    vehicle = _first_vehicle(payload)
    tests = _mot_tests(vehicle)
    latest_test = tests[0] if tests and isinstance(tests[0], dict) else {}

    groups = {
        "vehicle identity": [
            "registration",
            "make",
            "model",
            "primaryColour",
            "fuelType",
            "manufactureDate",
            "registrationDate",
        ],
        "environmental insights": ["fuelType", "emissionClass"],
        "MOT intelligence": [
            "motTests",
            "completedDate",
            "testResult",
            "expiryDate",
            "defects",
        ],
        "ownership/risk scoring": [
            "motTests",
            "odometerValue",
            "testResult",
            "defects",
        ],
        "running cost estimates": ["fuelType", "primaryColour", "model"],
        "maintenance prediction": [
            "defects",
            "dangerous",
            "major",
            "minor",
            "advisory",
            "odometerValue",
        ],
    }

    rprint("\n[bold]Suggested useful fields:[/bold]")
    for group, fields in groups.items():
        rprint(f"\n{group}:")
        for field in fields:
            value = vehicle.get(field)
            if value is None:
                value = latest_test.get(field)
            rprint(f"- {field}: {value!r}")

    rprint(f"\nMOT test count: {len(tests)}")


def save_payload(registration: str, payload: Any) -> Path:
    DEBUG_DIR.mkdir(exist_ok=True)
    path = DEBUG_DIR / f"dvsa_{registration}.json"
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str), encoding="utf-8")
    return path


async def fetch_raw_dvsa(registration: str) -> tuple[int, Any]:
    if not settings.dvsa_api_key:
        raise RuntimeError("DVSA_API_KEY is not configured in backend/.env")

    access_token = await get_dvsa_access_token()
    if not access_token:
        raise RuntimeError("DVSA OAuth token unavailable. Check DVSA OAuth environment values.")

    url = build_mot_history_url(registration)
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
            try:
                payload = await response.json()
            except (aiohttp.ContentTypeError, json.JSONDecodeError):
                payload = {"raw_text": await response.text()}
            return response.status, payload


async def main() -> None:
    raw_registration = input("Enter vehicle registration: ").strip()
    if not is_valid_registration_format(raw_registration):
        rprint("Invalid registration. Use only letters, numbers, and spaces.")
        return

    registration = normalise_registration(raw_registration)
    try:
        status, payload = await fetch_raw_dvsa(registration)
    except (aiohttp.ClientError, TimeoutError, RuntimeError) as exc:
        rprint(f"DVSA request failed safely: {type(exc).__name__}")
        return

    rprint(f"\nDVSA status: {status}")
    if status == 401:
        rprint("DVSA authentication failed. Check OAuth credentials and token URL.")
    elif status == 429:
        rprint("Rate limit response received from DVSA.")
    elif status >= 400:
        rprint("DVSA returned an error response. Secrets were not printed.")

    pretty_print_json(payload)
    print_top_level_keys(payload)
    print_candidate_fields(payload)

    path = save_payload(registration, payload)
    rprint(f"\nSaved raw response to: {path}")


if __name__ == "__main__":
    asyncio.run(main())
