from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.tasks.ingestion_tasks import fetch_and_store_live_weather_task

client = TestClient(app)


def test_create_job_and_duplicate_lock():
    payload = {
        "messages": ["EMERGENCY EVACUATION ADVISORY: Move to safety center."],
        "channels": ["sms", "email"],
        "recipients_filter": "tumaga_stamaria_test",
    }
    headers = {"Idempotency-Key": "test_idempotency_key_12345"}

    # 1. First submission succeeds (201 Created)
    response1 = client.post("/api/v1/jobs/", json=payload, headers=headers)
    assert response1.status_code == 201
    job_id1 = response1.json()["job_id"]
    assert job_id1 is not None

    # 2. Duplicate submission with identical Idempotency-Key yields 409 Conflict
    response2 = client.post("/api/v1/jobs/", json=payload, headers=headers)
    assert response2.status_code == 409
    assert response2.json()["detail"]["error"] == "DUPLICATE_JOB_SUBMISSION"
    assert response2.json()["detail"]["job_id"] == job_id1


def test_duplicate_payload_hash_lock():
    payload = {
        "messages": ["STAND BY & GEAR UP: Unique Staging Alert 999"],
        "channels": ["sms"],
        "recipients_filter": "first_responders_hash_test",
    }

    # First submission
    response1 = client.post("/api/v1/jobs/", json=payload)
    assert response1.status_code == 201

    # Rapid duplicate payload submission without header (hash-based lock)
    response2 = client.post("/api/v1/jobs/", json=payload)
    assert response2.status_code == 409
    assert response2.json()["detail"]["error"] == "DUPLICATE_JOB_SUBMISSION"


@pytest.mark.asyncio
async def test_fast_path_telemetry_breach():
    # Mock httpx response to return critical typhoon rainfall (185.0mm)
    with patch("httpx.Client.get") as mock_get:
        mock_get.return_value.json.return_value = {
            "current": {"precipitation": 185.0, "rain": 175.0, "wind_speed_10m": 88.5}
        }
        mock_get.return_value.raise_for_status = lambda: None

        result = fetch_and_store_live_weather_task()
        assert result["status"] == "SUCCESS"
        assert result["fast_path_triggered"] is True
        assert "SOP" in result["sop_citation"]
        assert len(result["fast_path_jobs"]) == 2
