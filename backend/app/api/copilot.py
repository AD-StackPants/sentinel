from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.copilot_service import CopilotService

router = APIRouter()

# Dependency injection for the service
def get_copilot_service():
    return CopilotService()

class CopilotQuery(BaseModel):
    query: str
    context: dict | None = None

class CopilotResponse(BaseModel):
    response: str
    explanation: str | None = None
    recommended_actions: list[str] | None = None

@router.post("/ask", response_model=CopilotResponse)
def ask_copilot(query: CopilotQuery, service: CopilotService = Depends(get_copilot_service)):
    result = service.process_query(query.query, query.context)
    return CopilotResponse(
        response=result.get("response", ""),
        explanation=result.get("explanation"),
        recommended_actions=result.get("recommended_actions")
    )

@router.get("/recommendations")
def get_recommendations(service: CopilotService = Depends(get_copilot_service)):
    return service.get_recommendations()
