"""Application configuration loaded from environment variables."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV_FILE)


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str) -> list[str]:
    value = os.getenv(name, "")
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    dvla_api_key: str = os.getenv("DVLA_API_KEY", "")
    app_env: str = os.getenv("APP_ENV", "development").strip().lower()
    frontend_url: str = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    cors_allowed_origins: list[str] = field(default_factory=list)
    use_mock_data: bool = _env_bool("USE_MOCK_DATA", True)
    allow_mock_mot_fallback: bool = _env_bool(
        "ALLOW_MOCK_MOT_FALLBACK",
        os.getenv("APP_ENV", "development").lower() != "production",
    )
    dvla_api_base_url: str = os.getenv(
        "DVLA_API_BASE_URL",
        "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    )
    dvla_timeout_seconds: int = _env_int("DVLA_TIMEOUT_SECONDS", 8)
    dvsa_client_id: str = os.getenv("DVSA_CLIENT_ID", "")
    dvsa_client_secret: str = os.getenv("DVSA_CLIENT_SECRET", "")
    dvsa_api_key: str = os.getenv("DVSA_API_KEY", "")
    dvsa_scope_url: str = os.getenv("DVSA_SCOPE_URL", "")
    dvsa_token_url: str = os.getenv("DVSA_TOKEN_URL", "")
    dvsa_api_base_url: str = os.getenv(
        "DVSA_API_BASE_URL",
        "https://history.mot.api.gov.uk/v1/trade/vehicles/registration",
    )
    dvsa_token_timeout_seconds: int = _env_int("DVSA_TOKEN_TIMEOUT_SECONDS", 10)
    dvsa_timeout_seconds: int = _env_int("DVSA_TIMEOUT_SECONDS", 10)
    cache_enabled: bool = _env_bool("CACHE_ENABLED", True)
    cache_dvla_ttl_seconds: int = _env_int("CACHE_DVLA_TTL_SECONDS", 15 * 60)
    cache_dvsa_ttl_seconds: int = _env_int("CACHE_DVSA_TTL_SECONDS", 15 * 60)
    cache_report_ttl_seconds: int = _env_int("CACHE_REPORT_TTL_SECONDS", 5 * 60)
    report_cache_ttl_hours: int = _env_int("REPORT_CACHE_TTL_HOURS", 24)
    report_cache_version: str = os.getenv("REPORT_CACHE_VERSION", "v1")
    enable_llm_report_writer: bool = _env_bool("ENABLE_LLM_REPORT_WRITER", False)
    supabase_url: str = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    gemini_timeout_seconds: int = _env_int("GEMINI_TIMEOUT_SECONDS", 8)
    ai_report_version: str = os.getenv("AI_REPORT_VERSION", "v1")

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def allowed_cors_origins(self) -> list[str]:
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

        configured_origins = _env_list("CORS_ALLOWED_ORIGINS")
        if self.frontend_url:
            configured_origins.append(self.frontend_url)

        origins.extend(configured_origins)
        deduped = list(dict.fromkeys(origin for origin in origins if origin))

        if self.is_production:
            return [origin for origin in deduped if not origin.startswith("http://localhost")]

        return deduped

    @property
    def has_dvla_config(self) -> bool:
        return bool(self.dvla_api_key and self.dvla_api_base_url)

    @property
    def has_dvsa_config(self) -> bool:
        return all(
            [
                self.dvsa_client_id,
                self.dvsa_client_secret,
                self.dvsa_api_key,
                self.dvsa_scope_url,
                self.dvsa_token_url,
                self.dvsa_api_base_url,
            ]
        )


settings = Settings()
