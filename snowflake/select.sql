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
-- SentinelAI Cortex Agent — Optimized AGENT_RUN Queries
-- ============================================================
-- OPTIMIZATION NOTES:
--   • Session variables ($TOOLS_BOTH, $TOOL_RESOURCES, etc.) eliminate config repetition
--   • Queries that don't need SOP lookup use TOOLS_DATA_ONLY (saves ~5-15s per call)
--   • Sample 7 (incident brief) split into focused sub-queries for parallelism

-- ────────────────────────────────────────────────────────────
-- Sample 1: Inline Telemetry Evaluation
-- Tools used: sop_search + sentinel_data (needs SOP thresholds)
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_BOTH || ',
      "tool_resources": ' || $TOOL_RESOURCES || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Assess flood risk for Tumaga river level 8.8m and rainfall 175mm against SOP thresholds."}]}]
    }',
    FALSE
) AS s1_inline_telemetry;

-- ────────────────────────────────────────────────────────────
-- Sample 2: Live Sensor Dashboard
-- Tools used: sentinel_data only
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_DATA_ONLY || ',
      "tool_resources": ' || $TOOL_RESOURCES_DATA_ONLY || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "What is the current water level and flood risk status for all monitored rivers from the latest sensor readings?"}]}]
    }',
    FALSE
) AS s2_live_sensor_dashboard;

-- ────────────────────────────────────────────────────────────
-- Sample 3: Evacuation Center Capacity Planning
-- Tools used: sentinel_data only
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_DATA_ONLY || ',
      "tool_resources": ' || $TOOL_RESOURCES_DATA_ONLY || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Which evacuation centers have available capacity? Rank by remaining slots and show which are nearest to barangays under RED or ORANGE ALERT."}]}]
    }',
    FALSE
) AS s3_evacuation_capacity;

-- ────────────────────────────────────────────────────────────
-- Sample 4: Tactical Resource Deployment Prescription
-- Tools used: sop_search + sentinel_data (SOP defines resource ratios)
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_BOTH || ',
      "tool_resources": ' || $TOOL_RESOURCES || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Based on current alert levels and affected populations, what is the minimum rescue teams, boats, and medical units needed per SOP guidelines?"}]}]
    }',
    FALSE
) AS s4_resource_deployment;

-- ────────────────────────────────────────────────────────────
-- Sample 5: SMS & Email Alert Generation
-- Tools used: sop_search + sentinel_data
--   sop_search: SOP-ALERT-03 defines SMS format (<160 chars) and email
--               broadcast protocol — required for protocol-compliant output
--   sentinel_data: retrieves evacuation center names from DB
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_BOTH || ',
      "tool_resources": ' || $TOOL_RESOURCES || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Generate an SMS alert (under 160 chars) and a formal email advisory for Tumaga RED ALERT evacuation. Include evacuation center names and CDRRMO hotline."}]}]
    }',
    FALSE
) AS s5_alert_generation;

-- ────────────────────────────────────────────────────────────
-- Sample 6: Population Impact Assessment
-- Tools used: sentinel_data only (population data is in DB)
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_DATA_ONLY || ',
      "tool_resources": ' || $TOOL_RESOURCES_DATA_ONLY || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "How many residents are at risk in RED and ORANGE ALERT barangays? Break down total population per barangay."}]}]
    }',
    FALSE
) AS s6_population_impact;

-- ────────────────────────────────────────────────────────────
-- Sample 7: Full Incident Brief (split into 3 focused sub-queries)
-- The original 6-part compound prompt forced many sequential tool calls
-- inside a single agent turn. Splitting reduces latency and allows each
-- sub-query to be run independently or in parallel.
-- ────────────────────────────────────────────────────────────

-- 7a: Situation Awareness — alert levels, populations, shelter capacity
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_DATA_ONLY || ',
      "tool_resources": ' || $TOOL_RESOURCES_DATA_ONLY || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "List all barangays under RED or ORANGE ALERT with current water levels, affected population, and available evacuation center capacity."}]}]
    }',
    FALSE
) AS s7a_situation_awareness;

-- 7b: Resource Prescription — rescue teams & boats per SOP ratios (requires sop_search)
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_BOTH || ',
      "tool_resources": ' || $TOOL_RESOURCES || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Per SOP guidelines, prescribe rescue teams and boats needed for current RED/ORANGE ALERT barangays. Include hospital bed availability."}]}]
    }',
    FALSE
) AS s7b_resource_prescription;

-- 7c: Communications — SMS broadcast draft for RED ALERT barangays
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_DATA_ONLY || ',
      "tool_resources": ' || $TOOL_RESOURCES_DATA_ONLY || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Draft an SMS broadcast (under 160 chars) for all RED ALERT barangays with evacuation instructions."}]}]
    }',
    FALSE
) AS s7c_sms_broadcast;

-- ────────────────────────────────────────────────────────────
-- Sample 8: Healthcare & Hospital Surge Coordination
-- Tools used: sop_search + sentinel_data (SOP defines pre-positioning rules)
-- ────────────────────────────────────────────────────────────
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{
      "agent": "SentinelAI",
      "tools": ' || $TOOLS_BOTH || ',
      "tool_resources": ' || $TOOL_RESOURCES || ',
      "messages": [{"role": "user", "content": [{"type": "text",
        "text": "Rank hospitals by available beds. Which are closest to Tumaga, Sta. Maria, Tugbungan? How should medical resources be pre-positioned per SOP?"}]}]
    }',
    FALSE
) AS s8_hospital_surge;
