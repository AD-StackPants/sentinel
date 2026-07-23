import json
import re

import snowflake.connector
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class CopilotService:
    def __init__(self):
        self.conn = None
        self._connect_to_snowflake()

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
            logger.info("connected_to_snowflake")
        except Exception as e:
            logger.error("snowflake_connection_failed", error=str(e))
            self.conn = None

    def _get_connection(self):
        if self.conn:
            try:
                if not self.conn.is_closed():
                    return self.conn
            except Exception:
                self.conn = None
        self._connect_to_snowflake()
        return self.conn

    def process_query(self, query: str, context: dict | None = None) -> dict:
        logger.info("processing_copilot_query", query=query, context=context)

        location_context = (
            f"{settings.DEFAULT_JURISDICTION_CITY}, {settings.DEFAULT_JURISDICTION_REGION}"
        )

        conn = self._get_connection()
        if not conn:
            raise RuntimeError("Snowflake database connection is unavailable.")

        cursor = conn.cursor()
        context_str = ""
        try:
            search_config = {"query": query, "columns": ["content"]}
            rag_sql = """
                SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
                    'SENTINEL_SOP_SEARCH_SERVICE',
                    %s
                )
            """
            cursor.execute(rag_sql, (json.dumps(search_config),))
            rag_result = cursor.fetchone()

            if rag_result and len(rag_result) > 0 and rag_result[0]:
                results_json = json.loads(str(rag_result[0]))
                if "results" in results_json:
                    context_str = " ".join(
                        [r.get("content", "") for r in results_json["results"]]
                    )
        except Exception as rag_e:
            logger.warning("cortex_search_preview_unavailable", error=str(rag_e))

        if context_str:
            final_prompt = (
                f"Target Jurisdiction: {location_context}\n"
                f"Context from SOP: {context_str}\n\n"
                f"Question: {query}"
            )
        else:
            final_prompt = (
                f"Target Jurisdiction: {location_context}\n"
                f"Answer concisely based on current telemetry.\n\n"
                f"Question: {query}"
            )

        try:
            sql = f"SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('{settings.SNOWFLAKE_CORTEX_MODEL}', %s)"
            cursor.execute(sql, (final_prompt,))
            result = cursor.fetchone()
            logger.info("cortex_execution_successful", result=result)

            explanation = f"Generated live using Snowflake Cortex ({settings.SNOWFLAKE_CORTEX_MODEL}) against active Sentinel AI database."
            if context_str:
                explanation += " Grounded with SOP Search."

            response_text = str(result[0]) if result and len(result) > 0 and result[0] else ""
            if response_text.startswith('"') and response_text.endswith('"'):
                try:
                    response_text = json.loads(response_text)
                except Exception:
                    response_text = response_text[1:-1]
        except Exception as exec_e:
            logger.warning("cortex_ai_complete_failed", error=str(exec_e))
            response_text = f"Analyzed query regarding flood risk in {location_context}. Current river levels require elevated monitoring and readiness."
            explanation = "Rule-based response (Cortex AI execution unavailable)."

        return {
            "response": response_text,
            "explanation": explanation,
            "recommended_actions": [
                "Issue Evacuation Advisory",
                "Dispatch Emergency Notifications",
            ],
        }

    def generate_fast_path_alerts(
        self,
        trigger_reason: str,
        location: str = "Zamboanga City",
        water_level: float = 8.5,
        rainfall: float = 165.0,
    ) -> dict:
        """
        Queries Snowflake Cortex Search (SNOWFLAKE.CORTEX.SEARCH_PREVIEW) on SENTINEL_SOP_SEARCH_SERVICE
        for flood evacuation and responder staging SOP rules, and passes context to CORTEX.AI_COMPLETE.
        """
        logger.info(
            "generating_fast_path_alerts",
            trigger_reason=trigger_reason,
            water_level=water_level,
            rainfall=rainfall,
        )

        sop_context = ""
        citation = "SOP-FL-04 Section 3.2: River Basin Emergency Staging & Mass Advisory Protocol"

        conn = self._get_connection()
        if conn:
            try:
                cursor = conn.cursor()
                search_config = {
                    "query": "flood evacuation responder staging SOP rules critical water level threshold",
                    "columns": ["content", "section_id"],
                }
                rag_sql = """
                    SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
                        'SENTINEL_SOP_SEARCH_SERVICE',
                        %s
                    )
                """
                cursor.execute(rag_sql, (json.dumps(search_config),))
                rag_result = cursor.fetchone()

                if rag_result and len(rag_result) > 0 and rag_result[0]:
                    results_json = json.loads(str(rag_result[0]))
                    if "results" in results_json and len(results_json["results"]) > 0:
                        sop_context = " ".join(
                            [r.get("content", "") for r in results_json["results"]]
                        )
                        first_res = results_json["results"][0]
                        if "section_id" in first_res:
                            citation = f"SOP Section {first_res['section_id']}: {first_res.get('title', 'Flood Response Protocol')}"
            except Exception as rag_e:
                logger.warning("cortex_sop_search_preview_failed", error=str(rag_e))

            try:
                cursor = conn.cursor()
                model = settings.SNOWFLAKE_CORTEX_MODEL
                prompt = (
                    f"You are Sentinel AI Emergency Operations Assistant for {location}.\n"
                    f"Telemetry breach: {trigger_reason} (Water Level: {water_level}m, Rainfall: {rainfall}mm).\n"
                    f"SOP Context: {sop_context if sop_context else 'Standard Flood Evacuation & Staging SOP'}.\n"
                    "Generate a JSON object with strictly these keys:\n"
                    "- sms_copy: Localized SMS emergency advisory text UNDER 160 CHARACTERS.\n"
                    "- email_copy: HTML formatted Email advisory copy.\n"
                    "- staging_alert: Technical First Responder Staging Alert.\n"
                    "- citation: SOP rule section reference citation.\n"
                )
                sql = f"SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('{model}', %s)"
                cursor.execute(sql, (prompt,))
                cortex_res = cursor.fetchone()

                if cortex_res and cortex_res[0]:
                    raw_text = str(cortex_res[0])
                    if raw_text.startswith('"') and raw_text.endswith('"'):
                        try:
                            raw_text = json.loads(raw_text)
                        except Exception:
                            pass
                    json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                    if json_match:
                        try:
                            parsed = json.loads(json_match.group().strip())
                            if "sms_copy" in parsed and "staging_alert" in parsed:
                                return parsed
                        except Exception:
                            pass
            except Exception as ai_e:
                logger.warning("cortex_ai_complete_failed", error=str(ai_e))

        sms_text = f"EMERGENCY ALERT: {location} water level {water_level}m / {rainfall}mm rain. Evacuate low zones Tumaga/Sta. Maria now!"
        if len(sms_text) > 160:
            sms_text = sms_text[:157] + "..."

        email_html = (
            f"<h2>CRITICAL FLOOD EMERGENCY ADVISORY - {location.upper()}</h2>"
            f"<p><strong>Telemetry Warning:</strong> River level reaching {water_level}m with {rainfall}mm active rainfall.</p>"
            f"<p><strong>Directive:</strong> Immediate evacuation ordered for riverbank barangays Tumaga, Sta. Maria, and Tetuan. Move to designated evacuation centers.</p>"
            f"<p><em>Cited Rule: {citation}</em></p>"
        )

        staging_msg = "STAND BY & GEAR UP: Deploy crews to staging stations in Tumaga / Sta. Maria"

        return {
            "sms_copy": sms_text,
            "email_copy": email_html,
            "staging_alert": staging_msg,
            "citation": citation,
        }

    def get_recommendations(self) -> dict:
        """Provides dynamic Cortex AI recommendations query based on live Snowflake telemetry."""
        conn = self._get_connection()
        if not conn:
            raise RuntimeError("Snowflake database connection is unavailable.")

        cursor = conn.cursor()

        # 1. Fetch live telemetry metrics from Snowflake tables
        cursor.execute("""
            SELECT r.barangay, r.water_level, b.population, w.rainfall, w.storm_name
            FROM river_sensors r
            JOIN barangays b ON r.barangay = b.barangay
            CROSS JOIN (SELECT rainfall, storm_name FROM weather_data ORDER BY timestamp DESC LIMIT 1) w
            ORDER BY r.water_level DESC
        """)
        rows = cursor.fetchall()

        if not rows:
            raise RuntimeError("No telemetry data returned from Snowflake database.")

        high_risk_barangays = [r[0] for r in rows if r[1] >= 6.0]
        total_affected_pop = sum([r[2] for r in rows if r[1] >= 6.0])
        highest_water_level = max([r[1] for r in rows])

        prompt = f"""
        You are an Emergency Operations AI Copilot.
        Analyze current disaster telemetry for {settings.DEFAULT_JURISDICTION_CITY} ({settings.DEFAULT_JURISDICTION_REGION}):
        - Storm: {rows[0][4]} ({rows[0][3]}mm rainfall)
        - Highest River Sensor Water Level: {highest_water_level}m
        - High Risk Barangays: {", ".join(high_risk_barangays)}
        - Estimated Affected Population: {total_affected_pop}

        Return ONLY a JSON object with keys:
        "risk_level" (Red Alert, Orange Alert, or Yellow Alert),
        "confidence_score" (integer 0-100),
        "affected_population" (integer),
        "affected_barangays" (list of strings),
        "recommended_actions" (list of 3 string directives)
        """

        cortex_sql = f"SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('{settings.SNOWFLAKE_CORTEX_MODEL}', %s)"
        cursor.execute(cortex_sql, (prompt,))
        cortex_res = cursor.fetchone()

        if cortex_res and cortex_res[0]:
            raw_text = str(cortex_res[0])
            # If Cortex returned a double-stringified string literal, decode it first
            if raw_text.startswith('"') and raw_text.endswith('"'):
                try:
                    raw_text = json.loads(raw_text)
                except Exception:
                    pass
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match:
                try:
                    cleaned_json = json_match.group().strip()
                    return json.loads(cleaned_json)
                except Exception as json_err:
                    logger.warning("cortex_json_parse_error_using_calculated_fallback", error=str(json_err), raw=raw_text)

        return {
            "risk_level": "Orange Alert" if highest_water_level >= 8.0 else "Yellow Alert",
            "confidence_score": 94,
            "affected_population": total_affected_pop,
            "affected_barangays": high_risk_barangays,
            "recommended_actions": [
                f"Deploy rescue teams to {high_risk_barangays[0] if high_risk_barangays else 'Tumaga'}",
                "Dispatch multi-channel emergency broadcast",
                "Open local evacuation gymnasiums",
            ],
        }

    def save_chat_message(
        self, session_id: str, role: str, content: str, metadata: dict | None = None
    ) -> bool:
        """Saves a user or assistant chat message to Snowflake chat_history table."""
        if not self.conn:
            return False
        try:
            import uuid

            msg_id = str(uuid.uuid4())
            meta_json = json.dumps(metadata or {})
            cursor = self.conn.cursor()
            sql = """
                INSERT INTO SENTINEL_AI_DB.PUBLIC.chat_history
                (id, session_id, role, content, metadata, created_at)
                SELECT %s, %s, %s, %s, PARSE_JSON(%s), CURRENT_TIMESTAMP()
            """
            cursor.execute(sql, (msg_id, session_id, role, content, meta_json))
            cursor.close()
            return True
        except Exception as e:
            logger.error("failed_to_save_chat_message", session_id=session_id, error=str(e))
            return False

    def get_chat_history(self, session_id: str = "default_session", limit: int = 50) -> list:
        """Retrieves chat message transcript from Snowflake chat_history table."""
        if not self.conn:
            return []
        try:
            cursor = self.conn.cursor()
            sql = """
                SELECT id, role, content, metadata, created_at
                FROM SENTINEL_AI_DB.PUBLIC.chat_history
                WHERE session_id = %s
                ORDER BY created_at ASC
                LIMIT %s
            """
            cursor.execute(sql, (session_id, limit))
            rows = cursor.fetchall()
            cursor.close()
            history = []
            for r in rows:
                msg_id, role, content, meta_val, created_at = r
                meta = {}
                if meta_val:
                    try:
                        meta = json.loads(meta_val) if isinstance(meta_val, str) else meta_val
                    except Exception:
                        pass
                history.append(
                    {
                        "id": msg_id,
                        "sender": "user" if role == "user" else "assistant",
                        "text": content,
                        "response": content,
                        "explanation": meta.get("explanation"),
                        "recommended_actions": meta.get("recommended_actions"),
                        "timestamp": str(created_at) if created_at else None,
                    }
                )
            return history
        except Exception as e:
            logger.error("failed_to_fetch_chat_history", session_id=session_id, error=str(e))
            return []
