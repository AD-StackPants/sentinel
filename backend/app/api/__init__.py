from fastapi import APIRouter

from app.api import copilot
from app.api import jobs

api_router = APIRouter()
api_router.include_router(copilot.router, prefix="/copilot", tags=["copilot"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
