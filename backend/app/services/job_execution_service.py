import structlog
import uuid
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client
from app.core.config import settings
import asyncio

logger = structlog.get_logger()

class JobExecutionService:
    def __init__(self):
        # In a real app, this would be backed by Redis/Celery or Snowflake tables
        self.jobs_db = {}

    async def create_job(self, messages: list[str], channels: list[str], recipients_filter: str) -> str:
        job_id = str(uuid.uuid4())
        self.jobs_db[job_id] = {
            "status": "queued",
            "messages": messages,
            "channels": channels,
            "recipients_filter": recipients_filter,
            "logs": [],
            "counts": {"sms": 0, "email": 0}
        }

        logger.info("job_created", job_id=job_id, channels=channels, filter=recipients_filter)

        # Start background processing for the mock
        asyncio.create_task(self.process_job_mock(job_id))

        return job_id

    async def process_job_mock(self, job_id: str):
        """Simulates processing a job over time and updates the DB."""
        if job_id not in self.jobs_db:
            return

        self.jobs_db[job_id]["status"] = "processing"
        logger.info("job_processing_started", job_id=job_id)

        job = self.jobs_db[job_id]

        # Simulate delay for processing
        await asyncio.sleep(1)

        for channel in job["channels"]:
            if channel == "sms":
                self._dispatch_sms(job["messages"], job["recipients_filter"])
                job["logs"].append(f"[SMS] Attempting to deliver 1,200 messages to {job['recipients_filter']}...")
                await asyncio.sleep(1.5)
                job["counts"]["sms"] = 1200
                job["logs"].append("[SMS] Successfully dispatched 1,200 SMS messages.")
            elif channel == "email":
                self._dispatch_email(job["messages"], job["recipients_filter"])
                job["logs"].append(f"[Email] Attempting to deliver 3,500 messages to {job['recipients_filter']}...")
                await asyncio.sleep(1.5)
                job["counts"]["email"] = 3500
                job["logs"].append("[Email] Successfully dispatched 3,500 Email messages.")

        await asyncio.sleep(0.5)
        self.jobs_db[job_id]["status"] = "completed"
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
        """Production grade SMS dispatcher (Commented out for Hackathon)."""
        logger.info("dispatching_sms", target=recipients_filter)
        # ---------------------------------------------------------
        # PRODUCTION IMPLEMENTATION (Twilio)
        # ---------------------------------------------------------
        # if settings.TWILIO_ACCOUNT_SID != "placeholder_twilio_sid":
        #     client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        #     # In reality, fetch recipients from DB based on recipients_filter
        #     mock_phone_numbers = ["+639171234567"]
        #     for phone in mock_phone_numbers:
        #         try:
        #             message = client.messages.create(
        #                 body=messages[0], # Sending the first message in the list
        #                 from_=settings.TWILIO_PHONE_NUMBER,
        #                 to=phone
        #             )
        #             logger.info("sms_sent", sid=message.sid, to=phone)
        #         except Exception as e:
        #             logger.error("sms_failed", to=phone, error=str(e))
        pass

    def _dispatch_email(self, messages: list[str], recipients_filter: str):
        """Production grade Email dispatcher (Commented out for Hackathon)."""
        logger.info("dispatching_email", target=recipients_filter)
        # ---------------------------------------------------------
        # PRODUCTION IMPLEMENTATION (SMTP)
        # ---------------------------------------------------------
        # if settings.SMTP_USER != "placeholder_smtp_user":
        #     # In reality, fetch recipients from DB based on recipients_filter
        #     mock_emails = ["citizen@example.com"]
        #     try:
        #         server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        #         server.starttls()
        #         server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        #         for email_addr in mock_emails:
        #             msg = MIMEText(messages[0])
        #             msg['Subject'] = 'EMERGENCY ADVISORY: Sentinel AI'
        #             msg['From'] = settings.SMTP_FROM_EMAIL
        #             msg['To'] = email_addr
        #             server.send_message(msg)
        #             logger.info("email_sent", to=email_addr)
        #         server.quit()
        #     except Exception as e:
        #         logger.error("email_dispatch_failed", error=str(e))
        pass
