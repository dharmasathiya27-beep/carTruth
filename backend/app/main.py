"""
CarTruth Backend API - FastAPI application entry point.
Premium AI car intelligence service.
"""

from app.config import settings
from app.routes import vehicle
from app.services.gemini_report_service import clear_gemini_ai_cache
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CarTruth API",
    description="AI-powered vehicle intelligence platform",
    version="0.1.0",
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(vehicle.router, prefix="/api/vehicle", tags=["vehicle"])


@app.get("/health")
async def health():
    """Top-level health endpoint for deployment checks."""
    return await vehicle.health_check()


@app.post("/api/dev/clear-gemini-cache")
async def clear_gemini_cache():
    """Clear the development-only in-memory Gemini cache."""
    if settings.app_env != "development":
        raise HTTPException(status_code=404, detail="Not found")
    cleared = clear_gemini_ai_cache()
    return {"status": "ok", "cleared": cleared}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to CarTruth API",
        "docs": "/docs",
        "health": "/health",
    }
