from fastapi import Depends
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_current_user(
    x_api_key: str | None = Depends(api_key_header),
) -> dict:
    return {
        "token": x_api_key or "firebase_anonymous_user",
    }
