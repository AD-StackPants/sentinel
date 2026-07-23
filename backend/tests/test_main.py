from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.services.copilot_service import CopilotService

client = TestClient(app)


def test_health_check():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Sentinel AI Backend is running.",
    }


@patch.object(CopilotService, "process_query")
def test_ask_copilot(mock_process_query):
    mock_process_query.return_value = {
        "response": "The flood risk is high.",
        "explanation": "Test explanation.",
        "recommended_actions": ["Test action"]
    }
    response = client.post("/api/v1/copilot/ask", json={"query": "What is the flood risk?"})
    assert response.status_code == 200
    assert "flood" in response.json()["response"].lower()
