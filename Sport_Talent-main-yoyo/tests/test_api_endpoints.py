"""
Integration tests for FastAPI endpoints.
"""
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_get_latest_twin():
    res = client.get("/api/v1/twin")
    assert res.status_code == 200
    data = res.json()
    assert "scores" in data
    assert "strength" in data["scores"]
    assert "version" in data

def test_nutrition_parse_endpoint():
    res = client.post("/api/v1/nutrition/parse", json={"text": "2 roti + dal + sabzi + curd"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 4
    assert data["totals"]["calories"] > 300

def test_recovery_readiness_endpoint():
    res = client.get("/api/v1/recovery/readiness")
    assert res.status_code == 200
    data = res.json()
    assert "readiness_score" in data
    assert "breakdown" in data

def test_coach_recommendation_endpoint():
    res = client.get("/api/v1/coach/recommendation")
    assert res.status_code == 200
    data = res.json()
    assert "reasoning_why" in data
    assert "safety_approved" in data
    assert data["safety_approved"] is True

def test_simulator_run_endpoint():
    res = client.post("/api/v1/simulator/run", json={"scenario_key": "increase_frequency", "timeframe_weeks": 12})
    assert res.status_code == 200
    data = res.json()
    assert "projected_range" in data
    assert "confidence" in data
