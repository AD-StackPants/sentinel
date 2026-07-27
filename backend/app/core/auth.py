from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_current_user(
    x_api_key: str | None = Depends(api_key_header),
) -> dict:
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header missing. Please sign in with Google.",
        )

    return {
        "token": x_api_key,
    }
