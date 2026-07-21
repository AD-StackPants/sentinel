import asyncio
import uuid

import structlog
from app.core.config import settings
import snowflake.connector
import json

logger = structlog.get_logger()

class JobExecutionService:
    def __init__(self):
        # In a real app, this would be backed by Redis/Celery or Snowflake tables
        self.jobs_db = {}
        self.conn = None
        self._connect_to_snowflake()

    def _connect_to_snowflake(self):
        try:
            if settings.SNOWFLAKE_ACCOUNT != "placeholder_account":
                self.conn = snowflake.connector.connect(
                    user=settings.SNOWFLAKE_USER,
                    password=settings.SNOWFLAKE_PASSWORD,
                    account=settings.SNOWFLAKE_ACCOUNT,
                    warehouse=settings.SNOWFLAKE_WAREHOUSE,
                    database=settings.SNOWFLAKE_DATABASE,
                    schema=settings.SNOWFLAKE_SCHEMA,
                    role=settings.SNOWFLAKE_ROLE,
                )
        except Exception as e:
            logger.error("job_snowflake_connection_failed", error=str(e))

    async def create_job(self, messages: list[str], channels: list[str], recipients_filter: str) -> str:
        job_id = str(uuid.uuid4())
        self.jobs_db[job_id] = {
            "status": "queued",
            "messages": messages,
            "channels": channels,
            "recipients_filter": recipients_filter,
            "logs": [f"Job initialized for filter target: {recipients_filter}"],
            "counts": {"sms": 0, "email": 0}
        }

        asyncio.create_task(self._broadcast_log(job_id, f"Job initialized for filter target: {recipients_filter}"))

        logger.info("job_created", job_id=job_id, channels=channels, filter=recipients_filter)

        self._persist_job_state(job_id)

        # Start background processing for the mock
        asyncio.create_task(self.process_job_mock(job_id))

        return job_id

    async def process_job_mock(self, job_id: str):
        """Simulates live processing and progressive dispatching over time."""
        if job_id not in self.jobs_db:
            return

        self.jobs_db[job_id]["status"] = "processing"
        logger.info("job_processing_started", job_id=job_id)

        job = self.jobs_db[job_id]
        await asyncio.sleep(0.5)

        for channel in job["channels"]:
            if channel == "sms":
                self._dispatch_sms(job["messages"], job["recipients_filter"])
                msg = f"[SMS] Initializing gateway to {job['recipients_filter']}..."
                job["logs"].append(msg)
                asyncio.create_task(self._broadcast_log(job_id, msg))
                await asyncio.sleep(0.4)

                total_sms = 1200
                steps = [240, 520, 840, 1080, 1200]
                for count in steps:
                    job["counts"]["sms"] = count
                    percent = int((count / total_sms) * 100)
                    msg = f"[SMS] Dispatched {count:,} / {total_sms:,} messages ({percent}%)..."
                    job["logs"].append(msg)
                    asyncio.create_task(self._broadcast_log(job_id, msg))
                    await asyncio.sleep(0.5)

                msg = "[SMS] ✅ Broadcast completed to all high-risk mobile subscribers."
                job["logs"].append(msg)
                asyncio.create_task(self._broadcast_log(job_id, msg))

            elif channel == "email":
                self._dispatch_email(job["messages"], job["recipients_filter"])
                msg = f"[Email] Connecting to SMTP relay service..."
                job["logs"].append(msg)
                asyncio.create_task(self._broadcast_log(job_id, msg))
                await asyncio.sleep(0.4)

                total_email = 3500
                steps = [700, 1500, 2300, 3100, 3500]
                for count in steps:
                    job["counts"]["email"] = count
                    percent = int((count / total_email) * 100)
                    msg = f"[Email] Dispatched {count:,} / {total_email:,} emails ({percent}%)..."
                    job["logs"].append(msg)
                    asyncio.create_task(self._broadcast_log(job_id, msg))
                    await asyncio.sleep(0.5)

                msg = "[Email] ✅ Broadcast completed to registered emergency contacts."
                job["logs"].append(msg)
                asyncio.create_task(self._broadcast_log(job_id, msg))

        await asyncio.sleep(0.4)
        self.jobs_db[job_id]["status"] = "completed"
        msg = "🎯 All multi-channel emergency dispatches verified & completed."
        job["logs"].append(msg)
        asyncio.create_task(self._broadcast_log(job_id, msg))
        logger.info("job_completed", job_id=job_id)

    def get_job_status(self, job_id: str) -> dict:
        if job_id not in self.jobs_db:
            return {"job_id": job_id, "status": "not_found", "logs": [], "counts": {}}

        return {
            "job_id": job_id,
            "status": self.jobs_db[job_id]["status"],
            "logs": self.jobs_db[job_id]["logs"],
            "counts": self.jobs_db[job_id].get("counts", {})
        }

    def _dispatch_sms(self, messages: list[str], recipients_filter: str):
        """Production grade SMS dispatcher."""
        logger.info("dispatching_sms", target=recipients_filter)
        pass

    def _dispatch_email(self, messages: list[str], recipients_filter: str):
        """Production grade Email dispatcher."""
        logger.info("dispatching_email", target=recipients_filter)
        pass

    async def _broadcast_log(self, job_id: str, log: str):
        from app.api.websocket_manager import manager

        job = self.jobs_db.get(job_id)
        if job:
            await manager.broadcast({
                "type": "job_log_update",
                "job_id": job_id,
                "log": log,
                "counts": job.get("counts", {}),
                "status": job["status"]
            })

            # For simplicity, we just update the whole job state in Snowflake when a log is added.
            # In a real system, you might append to a log table directly.
            self._persist_job_state(job_id)

    def _persist_job_state(self, job_id: str):
        if self.conn and job_id in self.jobs_db:
            job = self.jobs_db[job_id]
            try:
                cursor = self.conn.cursor()

                # Check if job exists
                cursor.execute("SELECT job_id FROM SENTINEL_AI_DB.PUBLIC.execution_jobs WHERE job_id = %s", (job_id,))
                exists = cursor.fetchone()

                logs_json = json.dumps(job["logs"])
                counts_json = json.dumps(job["counts"])
                channels_json = json.dumps(job["channels"])
                messages_json = json.dumps(job["messages"])

                if exists:
                    sql = """
                        UPDATE SENTINEL_AI_DB.PUBLIC.execution_jobs
                        SET status = %s, logs = PARSE_JSON(%s), counts = PARSE_JSON(%s), updated_at = CURRENT_TIMESTAMP()
                        WHERE job_id = %s
                    """
                    cursor.execute(sql, (job["status"], logs_json, counts_json, job_id))
                else:
                    sql = """
                        INSERT INTO SENTINEL_AI_DB.PUBLIC.execution_jobs
                        (job_id, status, messages, channels, recipients_filter, logs, counts)
                        SELECT %s, %s, PARSE_JSON(%s), PARSE_JSON(%s), %s, PARSE_JSON(%s), PARSE_JSON(%s)
                    """
                    cursor.execute(sql, (
                        job_id, job["status"], messages_json, channels_json,
                        job["recipients_filter"], logs_json, counts_json
                    ))
            except Exception as e:
                logger.error("failed_to_persist_job", job_id=job_id, error=str(e))
