import re

file_path = 'backend/app/tasks/ingestion_tasks.py'
with open(file_path, 'r') as f:
    content = f.read()

# Replace httpx client call with direct internal service call inside fast_path_trigger
replacement = """
            # 4. Trigger JobExecutionService internally
            try:
                from app.api.jobs import job_service
                import asyncio

                messages = [sms_text, email_text, responder_alert]

                # job_service is a singleton used in API
                # create_job is async
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                job_id = loop.run_until_complete(
                    job_service.create_job(
                        messages=messages,
                        channels=["sms", "email"],
                        recipients_filter="high_risk_zones"
                    )
                )
                logger.info(f"Triggered Fast-Path Auto Alert System internally. Job ID: {job_id}")
            except Exception as e:
                logger.error(f"Failed to post internal job: {e}")
"""

content = re.sub(
    r"# 4\. Trigger JobExecutionService via API.*?logger\.error\(f\"Failed to post job to API: \{e\}\"\)",
    replacement.strip(),
    content,
    flags=re.DOTALL
)

with open(file_path, 'w') as f:
    f.write(content)
