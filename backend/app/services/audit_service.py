import structlog
from app.core.config import settings
import snowflake.connector

logger = structlog.get_logger()

class AuditService:
    def __init__(self):
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
            logger.error("audit_snowflake_connection_failed", error=str(e))

    def log_audit_event(self, event: str, event_type: str):
        if self.conn:
            try:
                cursor = self.conn.cursor()
                sql = """
                    INSERT INTO SENTINEL_AI_DB.PUBLIC.audit_logs (event, event_type)
                    VALUES (%s, %s)
                """
                cursor.execute(sql, (event, event_type))
            except Exception as e:
                logger.error("failed_to_persist_audit_log", error=str(e))
        else:
            logger.info("mock_audit_log", event=event, type=event_type)

audit_service = AuditService()
