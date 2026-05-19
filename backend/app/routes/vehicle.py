"""
API Routes for CarTruth vehicle service.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import SearchQuery, VehicleReport
from app.services.dvla_service import is_valid_registration_format
from app.services.vehicle_service import generate_vehicle_report

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
            detail="Invalid registration number. Enter 2-8 letters and numbers.",
        )
    
    report = await generate_vehicle_report(query.registration)
    
    if not report:
        raise HTTPException(
            status_code=404, 
            detail=f"Vehicle with registration '{query.registration}' was not found. Check the registration and try again."
        )
    
    return report


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "cartruth-api"}
