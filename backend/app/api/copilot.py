from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CopilotQuery(BaseModel):
    query: str
    context: dict | None = None

class CopilotResponse(BaseModel):
    response: str
    explanation: str | None = None
    recommended_actions: list[str] | None = None

@router.post("/ask", response_model=CopilotResponse)
def ask_copilot(query: CopilotQuery):
    # Skeleton implementation for interacting with CoCo CLI/Snowflake
    return CopilotResponse(
        response=f"Received query: {query.query}",
        explanation="This is a skeleton response.",
        recommended_actions=["Review data", "Approve recommendations"]
    )
