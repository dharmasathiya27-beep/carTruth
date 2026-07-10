"""
API Routes for CarTruth vehicle service.
"""

from app.config import settings
from app.models.schemas import SearchQuery, VehicleReport
from app.services.dvla_service import is_valid_registration_format, normalise_registration
from app.services.pdf_service import generate_vehicle_pdf
from app.services.vehicle_service import (
    generate_vehicle_report,
    generate_vehicle_report_with_cache,
)
from fastapi import APIRouter, HTTPException, Response

router = APIRouter()


@router.post("/search", response_model=VehicleReport)
async def search_vehicle(query: SearchQuery):
    """
    Search for a vehicle by registration number.
    Returns a complete vehicle report with MOT history, mileage trends, and ownership score.
    """

    if not query.registration or not is_valid_registration_format(query.registration):
        raise HTTPException(
            status_code=400,
            detail="Invalid registration number. Use only letters, numbers, and spaces.",
        )

    registration = normalise_registration(query.registration)
    # The normal search path uses the Supabase report cache when configured.
    # Without cache credentials, the service falls back to live DVLA/DVSA lookups.
    report = await generate_vehicle_report_with_cache(registration)

    if not report:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Vehicle with registration '{registration}' was not found. "
                "Check the registration and try again."
            ),
        )

    return report


@router.get("/{registration}/pdf")
async def download_vehicle_pdf(registration: str):
    """Generate a downloadable premium PDF report for a vehicle."""
    if not registration or not is_valid_registration_format(registration):
        raise HTTPException(
            status_code=400,
            detail="Invalid registration number. Use only letters, numbers, and spaces.",
        )

    registration_clean = normalise_registration(registration)
    report = await generate_vehicle_report(registration_clean)

    if not report:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Vehicle with registration '{registration_clean}' was not found. "
                "Check the registration and try again."
            ),
        )

    try:
        pdf_bytes = await generate_vehicle_pdf(report)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    filename = f"CarTruth-{registration_clean}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "cartruth-api",
        "environment": settings.app_env,
        "mock_data_enabled": settings.use_mock_data,
        "mock_mot_fallback_enabled": settings.allow_mock_mot_fallback,
        "integrations": {
            "dvla_configured": settings.has_dvla_config,
            "dvsa_configured": settings.has_dvsa_config,
        },
    }
