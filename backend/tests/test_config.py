from app.config import Settings


def test_development_cors_includes_localhost():
    settings = Settings(app_env="development", frontend_url="https://cartruth.example")

    assert "http://localhost:3000" in settings.allowed_cors_origins
    assert "https://cartruth.example" in settings.allowed_cors_origins


def test_production_cors_excludes_localhost_and_uses_frontend_url():
    settings = Settings(app_env="production", frontend_url="https://cartruth.example")

    assert "http://localhost:3000" not in settings.allowed_cors_origins
    assert "https://cartruth.example" in settings.allowed_cors_origins
