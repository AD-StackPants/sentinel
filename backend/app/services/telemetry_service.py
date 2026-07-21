import asyncio
import random
import logging
from datetime import datetime

from app.api.websocket_manager import manager

logger = logging.getLogger("uvicorn.error")

class TelemetryService:
    def __init__(self):
        self.is_running = False
        self.task = None

    def start_streaming(self):
        if not self.is_running:
            self.is_running = True
            self.task = asyncio.create_task(self._stream_telemetry())
            logger.info("Telemetry streaming started.")

    def stop_streaming(self):
        if self.is_running:
            self.is_running = False
            if self.task:
                self.task.cancel()
            logger.info("Telemetry streaming stopped.")

    async def _stream_telemetry(self):
        while self.is_running:
            try:
                # Simulate river sensor readings
                sensor_data = {
                    "type": "sensor_update",
                    "data": [
                        {
                            "name": "ZAM-TUMAGA-01",
                            "level": round(random.uniform(7.0, 9.5), 1), # Simulated level
                            "timestamp": datetime.now().isoformat()
                        },
                        {
                            "name": "ZAM-STAMARIA-01",
                            "level": round(random.uniform(5.0, 8.0), 1),
                            "timestamp": datetime.now().isoformat()
                        }
                    ]
                }

                await manager.broadcast(sensor_data)

                # Wait 1-2 seconds
                await asyncio.sleep(random.uniform(1.0, 2.0))
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error streaming telemetry: {e}")
                await asyncio.sleep(2)

telemetry_service = TelemetryService()
