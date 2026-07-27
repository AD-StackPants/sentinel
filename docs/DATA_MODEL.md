# Sentinel AI — Data Model Reference

> **Document Type:** Database Dictionary
> **Schema:** `SENTINEL_AI_DB.PUBLIC`
> **Version:** 0.1.0
> **Last Updated:** 2026-07-27

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Table: weather_data](#2-table-weather_data)
3. [Table: river_sensors](#3-table-river_sensors)
4. [Table: barangays](#4-table-barangays)
5. [Table: flood_history](#5-table-flood_history)
6. [Table: evacuation_centers](#6-table-evacuation_centers)
7. [Table: hospitals](#7-table-hospitals)
8. [Table: citizen_contacts](#8-table-citizen_contacts)
9. [Table: audit_logs](#9-table-audit_logs)
10. [Table: execution_jobs](#10-table-execution_jobs)
11. [Table: execution_tasks](#11-table-execution_tasks)
12. [Table: chat_history](#12-table-chat_history)
13. [Table: SENTINEL_SOPS (Cortex Search Source)](#13-table-sentinel_sops-cortex-search-source)
14. [View: SENTINEL_SEMANTIC_VIEW](#14-view-sentinel_semantic_view)
15. [Foreign Key Relationships](#15-foreign-key-relationships)
16. [Index Considerations](#16-index-considerations)
17. [Cortex Search RAG Integration](#17-cortex-search-rag-integration)

---

## 1. Schema Overview

The `SENTINEL_AI_DB.PUBLIC` schema contains **11 operational tables** and **1 virtual unified view** serving the Sentinel AI platform. The schema is structured around three logical domains:

```
SENTINEL_AI_DB.PUBLIC
|
|-- TELEMETRY DOMAIN
|   |-- weather_data       (meteorological feed from Open-Meteo / Celery)
|   |-- river_sensors      (IoT gauge readings with per-sensor thresholds)
|   +-- flood_history      (historical flood event records)
|
|-- RESOURCE DOMAIN
|   |-- barangays          (administrative boundaries, census, GPS coords)
|   |-- evacuation_centers (shelter capacity and occupancy)
|   |-- hospitals          (healthcare infrastructure, bed count)
|   +-- citizen_contacts   (SMS/email recipient registry)
|
|-- OPERATIONAL DOMAIN
    |-- audit_logs         (immutable event log for all AI and human actions)
    |-- execution_jobs     (multi-channel dispatch job registry)
    |-- execution_tasks    (per-channel task records within a job)
    |-- chat_history       (copilot session transcript storage)
    +-- SENTINEL_SOPS      (official SOP documents for Cortex Search RAG)
```

**Database Setup Script:** `snowflake/setup_1_schema.sql`
**Seed Data Script:** `snowflake/setup_2_seed.sql`

---

## 2. Table: weather_data

Stores meteorological observations ingested by the Celery weather worker from the Open-Meteo API.

**DDL:**
```sql
CREATE OR REPLACE TABLE weather_data (
    timestamp  TIMESTAMP,
    location   STRING,
    rainfall   FLOAT,
    wind_speed FLOAT,
    storm_name STRING,
    forecast   STRING
);
```

**Column Definitions:**

| Column | Type | Nullable | Description |
|---|---|---|---|
| `timestamp` | TIMESTAMP | YES | UTC ingestion timestamp of the weather reading |
| `location` | STRING | YES | Location label (e.g., `Zamboanga Peninsula`) |
| `rainfall` | FLOAT | YES | Active 12-hour accumulated precipitation in mm |
| `wind_speed` | FLOAT | YES | Wind speed in km/h |
| `storm_name` | STRING | YES | PAGASA storm classification |
| `forecast` | STRING | YES | Human-readable meteorological narrative |

**Key Thresholds:**
- `rainfall >= 150.0` triggers **RED ALERT** Fast-Path
- `rainfall >= 100.0` triggers **YELLOW ALERT**

**Notes:**
- No primary key; append-only time series pattern
- Most recent record retrieved via `ORDER BY timestamp DESC LIMIT 1`

**Seed Example:**
```sql
INSERT INTO weather_data VALUES (
    CURRENT_TIMESTAMP, 'Zamboanga Peninsula',
    175.0, 85.0, 'Typhoon Approaching',
    'Heavy to intense rainfall continuing over next 12-18 hours...'
);
```

---

## 3. Table: river_sensors

Stores real-time IoT river gauge sensor readings with per-sensor configurable flood alert thresholds.

**DDL:**
```sql
CREATE OR REPLACE TABLE river_sensors (
    sensor_id          STRING,
    barangay           STRING,
    water_level        FLOAT,
    timestamp          TIMESTAMP,
    latitude           FLOAT,
    longitude          FLOAT,
    critical_threshold FLOAT DEFAULT 8.0,
    warning_threshold  FLOAT DEFAULT 6.0,
    alert_level        STRING
);
```

**Column Definitions:**

| Column | Type | Default | Description |
|---|---|---|---|
| `sensor_id` | STRING | — | Unique sensor ID: `ZAM-{BARANGAY}-{SEQ}` |
| `barangay` | STRING | — | Barangay where sensor is installed |
| `water_level` | FLOAT | — | Current river gauge reading in meters |
| `timestamp` | TIMESTAMP | — | Reading timestamp |
| `latitude` | FLOAT | — | WGS84 latitude of sensor station |
| `longitude` | FLOAT | — | WGS84 longitude of sensor station |
| `critical_threshold` | FLOAT | `8.0` | RED ALERT trigger level in meters |
| `warning_threshold` | FLOAT | `6.0` | ORANGE ALERT trigger level in meters |
| `alert_level` | STRING | — | Computed: `RED ALERT`, `ORANGE ALERT`, or `NORMAL` |

**Alert Level Derivation:**
```
water_level >= 8.0m  -->  RED ALERT
water_level >= 6.0m  -->  ORANGE ALERT
water_level <  6.0m  -->  NORMAL
```

**Seed Data (12 Active Sensors):**

| sensor_id | barangay | water_level | alert_level |
|---|---|---|---|
| `ZAM-TUMAGA-01` | Tumaga | 8.8m | RED ALERT |
| `ZAM-STAMARIA-01` | Sta. Maria | 7.4m | ORANGE ALERT |
| `ZAM-TETUAN-01` | Tetuan | 6.9m | ORANGE ALERT |
| `ZAM-TUGBUNGAN-01` | Tugbungan | 7.1m | ORANGE ALERT |
| `ZAM-TALONTALON-01` | Talon-Talon | 6.8m | ORANGE ALERT |
| `ZAM-MANICAHAN-01` | Manicahan | 6.2m | ORANGE ALERT |
| `ZAM-PASONANCA-01` | Pasonanca | 4.5m | NORMAL |
| `ZAM-SANJOSE-01` | San Jose Gusu | 5.2m | NORMAL |
| `ZAM-BALIWASAN-01` | Baliwasan | 4.8m | NORMAL |
| `ZAM-MERCEDES-01` | Mercedes | 5.5m | NORMAL |
| `ZAM-AYALA-01` | Ayala | 3.9m | NORMAL |
| `ZAM-VITALI-01` | Vitali | 3.1m | NORMAL |

---

## 4. Table: barangays

Administrative boundary and census reference table providing population demographics and geographic coordinates.

**DDL:**
```sql
CREATE OR REPLACE TABLE barangays (
    barangay  STRING,
    city      STRING,
    population INTEGER,
    latitude  FLOAT,
    longitude FLOAT
);
```

**Column Definitions:**

| Column | Type | Description |
|---|---|---|
| `barangay` | STRING | Barangay name (natural key) |
| `city` | STRING | Parent city/municipality name |
| `population` | INTEGER | Official census total resident population |
| `latitude` | FLOAT | WGS84 centroid latitude |
| `longitude` | FLOAT | WGS84 centroid longitude |

**Seed Data (15 Barangays — Zamboanga City):**

| barangay | city | population |
|---|---|---|
| Tumaga | Zamboanga City | 31,200 |
| Sta. Maria | Zamboanga City | 25,400 |
| Tetuan | Zamboanga City | 29,800 |
| Tugbungan | Zamboanga City | 23,100 |
| Talon-Talon | Zamboanga City | 34,700 |
| Guiwan | Zamboanga City | 16,500 |
| Manicahan | Zamboanga City | 18,100 |
| Pasonanca | Zamboanga City | 21,300 |
| San Jose Gusu | Zamboanga City | 27,900 |
| Baliwasan | Zamboanga City | 26,400 |
| Calarian | Zamboanga City | 31,000 |
| Ayala | Zamboanga City | 22,800 |
| Mercedes | Zamboanga City | 15,600 |
| Curuan | Zamboanga City | 11,800 |
| Vitali | Zamboanga City | 14,200 |

---

## 5. Table: flood_history

Historical flood event archive per barangay for trend analysis and risk scoring.

**DDL:**
```sql
CREATE OR REPLACE TABLE flood_history (
    barangay    STRING,
    date        DATE,
    severity    STRING,
    water_level FLOAT
);
```

| Column | Type | Description |
|---|---|---|
| `barangay` | STRING | Affected barangay |
| `date` | DATE | Date of the historical flood event |
| `severity` | STRING | `Major`, `Moderate`, or `Minor` |
| `water_level` | FLOAT | Recorded peak water level in meters |

---

## 6. Table: evacuation_centers

Active evacuation shelter registry tracking capacity and real-time occupancy.

**DDL:**
```sql
CREATE OR REPLACE TABLE evacuation_centers (
    name              STRING,
    capacity          INTEGER,
    current_occupancy INTEGER,
    barangay          STRING,
    latitude          FLOAT,
    longitude         FLOAT
);
```

| Column | Type | Description |
|---|---|---|
| `name` | STRING | Official evacuation center name |
| `capacity` | INTEGER | Maximum approved occupant headcount |
| `current_occupancy` | INTEGER | Current number of evacuees |
| `barangay` | STRING | Hosting barangay |
| `latitude` | FLOAT | WGS84 latitude for GeoJSON |
| `longitude` | FLOAT | WGS84 longitude for GeoJSON |

**Seed Data (10 Active Centers):**

| name | capacity | barangay |
|---|---|---|
| Tumaga Gymnasium | 800 | Tumaga |
| City Coliseum Tetuan | 2,500 | Tetuan |
| Don Pablo Lorenzo Memorial High School | 1,500 | Sta. Maria |
| Tugbungan Elementary School | 900 | Tugbungan |
| Talon-Talon National High School | 1,200 | Talon-Talon |
| Manicahan Elementary School | 600 | Manicahan |
| Pasonanca Elementary School | 750 | Pasonanca |
| WMSU Gymnasium | 3,000 | Baliwasan |
| Southcom Elementary School | 1,000 | Calarian |
| Ayala National High School | 1,100 | Ayala |

---

## 7. Table: hospitals

Healthcare infrastructure registry tracking available bed capacity for surge preparedness.

**DDL:**
```sql
CREATE OR REPLACE TABLE hospitals (
    hospital       STRING,
    beds_available INTEGER,
    barangay       STRING,
    latitude       FLOAT,
    longitude      FLOAT
);
```

**Seed Data (6 Active Hospitals):**

| hospital | beds_available | barangay |
|---|---|---|
| Zamboanga City Medical Center (ZCMC) | 65 | Sta. Maria |
| West Metro Medical Center | 50 | Sta. Maria |
| Zamboanga Doctors Hospital | 45 | Tumaga |
| Brent Hospital and Colleges | 30 | Pasonanca |
| Ciudad Medical Zamboanga | 40 | Guiwan |
| Universidad de Zamboanga Medical Center | 35 | Tetuan |

---

## 8. Table: citizen_contacts

Recipient registry for emergency alert broadcasts, mapping contacts to barangay for targeted dispatch.

**DDL:**
```sql
CREATE OR REPLACE TABLE citizen_contacts (
    phone    STRING,
    email    STRING,
    barangay STRING
);
```

| Column | Type | Description |
|---|---|---|
| `phone` | STRING | Mobile phone (E.164 format: `+63XXXXXXXXXX`) |
| `email` | STRING | Email address for HTML alert delivery |
| `barangay` | STRING | Barangay of residence (filter key) |

**Notes:**
- The `recipients_filter` field in `execution_jobs` references demographic groups from this table
- Production: phone numbers must be in E.164 format for Twilio gateway compatibility

---

## 9. Table: audit_logs

Immutable chronological event log. Records all AI actions, fast-path executions, commander approvals, and system events.

**DDL:**
```sql
CREATE OR REPLACE TABLE audit_logs (
    event      STRING,
    event_type STRING,
    timestamp  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

| Column | Type | Default | Description |
|---|---|---|---|
| `event` | STRING | — | Human-readable event description |
| `event_type` | STRING | — | Categorical event code |
| `timestamp` | TIMESTAMP_NTZ | `CURRENT_TIMESTAMP()` | Wall-clock UTC insert time |

**Event Type Taxonomy:**

| event_type | Trigger | Example Event |
|---|---|---|
| `fast_path_execution` | Automatic RED ALERT breach | `Fast-Path Auto-Executed: water_level 8.8m triggered SOP-FL-04 advisory dispatch` |
| `user_approval` | Commander Approve & Deploy | `Verified Commander (token) Queued Broadcast Job: <uuid>` |
| `risk_assessment` | GET /copilot/recommendations | `AI Risk Assessment: Red Alert, confidence 94%, 31,200 affected population` |
| `copilot_query` | POST /copilot/ask | `Copilot Query: What is the current flood risk in Tumaga?` |

**Query Patterns:**
```sql
-- Last 50 events (GET /audit/events)
SELECT event, event_type, timestamp
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 50;

-- Approved directives (GET /audit/approved-directives)
SELECT DISTINCT event FROM audit_logs
WHERE event_type = 'user_approval'
ORDER BY timestamp DESC;
```

---

## 10. Table: execution_jobs

Central registry for all multi-channel emergency broadcast dispatch jobs.

**DDL:**
```sql
CREATE OR REPLACE TABLE execution_jobs (
    job_id            STRING PRIMARY KEY,
    status            STRING,
    messages          VARIANT,
    channels          VARIANT,
    recipients_filter STRING,
    logs              VARIANT,
    counts            VARIANT,
    created_at        TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at        TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Column Definitions:**

| Column | Type | Description |
|---|---|---|
| `job_id` | STRING | UUID v4 primary key |
| `status` | STRING | `queued`, `processing`, `completed`, `failed` |
| `messages` | VARIANT | JSON array of dispatch message texts |
| `channels` | VARIANT | JSON array: `["sms"]`, `["email"]`, or `["sms","email"]` |
| `recipients_filter` | STRING | Recipient filter string (e.g., `high_risk_subscribers_tumaga`) |
| `logs` | VARIANT | JSON array of progressive execution log strings |
| `counts` | VARIANT | JSON object with delivery counts: `{"sms": 1200, "email": 3500}` |
| `created_at` | TIMESTAMP_NTZ | Job creation timestamp |
| `updated_at` | TIMESTAMP_NTZ | Last state update timestamp |

**Atomic State Transition Guard:**
```sql
UPDATE execution_jobs
SET status = %s, logs = PARSE_JSON(%s), counts = PARSE_JSON(%s), updated_at = CURRENT_TIMESTAMP()
WHERE job_id = %s
  AND (status = 'draft' OR status = 'queued' OR status = 'processing');
```
This prevents backward state transitions (e.g., overwriting `completed` with `processing`).

---

## 11. Table: execution_tasks

Granular per-task record within a broadcast job (one record per channel worker).

**DDL:**
```sql
CREATE OR REPLACE TABLE execution_tasks (
    task_id     STRING PRIMARY KEY,
    job_id      STRING,
    type        STRING,
    payload     VARIANT,
    status      STRING,
    retry_count INTEGER,
    created_at  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

| Column | Type | Description |
|---|---|---|
| `task_id` | STRING | UUID v4 primary key |
| `job_id` | STRING | Parent job reference (FK -> `execution_jobs.job_id`) |
| `type` | STRING | Channel: `sms` or `email` |
| `payload` | VARIANT | Task-specific dispatch parameters |
| `status` | STRING | `queued`, `processing`, `completed`, `failed` |
| `retry_count` | INTEGER | Retry attempts made (max 3) |

---

## 12. Table: chat_history

Persistent session transcript for all Copilot interactions.

**DDL:**
```sql
CREATE OR REPLACE TABLE chat_history (
    id         STRING PRIMARY KEY,
    session_id STRING,
    role       STRING,
    content    STRING,
    metadata   VARIANT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | STRING | UUID v4 message identifier |
| `session_id` | STRING | Browser session key (default: `default_session`) |
| `role` | STRING | `user` or `assistant` |
| `content` | STRING | Raw message text |
| `metadata` | VARIANT | JSON: `explanation`, `recommended_actions` |
| `created_at` | TIMESTAMP_NTZ | Message insertion timestamp |

**Assistant Metadata Schema:**
```json
{
  "explanation": "Generated live using Snowflake Cortex (llama3-8b)...",
  "recommended_actions": ["Issue Evacuation Advisory", "Dispatch Emergency Notifications"]
}
```

---

## 13. Table: SENTINEL_SOPS (Cortex Search Source)

Authoritative Standard Operating Procedures reference table powering the RAG search service.

**DDL:**
```sql
CREATE OR REPLACE TABLE SENTINEL_SOPS (
    id         VARCHAR(50) PRIMARY KEY,
    title      VARCHAR(255),
    category   VARCHAR(100),
    content    TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Seeded SOP Documents:**

| id | title | category |
|---|---|---|
| `SOP-EVAC-01` | Flood Evacuation Trigger Protocol | Evacuation |
| `SOP-RES-02` | Resource Allocation & Deployment Guidelines | Resources |
| `SOP-ALERT-03` | Multi-Channel Alert Dispatch Protocol | Notifications |
| `SOP-MED-04` | Emergency Medical & Casualty Handling Protocol | Medical |

**Key SOP-EVAC-01 excerpt (triggers Fast-Path):**
> "When river sensor readings exceed 8.0 meters (Critical Threshold) or rainfall exceeds 150mm within a 12-hour window, upgrade operational status to RED ALERT. Order immediate mandatory evacuation for low-lying barangays including Tumaga, Sta. Maria, and Tetuan."

---

## 14. View: SENTINEL_SEMANTIC_VIEW

Unified relational view joining all telemetry and resource domains. Used by Cortex Analyst for natural-language Text-to-SQL queries.

**DDL (abbreviated):**
```sql
CREATE OR REPLACE VIEW SENTINEL_SEMANTIC_VIEW AS
SELECT
    b.barangay,
    b.city,
    b.population                       AS barangay_population,
    r.sensor_id,
    r.water_level                      AS live_river_water_level,
    r.timestamp                        AS sensor_timestamp,
    w.rainfall                         AS active_rainfall_mm,
    w.storm_name,
    COALESCE(ec.capacity, 0)           AS total_shelter_capacity,
    COALESCE(ec.current_occupancy, 0)  AS current_shelter_occupancy,
    COALESCE(h.beds_available, 0)      AS hospital_beds_available
FROM barangays b
LEFT JOIN river_sensors r ON b.barangay = r.barangay
LEFT JOIN weather_data w ON w.location LIKE '%Zamboanga%'
LEFT JOIN (SELECT barangay, SUM(capacity) AS capacity, SUM(current_occupancy) AS current_occupancy
    FROM evacuation_centers GROUP BY barangay) ec ON b.barangay = ec.barangay
LEFT JOIN (SELECT barangay, SUM(beds_available) AS beds_available
    FROM hospitals GROUP BY barangay) h ON b.barangay = h.barangay;
```

---

## 15. Foreign Key Relationships

> Snowflake does not enforce foreign key constraints by default; these are logical relationships.

```
execution_tasks.job_id  -->  execution_jobs.job_id
barangays.barangay      -->  river_sensors.barangay      (logical)
barangays.barangay      -->  evacuation_centers.barangay (logical)
barangays.barangay      -->  hospitals.barangay           (logical)
barangays.barangay      -->  citizen_contacts.barangay    (logical)
barangays.barangay      -->  flood_history.barangay       (logical)
```

---

## 16. Index Considerations

Snowflake uses micro-partition clustering rather than B-tree indexes.

| Table | Recommended Cluster Key | Rationale |
|---|---|---|
| `weather_data` | `timestamp` | `ORDER BY timestamp DESC LIMIT 1` pattern |
| `river_sensors` | `sensor_id`, `water_level` | Threshold scan `WHERE water_level >= 6.0` |
| `audit_logs` | `timestamp`, `event_type` | Latest-first queries + event_type filtering |
| `execution_jobs` | `job_id`, `status` | UUID lookup + atomic status-gated updates |
| `chat_history` | `session_id`, `created_at` | Session-scoped transcript retrieval |

```sql
ALTER TABLE river_sensors  CLUSTER BY (sensor_id, water_level);
ALTER TABLE audit_logs     CLUSTER BY (timestamp, event_type);
ALTER TABLE execution_jobs CLUSTER BY (job_id);
```

---

## 17. Cortex Search RAG Integration

**Service:** `SENTINEL_SOP_SEARCH_SERVICE`
**Setup Script:** `snowflake/setup_3_cortex_search.sql`

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE SENTINEL_SOP_SEARCH_SERVICE
  ON content
  ATTRIBUTES title, category
  WAREHOUSE = COMPUTE_WH
  TARGET_LAG = '1 hour'
  AS (SELECT id, title, category, content FROM SENTINEL_SOPS);
```

| Parameter | Value | Description |
|---|---|---|
| `ON content` | Indexed column | `content` TEXT column vectorized |
| `ATTRIBUTES` | `title`, `category` | Filterable metadata (not vectorized) |
| `TARGET_LAG` | `1 hour` | Maximum index staleness |
| `WAREHOUSE` | `COMPUTE_WH` | Compute for embedding/indexing |

**Python Query Pattern:**
```python
search_config = {
    "query": "flood evacuation SOP rules critical water level",
    "columns": ["content", "section_id"],
}
cursor.execute(
    "SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('SENTINEL_SOP_SEARCH_SERVICE', %s)",
    (json.dumps(search_config),)
)
# Returns: {"results": [{"content": "...", "title": "...", "category": "..."}]}
```

**RAG Pipeline:**
```
Query / Telemetry Breach
        |
        v
CORTEX.SEARCH_PREVIEW (vector embedding + cosine similarity)
        |
        v
Top-N SOP content chunks injected into CORTEX.AI_COMPLETE prompt
        |
        v
Grounded AI response with SOP citation
```

---

*© 2026 Sentinel AI. Data Model Reference v1.0.0*
