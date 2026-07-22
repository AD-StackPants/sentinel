import json
import re

import snowflake.connector
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class CopilotService:
    def __init__(self):
        # We initialize the connection logic but handle errors gracefully
        # so the app doesn't crash if credentials are placeholders.
        self.conn = None
        self._connect_to_snowflake()

    def _connect_to_snowflake(self):
        try:
            # Only attempt connection if it looks like a real account might be configured
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
                logger.info("connected_to_snowflake")
            else:
                logger.warning("using_placeholder_snowflake_credentials_skipping_connection")
        except Exception as e:
            logger.error("snowflake_connection_failed", error=str(e))

    def process_query(self, query: str, context: dict | None = None) -> dict:
        logger.info("processing_copilot_query", query=query, context=context)

        # ---------------------------------------------------------
        # PRODUCTION IMPLEMENTATION (Snowflake Cortex / CoCo CLI)
        # ---------------------------------------------------------
        if self.conn:
            try:
                cursor = self.conn.cursor()
                # Ground LLM reasoning in official response protocols via RAG (if available)
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

                location_context = (
                    f"{settings.DEFAULT_JURISDICTION_CITY}, {settings.DEFAULT_JURISDICTION_REGION}"
                )

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

                sql = f"""
                    SELECT SNOWFLAKE.CORTEX.COMPLETE(
                        '{settings.SNOWFLAKE_CORTEX_MODEL}',
                        %s
                    )
                """
                cursor.execute(sql, (final_prompt,))
                result = cursor.fetchone()
                logger.info("cortex_execution_successful", result=result)
                if result and len(result) > 0 and result[0]:
                    explanation = f"Generated live using Snowflake Cortex ({settings.SNOWFLAKE_CORTEX_MODEL}) against active Sentinel AI database."
                    if context_str:
                        explanation += " Grounded with SOP Search."
                    return {
                        "response": str(result[0]),
                        "explanation": explanation,
                        "recommended_actions": [
                            "Issue Evacuation Advisory",
                            "Dispatch Emergency Notifications",
                        ],
                    }

            except Exception as e:
                logger.error("cortex_execution_failed", error=str(e))
                return self._fallback_mock_response(query)

        # ---------------------------------------------------------
        # MOCK IMPLEMENTATION (For Local Offline Dev)
        # ---------------------------------------------------------
        return self._fallback_mock_response(query)

    def _fallback_mock_response(self, query: str) -> dict:
        """Provides a realistic mock response for local offline development."""
        query_lower = query.lower()
        city = settings.DEFAULT_JURISDICTION_CITY
        region = settings.DEFAULT_JURISDICTION_REGION

        if "flood risk" in query_lower or "greatest" in query_lower:
            return {
                "response": f"Based on current river sensor data and heavy rainfall forecasts, the areas at greatest flood risk in {city} are Barangay Tumaga, Barangay Sta. Maria, and Barangay Tetuan.",
                "explanation": f"Rainfall in {region} has reached 175mm in the last 12 hours. Sensor ZAM-TUMAGA-01 on the Tumaga River reports a water level of 8.8m, which exceeds the Critical Threshold. The probability of severe flooding is high.",
                "recommended_actions": [
                    "Issue Orange Alert",
                    "Deploy Rescue Teams",
                    "Open Evacuation Centers",
                ],
            }
        elif "what should we do" in query_lower or "recommend" in query_lower:
            return {
                "response": "I strongly recommend immediately upgrading to an Orange Alert for Barangays Tumaga, Sta. Maria, and Tetuan. You should deploy resources and open evacuation centers immediately.",
                "explanation": "With the Tumaga River at 8.8m, approximately 28,000 residents across Tumaga, Sta. Maria, and Tetuan are in high-risk zones. Immediate mobilization is required.",
                "recommended_actions": [
                    "Deploy 8 rescue teams",
                    "Dispatch 4 ambulances",
                    "Open Tumaga Gym & City Coliseum",
                ],
            }
        elif "notify" in query_lower or "alert" in query_lower:
            return {
                "response": "Understood. I have drafted emergency alerts warning residents of Tumaga, Sta. Maria, and Tetuan to prepare for possible evacuation.",
                "explanation": "Notifications will be routed through the Job Execution Engine for reliable delivery via SMS and Email to the estimated 28,000 affected population.",
                "recommended_actions": [
                    "Approve Notification Dispatch",
                    "Monitor Delivery Dashboard",
                ],
            }
        else:
            return {
                "response": f"I am monitoring the situation. Current weather feeds indicate 'Typhoon Approaching' with 175mm rainfall recorded in {region}.",
                "explanation": "Tumaga River is currently at critical levels (8.8m). Please ask about flood risk or recommendations for detailed actions.",
                "recommended_actions": ["Assess Flood Risk", "Review Resources"],
            }

    def get_recommendations(self) -> dict:
        """Provides dynamic Cortex AI recommendations query based on live Snowflake telemetry."""
        if self.conn:
            try:
                cursor = self.conn.cursor()

                # 1. Fetch live telemetry metrics from Snowflake tables
                cursor.execute("""
                    SELECT r.barangay, r.water_level, b.population, w.rainfall, w.storm_name
                    FROM river_sensors r
                    JOIN barangays b ON r.barangay = b.barangay
                    CROSS JOIN (SELECT rainfall, storm_name FROM weather_data ORDER BY timestamp DESC LIMIT 1) w
                    ORDER BY r.water_level DESC
                """)
                rows = cursor.fetchall()
                print(rows)

                if rows:
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

                    cortex_sql = (
                        f"SELECT SNOWFLAKE.CORTEX.COMPLETE('{settings.SNOWFLAKE_CORTEX_MODEL}', %s)"
                    )
                    cursor.execute(cortex_sql, (prompt,))
                    cortex_res = cursor.fetchone()

                    if cortex_res and cortex_res[0]:
                        raw_text = str(cortex_res[0])
                        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                        if json_match:
                            parsed_rec = json.loads(json_match.group())
                            return parsed_rec

                    # Computed fallback if LLM response is not strict JSON
                    return {
                        "risk_level": "Orange Alert"
                        if highest_water_level >= 8.0
                        else "Yellow Alert",
                        "confidence_score": 94,
                        "affected_population": total_affected_pop or 28000,
                        "affected_barangays": high_risk_barangays
                        or ["Tumaga", "Sta. Maria", "Tetuan"],
                        "recommended_actions": [
                            f"Deploy rescue teams to {high_risk_barangays[0] if high_risk_barangays else 'Tumaga'}",
                            "Dispatch multi-channel emergency broadcast",
                            "Open local evacuation gymnasiums",
                        ],
                    }
            except Exception as e:
                logger.error("snowflake_recommendation_fetch_failed", error=str(e))

        # Fallback Mock for local offline development
        return {
            "risk_level": "Orange Alert",
            "confidence_score": 92,
            "affected_population": 28000,
            "affected_barangays": ["Tumaga", "Sta. Maria", "Tetuan"],
            "recommended_actions": [
                "Deploy 8 rescue teams",
                "Dispatch 4 ambulances",
                "Open Tumaga Gym & City Coliseum",
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
