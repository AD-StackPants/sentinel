import asyncio
import random
import logging
from datetime import datetime

import snowflake.connector
from app.core.config import settings
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

    def _fetch_snowflake_sensor_readings(self):
        if settings.SNOWFLAKE_ACCOUNT == "placeholder_account":
            return None

        try:
            conn = snowflake.connector.connect(
                user=settings.SNOWFLAKE_USER,
                password=settings.SNOWFLAKE_PASSWORD,
                account=settings.SNOWFLAKE_ACCOUNT,
                warehouse=settings.SNOWFLAKE_WAREHOUSE,
                database=settings.SNOWFLAKE_DATABASE,
                schema=settings.SNOWFLAKE_SCHEMA,
                role=settings.SNOWFLAKE_ROLE,
            )
            cursor = conn.cursor()
            cursor.execute("SELECT sensor_id, water_level FROM river_sensors")
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            if rows:
                data = []
                for sensor_id, base_level in rows:
                    # Apply micro fluctuation (+/- 0.1m) to simulate live sensor jitter around actual DB level
                    jittered_level = round(max(0.0, float(base_level) + random.uniform(-0.1, 0.1)), 1)
                    data.append({
                        "name": sensor_id,
                        "level": jittered_level,
                        "timestamp": datetime.now().isoformat()
                    })
                return data
        except Exception as e:
            logger.error(f"Error fetching Snowflake sensor readings: {e}")

        return None

    async def _stream_telemetry(self):
        while self.is_running:
            try:
                # 1. Try fetching from Snowflake river_sensors table
                readings = self._fetch_snowflake_sensor_readings()

                # 2. Fallback if Snowflake is not configured / offline
                if not readings:
                    readings = [
                        {
                            "name": "ZAM-TUMAGA-01",
                            "level": round(random.uniform(7.0, 9.5), 1),
                            "timestamp": datetime.now().isoformat()
                        },
                        {
                            "name": "ZAM-STAMARIA-01",
                            "level": round(random.uniform(5.0, 8.0), 1),
                            "timestamp": datetime.now().isoformat()
                        }
                    ]

                sensor_data = {
                    "type": "sensor_update",
                    "data": readings
                }

                await manager.broadcast(sensor_data)

                # Broadcast interval: 2 seconds
                await asyncio.sleep(2.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error streaming telemetry: {e}")
                await asyncio.sleep(2.0)

telemetry_service = TelemetryService()
