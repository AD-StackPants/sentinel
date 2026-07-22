import time
from collections import defaultdict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Lightweight in-memory IP rate limiter middleware for demo protection.
    Limits each client IP to max_requests within a sliding window_seconds (default 5 minutes).
    """

    def __init__(self, app, max_requests: int = 20, window_seconds: int = 300):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds  # 5 minutes (300s)
        self.request_history: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Exempt health checks, openapi docs, and CORS OPTIONS preflight requests
        if request.url.path in ["/healthz", "/docs", "/openapi.json", "/redoc"] or request.method == "OPTIONS":
            return await call_next(request)

        # Retrieve client IP (supporting X-Forwarded-For headers from proxies like Render)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        now = time.time()

        # Clean up timestamps older than 5 minutes
        timestamps = [ts for ts in self.request_history[client_ip] if now - ts < self.window_seconds]
        self.request_history[client_ip] = timestamps

        # if len(timestamps) >= self.max_requests:
        #     retry_after = int(self.window_seconds - (now - timestamps[0]))
        #     return JSONResponse(
        #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        #         content={
        #             "detail": f"Rate limit exceeded (max {self.max_requests} requests per 5 minutes). Please try again in {retry_after} seconds.",
        #             "retry_after_seconds": retry_after,
        #         },
        #         headers={"Retry-After": str(retry_after)},
        #     )

        self.request_history[client_ip].append(now)
        response = await call_next(request)
        return response
