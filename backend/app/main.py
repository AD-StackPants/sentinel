from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
def health_check():
    return {"status": "ok", "message": "Sentinel AI Backend is running."}
