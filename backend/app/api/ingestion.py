from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.celery_app import celery_app
from app.tasks.ingestion_tasks import fetch_and_store_live_weather_task

router = APIRouter()


class SyncResponse(BaseModel):
    message: str
    task_id: str
    status: str


@router.post("/sync-weather", response_model=SyncResponse)
def trigger_live_weather_sync():
    """
    Triggers Celery background worker task to fetch live Philippines weather telemetry
    and persist records to Snowflake DB.
    """
    try:
        # Trigger Celery task asynchronously using .delay()
        task = fetch_and_store_live_weather_task.delay()
        return SyncResponse(
            message="Celery weather ingestion task dispatched asynchronously",
            task_id=task.id,
            status=task.status,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch Celery task: {e!s}") from e


@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    """
    Retrieves execution state and result of a Celery background task.
    """
    try:
        task_result = celery_app.AsyncResult(task_id)
        result_data = None
        if task_result.ready():
            result_data = (
                task_result.result
                if not isinstance(task_result.result, Exception)
                else str(task_result.result)
            )

        return {
            "task_id": task_id,
            "status": task_result.status,
            "ready": task_result.ready(),
            "result": result_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check task status: {e!s}") from e
