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

    def create_job(self, messages: list[str], channels: list[str], recipients_filter: str) -> str:
        job_id = str(uuid.uuid4())
        self.jobs_db[job_id] = {
            "status": "queued",
            "messages": messages,
            "channels": channels,
            "recipients_filter": recipients_filter,
            "logs": []
        }

        logger.info("job_created", job_id=job_id, channels=channels, filter=recipients_filter)

        # Start background processing (simulation)
        # In FastAPI, you would typically use BackgroundTasks, but for this mock we'll use asyncio.create_task
        # Note: If running synchronously, this should be done properly via dependency injection or a task queue.
        # For the hackathon, we will just simulate setting it to processing.

        return job_id

    def process_job_mock(self, job_id: str):
        """Simulates processing a job and updates the DB."""
        if job_id not in self.jobs_db:
            return

        self.jobs_db[job_id]["status"] = "processing"
        logger.info("job_processing_started", job_id=job_id)

        # SIMULATE SENDING
        job = self.jobs_db[job_id]

        for channel in job["channels"]:
            if channel == "sms":
                self._dispatch_sms(job["messages"], job["recipients_filter"])
                job["logs"].append("Dispatched 500 SMS messages.")
            elif channel == "email":
                self._dispatch_email(job["messages"], job["recipients_filter"])
                job["logs"].append("Dispatched 1200 Email messages.")

        self.jobs_db[job_id]["status"] = "completed"
        logger.info("job_completed", job_id=job_id)

    def get_job_status(self, job_id: str) -> dict:
        if job_id not in self.jobs_db:
            return {"job_id": job_id, "status": "not_found", "logs": []}

        # For demo purposes: If we ask for the status of a queued job, let's process it instantly
        # so the UI updates quickly.
        if self.jobs_db[job_id]["status"] == "queued":
            self.process_job_mock(job_id)

        return {
            "job_id": job_id,
            "status": self.jobs_db[job_id]["status"],
            "logs": self.jobs_db[job_id]["logs"]
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
