"""
Entry point for running the FastAPI server.
Run with: python run.py
"""

import uvicorn
import os

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )
