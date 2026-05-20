from app.services.lookup_cache import clear_cache, get_cached, set_cached


def test_lookup_cache_returns_copy_and_can_clear():
    clear_cache()
    original = {"registration": "AB20OXY", "items": ["mot"]}

    cached = set_cached("dvla:AB20OXY", original)
    cached["items"].append("mutated")

    value = get_cached("dvla:AB20OXY")
    assert value == {"registration": "AB20OXY", "items": ["mot"]}

    clear_cache()
    assert get_cached("dvla:AB20OXY") is None
