-- Sentinel AI - Snowflake Schema Initialization
USE ROLE ACCOUNTADMIN;
CREATE OR REPLACE DATABASE SENTINEL_AI_DB;
USE DATABASE SENTINEL_AI_DB;

CREATE OR REPLACE SCHEMA PUBLIC;
USE SCHEMA PUBLIC;

CREATE OR REPLACE TABLE weather_data (
    timestamp TIMESTAMP,
    location STRING,
    rainfall FLOAT,
    wind_speed FLOAT,
    storm_name STRING,
    forecast STRING
);

CREATE OR REPLACE TABLE flood_history (
    barangay STRING,
    date DATE,
    severity STRING,
    water_level FLOAT
);

CREATE OR REPLACE TABLE river_sensors (
    sensor_id STRING,
    barangay STRING,
    water_level FLOAT,
    timestamp TIMESTAMP,
    latitude FLOAT,
    longitude FLOAT,
    critical_threshold FLOAT DEFAULT 8.0,   -- RED ALERT threshold (meters)
    warning_threshold  FLOAT DEFAULT 6.0,   -- ORANGE ALERT threshold (meters)
    alert_level        STRING                -- Computed: RED ALERT / ORANGE ALERT / YELLOW ALERT / NORMAL
);

CREATE OR REPLACE TABLE barangays (
    barangay STRING,
    city STRING,
    population INTEGER,
    latitude FLOAT,
    longitude FLOAT
);

CREATE OR REPLACE TABLE evacuation_centers (
    name STRING,
    capacity INTEGER,
    current_occupancy INTEGER,
    barangay STRING,
    latitude FLOAT,
    longitude FLOAT
);

CREATE OR REPLACE TABLE hospitals (
    hospital STRING,
    beds_available INTEGER,
    barangay STRING,
    latitude FLOAT,
    longitude FLOAT
);

CREATE OR REPLACE TABLE citizen_contacts (
    phone STRING,
    email STRING,
    barangay STRING
);

CREATE OR REPLACE TABLE audit_logs (
    event STRING,
    event_type STRING,
    timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Job Execution Engine tables in Snowflake
CREATE OR REPLACE TABLE execution_jobs (
    job_id STRING PRIMARY KEY,
    status STRING,
    messages VARIANT,
    channels VARIANT,
    recipients_filter STRING,
    logs VARIANT,
    counts VARIANT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

CREATE OR REPLACE TABLE execution_tasks (
    task_id STRING PRIMARY KEY,
    job_id STRING,
    type STRING,
    payload VARIANT,
    status STRING,
    retry_count INTEGER,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Chat Interface conversation history table
CREATE OR REPLACE TABLE chat_history (
    id STRING PRIMARY KEY,
    session_id STRING,
    role STRING,
    content STRING,
    metadata VARIANT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Standard Operating Procedures (SOP) table for Cortex Search
CREATE OR REPLACE TABLE SENTINEL_SOPS (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    category VARCHAR(100),
    content TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
