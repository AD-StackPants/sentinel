import json
import logging

from fastapi import WebSocket

logger = logging.getLogger("uvicorn.error")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"WebSocket disconnected. Total connections: {len(self.active_connections)}"
            )

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return

        # logger.debug(f"Broadcasting message to {len(self.active_connections)} clients")
        # Convert message to JSON and send to all connected clients
        message_json = json.dumps(message)

        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Failed to send to client: {e}")
                dead_connections.append(connection)

        # Clean up dead connections
        for dead_conn in dead_connections:
            self.disconnect(dead_conn)


manager = ConnectionManager()
