from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Sentinel AI Backend is running.",
    }


def test_ask_copilot():
    response = client.post("/api/v1/copilot/ask", json={"query": "What is the flood risk?"})
    assert response.status_code == 200
    assert "flood" in response.json()["response"].lower()
