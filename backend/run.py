"""
Entry point for running the FastAPI server.
Run with: python run.py
"""

import os
import sys

RUNTIME_DEPENDENCIES = {"aiohttp", "dotenv", "fastapi", "pydantic", "uvicorn"}


def _print_missing_dependency_hint(exc: ModuleNotFoundError) -> None:
    if exc.name not in RUNTIME_DEPENDENCIES:
        raise exc

    print(
        "\nMissing backend dependency: "
        f"{exc.name}\n\n"
        "Run the backend with its virtual environment:\n"
        "  cd backend\n"
        "  source venv/bin/activate\n"
        "  pip install -r requirements.txt\n"
        "  python run.py\n\n"
        "Or, from the repo root:\n"
        "  backend/venv/bin/python backend/run.py\n",
        file=sys.stderr,
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    try:
        import uvicorn

        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=port,
            reload=os.getenv("RELOAD", "false").lower() == "true",
        )
    except ModuleNotFoundError as exc:
        _print_missing_dependency_hint(exc)
        sys.exit(1)
