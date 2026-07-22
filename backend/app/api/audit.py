from fastapi import APIRouter
from pydantic import BaseModel

from app.services.audit_service import audit_service

router = APIRouter()


class AuditLogRequest(BaseModel):
    event: str
    event_type: str


@router.post("/log")
def log_event(request: AuditLogRequest):
    audit_service.log_audit_event(request.event, request.event_type)
    return {"status": "ok"}


@router.get("/approved-directives")
def get_approved_directives():
    approved = audit_service.get_approved_directives()
    return {"approved_directives": approved}


@router.get("/events")
def get_audit_events():
    events = audit_service.get_audit_events()
    return {"events": events}
