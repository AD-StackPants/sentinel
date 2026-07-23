from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "Sentinel AI Backend is running.",
    }


def test_ask_copilot():
    with patch(
        "app.services.copilot_service.CopilotService.process_query"
    ) as mock_query, patch(
        "app.services.copilot_service.CopilotService.save_chat_message"
    ):
        mock_query.return_value = {
            "response": "The flood risk level is elevated in Zamboanga City.",
            "explanation": "Mocked test response",
            "recommended_actions": ["Issue Evacuation Advisory"],
        }
        response = client.post("/api/v1/copilot/ask", json={"query": "What is the flood risk?"})
        assert response.status_code == 200
        assert "flood" in response.json()["response"].lower()
