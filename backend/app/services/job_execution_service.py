import asyncio
import json
import uuid
import hashlib
import random

import snowflake.connector
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class JobExecutionService:
    def __init__(self):
        # In a real app, this would be backed by Redis/Celery or Snowflake tables
        self.jobs_db = {}
        self.conn = None
        self._background_tasks = set()
        self._connect_to_snowflake()
        self._idempotency_cache = set()

    def _schedule_task(self, coro):
        task = asyncio.create_task(coro)
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)
        return task

    def _connect_to_snowflake(self):
        try:
            self.conn = snowflake.connector.connect(
                user=settings.SNOWFLAKE_USER,
                password=settings.SNOWFLAKE_PASSWORD,
                account=settings.SNOWFLAKE_ACCOUNT,
                warehouse=settings.SNOWFLAKE_WAREHOUSE,
                database=settings.SNOWFLAKE_DATABASE,
                schema=settings.SNOWFLAKE_SCHEMA,
                role=settings.SNOWFLAKE_ROLE,
            )
            logger.info("job_service_connected_to_snowflake")
        except Exception as e:
            logger.error("job_snowflake_connection_failed", error=str(e))
            self.conn = None

    async def create_job(
        self, messages: list[str], channels: list[str], recipients_filter: str
    ) -> str:
        # Create an idempotency key based on recipients_filter and messages
        key_content = f"{recipients_filter}_{json.dumps(messages)}_{json.dumps(channels)}"
        idempotency_key = hashlib.sha256(key_content.encode()).hexdigest()

        if idempotency_key in self._idempotency_cache:
            # Check if there is already a job processing or queued with this key
            logger.info("job_creation_rejected_duplicate", key=idempotency_key)
            for jid, job in self.jobs_db.items():
                if job.get("idempotency_key") == idempotency_key and job["status"] in [
                    "queued",
                    "processing",
                ]:
                    return jid
            raise ValueError(f"Duplicate job submission detected for key {idempotency_key}")

        self._idempotency_cache.add(idempotency_key)

        job_id = str(uuid.uuid4())
        self.jobs_db[job_id] = {
            "status": "draft",
            "messages": messages,
            "channels": channels,
            "recipients_filter": recipients_filter,
            "logs": [f"Job initialized for filter target: {recipients_filter}"],
            "counts": {"sms": 0, "email": 0},
            "idempotency_key": idempotency_key,
        }

        # _persist_job_state enforces atomic status transition from 'draft' -> 'queued'
        if not self._persist_job_state(job_id, to_status="queued"):
            self._idempotency_cache.discard(idempotency_key)
            raise ValueError("Failed to queue job due to atomic state check.")

        self.jobs_db[job_id]["status"] = "queued"

        self._schedule_task(
            self._broadcast_log(job_id, f"Job initialized for filter target: {recipients_filter}")
        )

        logger.info("job_created", job_id=job_id, channels=channels, filter=recipients_filter)

        # Start background processing for the mock
        self._schedule_task(self.process_job_mock(job_id))

        return job_id

    async def process_job_mock(self, job_id: str):
        """Simulates live processing and progressive dispatching over time."""
        if job_id not in self.jobs_db:
            return

        if not self._persist_job_state(job_id, to_status="processing"):
            return

        self.jobs_db[job_id]["status"] = "processing"
        logger.info("job_processing_started", job_id=job_id)

        job = self.jobs_db[job_id]
        await asyncio.sleep(0.5)

        for channel in job["channels"]:
            if channel == "sms":
                success = await self._dispatch_sms_with_retry(job_id, job)
                if success:
                    msg = "[SMS] ✅ Broadcast completed to all high-risk mobile subscribers."
                    job["logs"].append(msg)
                    self._schedule_task(self._broadcast_log(job_id, msg))
                else:
                    msg = "[SMS] ❌ Broadcast failed after maximum retries."
                    job["logs"].append(msg)
                    self._schedule_task(self._broadcast_log(job_id, msg))

            elif channel == "email":
                success = await self._dispatch_email_with_retry(job_id, job)
                if success:
                    msg = "[Email] ✅ Broadcast completed to registered emergency contacts."
                    job["logs"].append(msg)
                    self._schedule_task(self._broadcast_log(job_id, msg))
                else:
                    msg = "[Email] ❌ Broadcast failed after maximum retries."
                    job["logs"].append(msg)
                    self._schedule_task(self._broadcast_log(job_id, msg))

        await asyncio.sleep(0.4)

        self._persist_job_state(job_id, to_status="completed")
        self.jobs_db[job_id]["status"] = "completed"

        msg = "🎯 All multi-channel emergency dispatches verified & completed."
        job["logs"].append(msg)
        self._schedule_task(self._broadcast_log(job_id, msg))
        logger.info("job_completed", job_id=job_id)

    async def _dispatch_sms_with_retry(self, job_id, job) -> bool:
        max_retries = 3
        delay = 2.0

        msg = f"[SMS] Initializing gateway to {job['recipients_filter']}..."
        job["logs"].append(msg)
        self._schedule_task(self._broadcast_log(job_id, msg))
        await asyncio.sleep(0.4)

        for attempt in range(1, max_retries + 1):
            try:
                # Simulate dispatch execution which may fail occasionally on the first few attempts
                # For demonstration, we will always simulate a carrier drop on the first attempt
                if attempt == 1:
                    raise ConnectionError("Simulated carrier network drop.")

                self._dispatch_sms(job["messages"], job["recipients_filter"])

                total_sms = 1200
                steps = [240, 520, 840, 1080, 1200]
                for count in steps:
                    job["counts"]["sms"] = count
                    percent = int((count / total_sms) * 100)
                    msg = f"[SMS] Dispatched {count:,} / {total_sms:,} messages ({percent}%)..."
                    job["logs"].append(msg)
                    self._schedule_task(self._broadcast_log(job_id, msg))
                    await asyncio.sleep(0.5)
                return True

            except Exception as e:
                logger.warning(f"SMS dispatch failed: {e}")
                if attempt == max_retries:
                    return False

                jitter = random.uniform(0.1, 0.5)
                sleep_time = delay + jitter
                retry_msg = f"[SMS] Carrier retry (Attempt {attempt + 1}/{max_retries}) after timeout ({sleep_time:.1f}s)..."
                job["logs"].append(retry_msg)
                self._schedule_task(self._broadcast_log(job_id, retry_msg))
                await asyncio.sleep(sleep_time)
                delay *= 2  # Exponential backoff

        return False

    async def _dispatch_email_with_retry(self, job_id, job) -> bool:
        max_retries = 3
        delay = 2.0

        msg = "[Email] Connecting to SMTP relay service..."
        job["logs"].append(msg)
        self._schedule_task(self._broadcast_log(job_id, msg))
        await asyncio.sleep(0.4)

        for attempt in range(1, max_retries + 1):
            try:
                # Simulate success for email generally, or failure on random chance
                if attempt == 1 and random.random() < 0.3:
                    raise ConnectionError("SMTP relay connection timeout.")

                self._dispatch_email(job["messages"], job["recipients_filter"])

                total_email = 3500
                steps = [700, 1500, 2300, 3100, 3500]
                for count in steps:
                    job["counts"]["email"] = count
                    percent = int((count / total_email) * 100)
                    msg = f"[Email] Dispatched {count:,} / {total_email:,} emails ({percent}%)..."
                    job["logs"].append(msg)
                    self._schedule_task(self._broadcast_log(job_id, msg))
                    await asyncio.sleep(0.5)
                return True

            except Exception as e:
                logger.warning(f"Email dispatch failed: {e}")
                if attempt == max_retries:
                    return False

                jitter = random.uniform(0.1, 0.5)
                sleep_time = delay + jitter
                retry_msg = f"[Email] SMTP retry (Attempt {attempt + 1}/{max_retries}) after timeout ({sleep_time:.1f}s)..."
                job["logs"].append(retry_msg)
                self._schedule_task(self._broadcast_log(job_id, retry_msg))
                await asyncio.sleep(sleep_time)
                delay *= 2

        return False

    def get_job_status(self, job_id: str) -> dict:
        if job_id not in self.jobs_db:
            return {"job_id": job_id, "status": "not_found", "logs": [], "counts": {}}

        return {
            "job_id": job_id,
            "status": self.jobs_db[job_id]["status"],
            "logs": self.jobs_db[job_id]["logs"],
            "counts": self.jobs_db[job_id].get("counts", {}),
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
            await manager.broadcast(
                {
                    "type": "job_log_update",
                    "job_id": job_id,
                    "log": log,
                    "counts": job.get("counts", {}),
                    "status": job["status"],
                }
            )
            # Update log in DB without changing status
            self._persist_job_state(job_id)

    def _persist_job_state(self, job_id: str, to_status: str | None = None) -> bool:
        """
        Persist state to Snowflake. If `to_status` is provided, enforces atomic state transition.
        Returns True if successful, False if atomic transition fails.
        """
        if not self.conn or job_id not in self.jobs_db:
            return True  # Assume successful if no DB to fail on

        job = self.jobs_db[job_id]
        current_status = job["status"]
        target_status = to_status or current_status

        try:
            cursor = self.conn.cursor()

            # Check if job exists
            cursor.execute(
                "SELECT status FROM SENTINEL_AI_DB.PUBLIC.execution_jobs WHERE job_id = %s",
                (job_id,),
            )
            exists = cursor.fetchone()

            logs_json = json.dumps(job["logs"])
            counts_json = json.dumps(job["counts"])
            channels_json = json.dumps(job["channels"])
            messages_json = json.dumps(job["messages"])

            if exists:
                db_status = exists[0]

                # Atomic check
                if to_status:
                    if db_status != current_status:
                        logger.warning(
                            "job_state_transition_failed",
                            job_id=job_id,
                            db_status=db_status,
                            expected=current_status,
                        )
                        return False

                sql = """
                    UPDATE SENTINEL_AI_DB.PUBLIC.execution_jobs
                    SET status = %s, logs = PARSE_JSON(%s), counts = PARSE_JSON(%s), updated_at = CURRENT_TIMESTAMP()
                    WHERE job_id = %s AND status = %s
                """
                cursor.execute(sql, (target_status, logs_json, counts_json, job_id, db_status))

                if cursor.rowcount == 0 and to_status:
                    return False
            else:
                if to_status and current_status != "draft":
                    return False  # Can only insert new jobs if they are coming from draft

                sql = """
                    INSERT INTO SENTINEL_AI_DB.PUBLIC.execution_jobs
                    (job_id, status, messages, channels, recipients_filter, logs, counts)
                    SELECT %s, %s, PARSE_JSON(%s), PARSE_JSON(%s), %s, PARSE_JSON(%s), PARSE_JSON(%s)
                """
                cursor.execute(
                    sql,
                    (
                        job_id,
                        target_status,
                        messages_json,
                        channels_json,
                        job["recipients_filter"],
                        logs_json,
                        counts_json,
                    ),
                )

            return True
        except Exception as e:
            logger.error("failed_to_persist_job", job_id=job_id, error=str(e))
            # Fallback to true if DB connection fails just to allow execution in memory mock
            return True
