"""
CarTruth Backend API - FastAPI application entry point.
Premium AI car intelligence service.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import vehicle

app = FastAPI(
    title="CarTruth API",
    description="AI-powered vehicle intelligence platform",
    version="0.1.0",
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(vehicle.router, prefix="/api/vehicle", tags=["vehicle"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to CarTruth API",
        "docs": "/docs",
        "health": "/api/vehicle/health",
    }
