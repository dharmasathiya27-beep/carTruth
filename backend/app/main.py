"""
CarTruth Backend API - FastAPI application entry point.
Premium AI car intelligence service.
"""

from app.config import settings
from app.routes import vehicle
from fastapi import FastAPI
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


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to CarTruth API",
        "docs": "/docs",
        "health": "/health",
    }
