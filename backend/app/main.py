from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.rate_limit import RateLimitMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.services.telemetry_service import telemetry_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    telemetry_service.start_streaming()
    yield
    # Shutdown
    telemetry_service.stop_streaming()


app = FastAPI(
    lifespan=lifespan,
    title="Sentinel AI Backend",
    description="Backend API for Sentinel AI Emergency Operations Copilot",
    version="0.1.0",
)

# Inner security headers
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting
app.add_middleware(
    RateLimitMiddleware,
    max_requests=20,     # Max 20 requests
    window_seconds=300,  # Per 5-minute interval
)

# CORSMiddleware MUST be added LAST to ensure it wraps ALL responses (including 429 & 404 errors) with CORS headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
def health_check():
    return {"status": "ok", "message": "Sentinel AI Backend is running."}
