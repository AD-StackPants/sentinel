-- Sentinel AI - Snowflake Verification & Testing Queries

USE DATABASE SENTINEL_AI_DB;
USE SCHEMA PUBLIC;

-- 1. Active Weather & Meteorological Overview
SELECT * FROM weather_data 
ORDER BY timestamp DESC 
LIMIT 5;

-- 2. Live Telemetry & Risk Assessment (River Sensors joined with Barangay Demographics)
SELECT 
    r.sensor_id,
    r.barangay,
    r.water_level,
    CASE 
        WHEN r.water_level >= 8.0 THEN 'Critical (Red Alert)'
        WHEN r.water_level >= 6.0 THEN 'High Warning (Orange Alert)'
        ELSE 'Normal'
    END AS status,
    b.population,
    b.latitude,
    b.longitude
FROM river_sensors r
JOIN barangays b ON r.barangay = b.barangay
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

-- 9. Standard Operating Procedures (SOP) & Cortex Search Verification
SELECT * FROM SENTINEL_SOPS ORDER BY created_at ASC;

SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'SENTINEL_SOP_SEARCH_SERVICE',
    '{"query": "evacuation thresholds", "columns": ["content"]}'
);

-- 10. Snowflake Cortex Agent Execution Verification (SentinelAI Skills)
SELECT SNOWFLAKE.CORTEX.AGENT_RUN(
    '{"agent": "SentinelAI", "messages": [{"role": "user", "content": [{"type": "text", "text": "Assess flood risk for Tumaga river level 8.8m and rainfall 175mm"}]}]}',
    FALSE
) AS agent_response;
