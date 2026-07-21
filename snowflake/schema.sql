-- Sentinel AI - Snowflake Schema Initialization

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
    timestamp TIMESTAMP
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
    barangay STRING
);

CREATE OR REPLACE TABLE hospitals (
    hospital STRING,
    beds_available INTEGER,
    barangay STRING
);

CREATE OR REPLACE TABLE citizen_contacts (
    phone STRING,
    email STRING,
    barangay STRING
);

-- Optional: Create Job Execution Engine tables in Snowflake if it acts as a data store for the engine.
CREATE OR REPLACE TABLE execution_jobs (
    job_id STRING PRIMARY KEY,
    status STRING,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE OR REPLACE TABLE execution_tasks (
    task_id STRING PRIMARY KEY,
    job_id STRING,
    type STRING,
    payload VARIANT,
    status STRING,
    retry_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
