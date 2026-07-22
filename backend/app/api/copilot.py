from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.services.copilot_service import CopilotService

router = APIRouter()


# Dependency injection for the service
def get_copilot_service():
    return CopilotService()


class CopilotQuery(BaseModel):
    query: str = Field(..., max_length=500, description="User prompt query (max 500 characters)")
    session_id: str = Field("default_session", max_length=100)
    context: dict | None = None


class CopilotResponse(BaseModel):
    response: str
    explanation: str | None = None
    recommended_actions: list[str] | None = None


@router.post("/ask", response_model=CopilotResponse)
def ask_copilot(query: CopilotQuery, service: CopilotService = Depends(get_copilot_service)):
    # 1. Save user question to Snowflake chat_history
    service.save_chat_message(query.session_id, "user", query.query)

    # 2. Process query with Snowflake Cortex / RAG
    result = service.process_query(query.query, query.context)

    # 3. Save assistant response & metadata to Snowflake chat_history
    service.save_chat_message(
        query.session_id,
        "assistant",
        result.get("response", ""),
        metadata={
            "explanation": result.get("explanation"),
            "recommended_actions": result.get("recommended_actions"),
        },
    )

    return CopilotResponse(
        response=result.get("response", ""),
        explanation=result.get("explanation"),
        recommended_actions=result.get("recommended_actions"),
    )


@router.get("/recommendations")
def get_recommendations(service: CopilotService = Depends(get_copilot_service)):
    return service.get_recommendations()


@router.get("/history")
def get_chat_history(
    session_id: str = "default_session",
    limit: int = 50,
    service: CopilotService = Depends(get_copilot_service),
):
    return service.get_chat_history(session_id=session_id, limit=limit)
