from fastapi import APIRouter

from app.api import copilot
from app.api import jobs
from app.api import map
from app.api import websocket
from app.api import audit
from app.api import ingestion

api_router = APIRouter()
api_router.include_router(copilot.router, prefix="/copilot", tags=["copilot"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(map.router, prefix="/map", tags=["map"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
