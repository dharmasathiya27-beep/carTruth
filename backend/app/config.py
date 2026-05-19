"""Application configuration loaded from environment variables."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV_FILE)


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    dvla_api_key: str = os.getenv("DVLA_API_KEY", "")
    dvsa_api_key: str = os.getenv("DVSA_API_KEY", "")
    use_mock_data: bool = _env_bool("USE_MOCK_DATA", True)
    dvla_api_base_url: str = os.getenv(
        "DVLA_API_BASE_URL",
        "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    )
    dvsa_api_base_url: str = os.getenv(
        "DVSA_API_BASE_URL",
        "https://history.mot.api.gov.uk/v1/trade/vehicles",
    )


settings = Settings()
