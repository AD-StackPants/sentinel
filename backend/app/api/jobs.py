from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.services.audit_service import audit_service
from app.services.job_execution_service import JobExecutionService

router = APIRouter()

# Global singleton for demo state
job_service = JobExecutionService()


def get_job_service():
    return job_service


class JobCreate(BaseModel):
    messages: list[str]
    channels: list[str]
    recipients_filter: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    logs: list[str] = []
    counts: dict[str, int] = {}


@router.post("/", response_model=JobStatus)
async def create_job(
    job: JobCreate,
    user: dict = Depends(get_current_user),
    service: JobExecutionService = Depends(get_job_service),
):
    job_id = await service.create_job(job.messages, job.channels, job.recipients_filter)
    audit_service.log_audit_event(
        f"Verified Commander ({user.get('token')}) Queued Broadcast Job: {job_id}",
        "user_approval",
    )
    return JobStatus(job_id=job_id, status="queued", logs=[], counts={"sms": 0, "email": 0})


@router.get("/{job_id}", response_model=JobStatus)
def get_job_status(job_id: str, service: JobExecutionService = Depends(get_job_service)):
    status_data = service.get_job_status(job_id)
    return JobStatus(
        job_id=status_data["job_id"],
        status=status_data["status"],
        logs=status_data.get("logs", []),
        counts=status_data.get("counts", {"sms": 0, "email": 0}),
    )
