from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz_exempt_from_rate_limit():
    for _ in range(25):
        response = client.get("/healthz")
        assert response.status_code == 200
