-- Sentinel AI — Snowflake verification, direct SQL queries, and Cortex Agent sample calls

USE ROLE ACCOUNTADMIN;
USE WAREHOUSE COMPUTE_WH;
CREATE DATABASE IF NOT EXISTS SENTINEL_AI_DB;
USE DATABASE SENTINEL_AI_DB;

CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- ============================================================
-- Session variables — reusable AGENT_RUN tool configurations
-- NOTE: These SET statements require an active Snowflake session.
--       Run this file interactively in Snowsight or via `snow sql -f`
--       (not as individual statement snippets).
-- ============================================================
SET TOOLS_BOTH = '[
  {"tool_spec": {"type": "cortex_search",            "name": "sop_search"}},
  {"tool_spec": {"type": "cortex_analyst_text_to_sql", "name": "sentinel_data"}}
]';

SET TOOLS_DATA_ONLY = '[
  {"tool_spec": {"type": "cortex_analyst_text_to_sql", "name": "sentinel_data"}}
]';

SET TOOL_RESOURCES = '{
  "sop_search": {"search_service": "SENTINEL_AI_DB.PUBLIC.SENTINEL_SOP_SEARCH_SERVICE"},
  "sentinel_data": {
    "semantic_model_file": "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/sentinel_semantic_model.yaml",
    "execution_environment": {"type": "warehouse", "warehouse": "COMPUTE_WH"}
  }
}';

SET TOOL_RESOURCES_DATA_ONLY = '{
  "sentinel_data": {
    "semantic_model_file": "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/sentinel_semantic_model.yaml",
    "execution_environment": {"type": "warehouse", "warehouse": "COMPUTE_WH"}
  }
}';

-- ============================================================
-- Direct SQL Queries (sections 1–9)
-- These query Snowflake tables directly without the Cortex Agent.
-- Use these for raw data inspection, dashboarding, and debugging.
-- ============================================================

-- 1. Active Weather & Meteorological Overview (select only needed columns)
SELECT
    timestamp,
    location,
    rainfall,
    wind_speed,
    storm_name,
    forecast
FROM weather_data
WHERE timestamp >= DATEADD('hour', -24, CURRENT_TIMESTAMP())
ORDER BY timestamp DESC
LIMIT 5;

-- 2. Live Telemetry & Risk Assessment (filtered to latest readings only)
SELECT
    r.sensor_id,
    r.barangay,
    r.water_level,
    r.alert_level,
    CASE
        WHEN r.water_level >= r.critical_threshold THEN 'Critical (Red Alert)'
        WHEN r.water_level >= r.warning_threshold THEN 'High Warning (Orange Alert)'
        ELSE 'Normal'
    END AS status,
    b.population,
    r.latitude,
    r.longitude
FROM river_sensors r
JOIN barangays b ON r.barangay = b.barangay
WHERE r.timestamp >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
ORDER BY r.water_level DESC;

-- 3. Evacuation Centers Capacity & Occupancy Rates
SELECT
    name,
    barangay,
    capacity,
    current_occupancy,
    ROUND((current_occupancy / capacity) * 100, 1) AS occupancy_pct
FROM evacuation_centers
ORDER BY occupancy_pct DESC;

-- 4. Healthcare Infrastructure & Hospital Bed Availability
SELECT
    hospital,
    barangay,
    beds_available
FROM hospitals
ORDER BY beds_available DESC;

-- 5. Historical Flood Events & Peak Levels
SELECT
    barangay,
    COUNT(*) AS past_floods,
    MAX(water_level) AS peak_water_level
FROM flood_history
GROUP BY barangay
ORDER BY peak_water_level DESC;

-- 6. Recent Audit Events & Directive Approvals
SELECT
    event,
    event_type,
    timestamp
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 20;

-- 7. Emergency Job Dispatch Execution Records
SELECT
    job_id,
    status,
    recipients_filter,
    counts,
    created_at
FROM execution_jobs
ORDER BY created_at DESC
LIMIT 10;

-- 8. Copilot Chat Session History Records
SELECT
    id,
    session_id,
    role,
    content,
    metadata,
    created_at
FROM chat_history
ORDER BY created_at ASC
LIMIT 50;

-- 9. Standard Operating Procedures (limited scan)
SELECT content, category, created_at
FROM SENTINEL_SOPS
ORDER BY created_at ASC
LIMIT 100;

-- Cortex Search verification
SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'SENTINEL_SOP_SEARCH_SERVICE',
    '{"query": "evacuation thresholds", "columns": ["content"]}'
);

-- ============================================================
-- 10. Snowflake Cortex Agent — Sample AGENT_RUN Query
-- ============================================================
-- ARCHITECTURAL NOTE:
--   • Production Web/Copilot UI & Dispatch Engine use SNOWFLAKE.CORTEX.AI_COMPLETE
--     + Cortex Search RAG & direct SQL for 1–3s instant response times and human-in-the-loop safety.
--   • SNOWFLAKE.CORTEX.AGENT_RUN is kept below as a 1-query reference sample for testing
--     autonomous multi-tool reasoning (SOP search + Text-to-SQL).

-- Sample AGENT_RUN Reference Query:
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_BOTH || ',
      "tool_resources": ' || $TOOL_RESOURCES || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "What is the current water level and flood risk status for all monitored rivers from the latest sensor readings? Cross-reference with SOP thresholds."}]}]
    }',
    FALSE
) AS sample_agent_run;

