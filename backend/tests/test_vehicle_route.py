import pytest
from app.models.schemas import SearchQuery
from app.routes.vehicle import health_check, search_vehicle
from app.services.dvla_service import normalise_registration
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_invalid_registration_returns_400():
    with pytest.raises(HTTPException) as error:
        await search_vehicle(SearchQuery(registration="!!!"))

    assert error.value.status_code == 400
    assert "Invalid registration" in error.value.detail


def test_registration_normalisation_removes_spaces_and_uppercases():
    assert normalise_registration(" sw60 dgo ") == "SW60DGO"


@pytest.mark.asyncio
async def test_registration_with_invalid_characters_returns_400():
    with pytest.raises(HTTPException) as error:
        await search_vehicle(SearchQuery(registration="AB!!12"))

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_health_check_does_not_expose_secret_values():
    response = await health_check()

    assert response["status"] == "ok"
    assert isinstance(response["integrations"]["dvla_configured"], bool)
    assert isinstance(response["integrations"]["dvsa_configured"], bool)
    assert "api_key" not in str(response).lower()
    assert "secret" not in str(response).lower()
