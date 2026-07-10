#!/usr/bin/env python3
"""Inspect raw DVLA Vehicle Enquiry API responses for CarTruth.

Endpoint used:
- DVLA Vehicle Enquiry API, configured by `DVLA_API_BASE_URL`.

Authentication used:
- `x-api-key` header from backend-only `DVLA_API_KEY`.

Useful for CarTruth:
- Vehicle identity, taxation, MOT status, emissions, registration date,
  wheelplan, and Euro status fields can improve frontend facts and rule-engine
  scoring without exposing secrets or changing the FastAPI app.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

import aiohttp

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.config import settings  # noqa: E402
from app.services.dvla_service import is_valid_registration_format, normalise_registration  # noqa: E402

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
    else:
        rprint("\nTop-level response is not an object.")


def print_candidate_fields(payload: dict[str, Any]) -> None:
    groups = {
        "vehicle identity": [
            "registrationNumber",
            "make",
            "model",
            "colour",
            "yearOfManufacture",
            "monthOfFirstRegistration",
        ],
        "environmental insights": [
            "fuelType",
            "co2Emissions",
            "euroStatus",
            "euroStatusDirective",
            "realDrivingEmissions",
        ],
        "MOT intelligence": ["motStatus", "motExpiryDate"],
        "ownership/risk scoring": [
            "taxStatus",
            "taxDueDate",
            "motStatus",
            "motExpiryDate",
            "markedForExport",
            "typeApproval",
        ],
        "running cost estimates": [
            "fuelType",
            "engineCapacity",
            "co2Emissions",
            "revenueWeight",
        ],
        "maintenance prediction": [
            "yearOfManufacture",
            "engineCapacity",
            "fuelType",
            "wheelplan",
        ],
    }

    rprint("\n[bold]Suggested useful fields:[/bold]")
    for group, fields in groups.items():
        rprint(f"\n{group}:")
        for field in fields:
            rprint(f"- {field}: {payload.get(field)!r}")


def save_payload(registration: str, payload: Any) -> Path:
    DEBUG_DIR.mkdir(exist_ok=True)
    path = DEBUG_DIR / f"dvla_{registration}.json"
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str), encoding="utf-8")
    return path


async def fetch_raw_dvla(registration: str) -> tuple[int, Any]:
    if not settings.dvla_api_key:
        raise RuntimeError("DVLA_API_KEY is not configured in backend/.env")

    async with aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=settings.dvla_timeout_seconds)
    ) as session:
        async with session.post(
            settings.dvla_api_base_url,
            headers={
                "x-api-key": settings.dvla_api_key,
                "Content-Type": "application/json",
            },
            json={"registrationNumber": registration},
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
        status, payload = await fetch_raw_dvla(registration)
    except (aiohttp.ClientError, TimeoutError, RuntimeError) as exc:
        rprint(f"DVLA request failed safely: {type(exc).__name__}")
        return

    rprint(f"\nDVLA status: {status}")
    if status == 429:
        rprint("Rate limit response received from DVLA.")
    elif status >= 400:
        rprint("DVLA returned an error response. Secrets were not printed.")

    pretty_print_json(payload)
    print_top_level_keys(payload)
    if isinstance(payload, dict):
        print_candidate_fields(payload)

    path = save_payload(registration, payload)
    rprint(f"\nSaved raw response to: {path}")


if __name__ == "__main__":
    asyncio.run(main())
