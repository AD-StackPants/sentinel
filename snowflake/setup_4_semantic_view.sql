-- Snowflake Setup Script: Unified Semantic View & Cortex Analyst Model for Telemetry Queries

USE ROLE ACCOUNTADMIN;
USE WAREHOUSE COMPUTE_WH;
CREATE DATABASE IF NOT EXISTS SENTINEL_AI_DB;
USE DATABASE SENTINEL_AI_DB;

CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- Create internal stage if not exists
CREATE STAGE IF NOT EXISTS AGENT_SKILLS_STAGE
  DIRECTORY = (ENABLE = TRUE)
  COMMENT = 'Stage for SentinelAI agent skill and semantic model definitions';

-- 1. Create Unified Relational View joining telemetry, demographics, infrastructure, and hospital metrics
CREATE OR REPLACE VIEW SENTINEL_SEMANTIC_VIEW AS
SELECT 
    b.barangay,
    b.city,
    b.population AS barangay_population,
    b.latitude AS barangay_lat,
    b.longitude AS barangay_lon,
    r.sensor_id,
    r.water_level AS live_river_water_level,
    r.timestamp AS sensor_timestamp,
    w.location AS weather_location,
    w.rainfall AS active_rainfall_mm,
    w.wind_speed AS wind_speed_kph,
    w.storm_name,
    w.forecast AS weather_forecast,
    COALESCE(ec.capacity, 0) AS total_shelter_capacity,
    COALESCE(ec.current_occupancy, 0) AS current_shelter_occupancy,
    COALESCE(h.beds_available, 0) AS hospital_beds_available
FROM barangays b
LEFT JOIN river_sensors r ON b.barangay = r.barangay
LEFT JOIN weather_data w ON b.city = w.location OR w.location LIKE '%Zamboanga%'
LEFT JOIN (
    SELECT barangay, SUM(capacity) AS capacity, SUM(current_occupancy) AS current_occupancy 
    FROM evacuation_centers 
    GROUP BY barangay
) ec ON b.barangay = ec.barangay
LEFT JOIN (
    SELECT barangay, SUM(beds_available) AS beds_available 
    FROM hospitals 
    GROUP BY barangay
) h ON b.barangay = h.barangay;

-- 2. Python Stored Procedure to generate and upload raw unescaped Cortex Analyst Semantic Model YAML
CREATE OR REPLACE PROCEDURE UPLOAD_SEMANTIC_MODEL_YAML()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-snowpark-python')
HANDLER = 'upload_yaml'
AS
$$
def upload_yaml(session):
    yaml_content = '''name: sentinel_semantic_model
description: Sentinel AI disaster telemetry, river sensors, barangays, evacuation centers, and hospital capacity semantic model

tables:
  - name: weather_data
    description: Meteorological telemetry including rainfall and wind speed
    base_table:
      database: SENTINEL_AI_DB
      schema: PUBLIC
      table: weather_data
    dimensions:
      - name: location
        description: City or location name
        expr: location
        data_type: TEXT
      - name: storm_name
        description: PAGASA storm classification
        expr: storm_name
        data_type: TEXT
      - name: forecast
        description: Weather narrative forecast
        expr: forecast
        data_type: TEXT
    measures:
      - name: rainfall
        description: Rainfall amount in millimeters
        expr: rainfall
        data_type: NUMBER
        default_aggregation: sum
      - name: wind_speed
        description: Wind speed in km/h
        expr: wind_speed
        data_type: NUMBER
        default_aggregation: sum

  - name: river_sensors
    description: Real-time water level sensor readings with per-sensor flood alert thresholds and computed alert level
    base_table:
      database: SENTINEL_AI_DB
      schema: PUBLIC
      table: river_sensors
    dimensions:
      - name: sensor_id
        description: River gauge sensor identifier
        expr: sensor_id
        data_type: TEXT
      - name: barangay
        description: Barangay where sensor is located
        expr: barangay
        data_type: TEXT
      - name: alert_level
        description: "Current flood alert classification computed from water level vs thresholds: RED ALERT (>= 8.0m), ORANGE ALERT (>= 6.0m), NORMAL (< 6.0m). Updated by Celery worker every ~60s."
        expr: alert_level
        data_type: TEXT
    measures:
      - name: water_level
        description: Current water level reading in meters (updated by Celery every ~60s)
        expr: water_level
        data_type: NUMBER
        default_aggregation: max
      - name: critical_threshold
        description: RED ALERT water level threshold in meters (default 8.0m per SOP)
        expr: critical_threshold
        data_type: NUMBER
        default_aggregation: max
      - name: warning_threshold
        description: ORANGE ALERT water level threshold in meters (default 6.0m per SOP)
        expr: warning_threshold
        data_type: NUMBER
        default_aggregation: max

  - name: barangays
    description: Barangay population census and locations
    base_table:
      database: SENTINEL_AI_DB
      schema: PUBLIC
      table: barangays
    dimensions:
      - name: barangay
        description: Barangay name
        expr: barangay
        data_type: TEXT
      - name: city
        description: City name
        expr: city
        data_type: TEXT
    measures:
      - name: population
        description: Total resident population
        expr: population
        data_type: NUMBER
        default_aggregation: sum

  - name: evacuation_centers
    description: Evacuation shelter capacity and current occupancy
    base_table:
      database: SENTINEL_AI_DB
      schema: PUBLIC
      table: evacuation_centers
    dimensions:
      - name: name
        description: Evacuation center name
        expr: name
        data_type: TEXT
      - name: barangay
        description: Barangay where shelter is located
        expr: barangay
        data_type: TEXT
    measures:
      - name: capacity
        description: Maximum shelter capacity
        expr: capacity
        data_type: NUMBER
        default_aggregation: sum
      - name: current_occupancy
        description: Current occupied headcount
        expr: current_occupancy
        data_type: NUMBER
        default_aggregation: sum

  - name: hospitals
    description: Hospital healthcare infrastructure and bed availability
    base_table:
      database: SENTINEL_AI_DB
      schema: PUBLIC
      table: hospitals
    dimensions:
      - name: hospital
        description: Hospital facility name
        expr: hospital
        data_type: TEXT
      - name: barangay
        description: Barangay where hospital is located
        expr: barangay
        data_type: TEXT
    measures:
      - name: beds_available
        description: Available hospital beds count
        expr: beds_available
        data_type: NUMBER
        default_aggregation: sum
'''
    import os, tempfile
    # Use a fixed filename so Snowflake stage resolves to exactly:
    #   @AGENT_SKILLS_STAGE/sentinel_semantic_model.yaml
    # (Random tempfile names cause Snowflake to append the local basename as a sub-path)
    tmp_dir = tempfile.gettempdir()
    tmp_path = os.path.join(tmp_dir, 'sentinel_semantic_model.yaml')
    with open(tmp_path, 'w') as f:
        f.write(yaml_content)
    
    session.file.put(tmp_path, '@AGENT_SKILLS_STAGE/', auto_compress=False, overwrite=True)
    return 'SUCCESS'
$$;

CALL UPLOAD_SEMANTIC_MODEL_YAML();
