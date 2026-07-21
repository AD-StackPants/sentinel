from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.websocket_manager import manager
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

@router.websocket("/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We expect the server to push, but client can still send messages if needed
            data = await websocket.receive_text()
            # If client sends a ping, we can pong or just ignore
            logger.debug(f"Received websocket message from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
