import snowflake.connector
import structlog

from app.core.config import settings

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
                cursor.close()
            except Exception as e:
                logger.error("failed_to_persist_audit_log", error=str(e))
        else:
            logger.info("mock_audit_log", event=event, type=event_type)

    def get_approved_directives(self) -> list[str]:
        if self.conn:
            try:
                cursor = self.conn.cursor()
                cursor.execute("""
                    SELECT DISTINCT event
                    FROM SENTINEL_AI_DB.PUBLIC.audit_logs
                    WHERE event_type = 'user_approval'
                """)
                rows = cursor.fetchall()
                cursor.close()
                approved = []
                for (evt,) in rows:
                    if evt.startswith("User Approved Directive: "):
                        action = evt.replace("User Approved Directive: ", "")
                        approved.append(action)
                return approved
            except Exception as e:
                logger.error("failed_to_fetch_approved_directives", error=str(e))
        return []

    def get_audit_events(self) -> list[dict]:
        if self.conn:
            try:
                cursor = self.conn.cursor()
                cursor.execute("""
                    SELECT event, event_type, timestamp
                    FROM SENTINEL_AI_DB.PUBLIC.audit_logs
                    ORDER BY timestamp DESC
                    LIMIT 50
                """)
                rows = cursor.fetchall()
                cursor.close()
                events = []
                for evt, evt_type, ts in rows:
                    events.append(
                        {
                            "event": evt,
                            "type": evt_type,
                            "timestamp": ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
                        }
                    )
                return events
            except Exception as e:
                logger.error("failed_to_fetch_audit_events", error=str(e))
        return []


audit_service = AuditService()
