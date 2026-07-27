# Sentinel AI — System Architecture

> **Document Type:** Technical Architecture Reference  
> **Version:** 0.1.0  
> **Last Updated:** 2026-07-27  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Data Ingestion Layer](#3-data-ingestion-layer)
4. [Threshold State Machine & Alert Classification](#4-threshold-state-machine--alert-classification)
5. [Fast-Path vs. Guardrailed Manual Directives](#5-fast-path-vs-guardrailed-manual-directives)
6. [Job Execution Engine](#6-job-execution-engine)
7. [FastAPI Backend Service Layers](#7-fastapi-backend-service-layers)
8. [Snowflake Integration Layer](#8-snowflake-integration-layer)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Security Layers](#10-security-layers)
11. [Deployment Topology](#11-deployment-topology)

---

## 1. System Overview

Sentinel AI is an enterprise-grade **Emergency Operations Copilot** deployed for Emergency Operations Centers (EOCs) and Local Disaster Risk Reduction and Management Offices (LDRRMOs). It integrates real-time river sensor telemetry, meteorological weather feeds, Snowflake Cortex AI, and a resilient multi-channel Job Execution Engine into a single unified operational platform.

**Core System Properties:**

| Property | Value |
|---|---|
| Backend Framework | FastAPI 0.1.0 (Python 3.12) |
| Data Platform | Snowflake `SENTINEL_AI_DB.PUBLIC` |
| AI/LLM Engine | Snowflake Cortex (`llama3-8b` / `claude-3-5-sonnet`) |
| Background Workers | Celery + Redis |
| Real-Time Transport | WebSocket (FastAPI native) |
| Frontend | React.js (TypeScript) + Vite + MapLibre GL |
| Auth Provider | Firebase Auth (Google OAuth 2.0) |
| Rate Limiting | 20 requests per 5-minute window (per IP) |

---

## 2. High-Level Architecture Diagram

```
+--------------------------------------------------------------------------+
|                         EXTERNAL DATA SOURCES                            |
|                                                                          |
|   +----------------------+       +------------------------------------+  |
|   |  Open-Meteo API      |       |  River Sensor Network (ZAM-*-01)  |  |
|   |  (Weather Feeds)     |       |  (Snowflake DB polled readings)    |  |
|   +----------+-----------+       +-----------------+------------------+  |
+--------------|------------------------------------ | ----------------------+
               |                                    |
               v Celery Async Task                  v Polling / Streaming
+--------------------------------------------------------------------------+
|                    FASTAPI BACKEND (port 8000)                           |
|                                                                          |
|  +---------------------------------------------------------------------+ |
|  |                   INGESTION LAYER                                   | |
|  |  /api/v1/ingestion/sync-weather  (Celery: ingestion_tasks.py)       | |
|  |  TelemetryService._stream_telemetry()  (every 2s, WebSocket push)   | |
|  +---------------------------------+-----------------------------------+ |
|                                    |                                     |
|                                    v                                     |
|  +---------------------------------------------------------------------+ |
|  |                  THRESHOLD BREACH CHECK                             | |
|  |  water_level >= 8.0m  OR  rainfall >= 150.0mm                       | |
|  |           |                        |                                | |
|  |           v TRUE                   v FALSE                         | |
|  |   FAST-PATH TRIGGER         Normal telemetry broadcast             | |
|  +------------------+--------------------------------------------------+ |
|                     |                                                    |
|                     v                                                    |
|  +---------------------------------------------------------------------+ |
|  |               SNOWFLAKE CORTEX ENGINE                               | |
|  |  1. CORTEX.SEARCH_PREVIEW('SENTINEL_SOP_SEARCH_SERVICE', query)     | |
|  |  2. CORTEX.AI_COMPLETE('claude-3-5-sonnet', prompt+SOP_context)     | |
|  |  3. Generate: SMS copy, HTML email, Staging Alert, SOP citation     | |
|  +------------------+--------------------------------------------------+ |
|                     |                                                    |
|                     v                                                    |
|  +---------------------------------------------------------------------+ |
|  |              TIERED OPERATOR GUARDRAIL UI                           | |
|  |  [Fast-Path Directives]    [Guardrailed Manual Directives]          | |
|  |  (Auto-dispatched)         (Require 1-click commander approval)     | |
|  +------------------+--------------------------------------------------+ |
|                     |                                                    |
|                     v                                                    |
|  +---------------------------------------------------------------------+ |
|  |              JOB EXECUTION ENGINE                                   | |
|  |  * Idempotency lock check (60s TTL, SHA-256 keying)                 | |
|  |  * HTTP 409 on duplicate, UUID job_id on accept                     | |
|  |  * Exponential backoff retries (max 3, 2s base, jitter)             | |
|  |  * Live WebSocket log stream to Notification Console                | |
|  |  * Atomic Snowflake persistence (_persist_job_state)                | |
|  +---------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
               |                         |
               v                         v
+-----------------------+   +-------------------------------------------+
|  SNOWFLAKE DB         |   |  REACT FRONTEND (port 5173)               |
|  SENTINEL_AI_DB       |   |  * Copilot Chat Interface                 |
|  .PUBLIC              |   |  * Tiered Guardrail Recommendation Panel  |
|  (11 tables)          |   |  * MapLibre GL GIS Disaster Map           |
|                       |   |  * Job Execution Notification Console     |
|  Cortex Search        |   |  * Audit Timeline & Incident Exporter     |
|  Cortex Analyst       |   |  * Firebase Google Auth                   |
+-----------------------+   +-------------------------------------------+
```

---

## 3. Data Ingestion Layer

### 3.1 Open-Meteo Weather Ingestion (Celery Worker)

Weather telemetry is ingested asynchronously via a **Celery background task** backed by a Redis broker. The task is triggered either by a manual HTTP call to `POST /api/v1/ingestion/sync-weather` or a scheduled Celery beat.

**Ingestion Sequence:**

```
 Dashboard Click                          Open-Meteo API
 "Sync Weather"                           weather.open-meteo.com
      |                                          |
      |  POST /api/v1/ingestion/sync-weather      |
      v                                          |
 FastAPI Endpoint                               |
 ingestion.trigger_live_weather_sync()          |
      |                                          |
      |  fetch_and_store_live_weather_task.delay()|
      v                                          |
 Celery Worker (Redis broker)                   |
      |--------- HTTP GET /forecast ------------>|
      |<-------- JSON payload (rainfall, wind) --|
      |                                          |
      |  INSERT INTO weather_data                |
      |  (timestamp, location, rainfall,         |
      |   wind_speed, storm_name, forecast)      |
      v                                          |
 Snowflake DB                                   |
 SENTINEL_AI_DB.PUBLIC.weather_data             |
      |                                          |
      |  Check: rainfall >= 150.0mm?             |
      |  YES -> Trigger Fast-Path Alert           |
      |  NO  -> Normal telemetry stored           |
```

**Response Schema from `POST /api/v1/ingestion/sync-weather`:**
```json
{
  "message": "Celery weather ingestion task dispatched asynchronously",
  "task_id": "c3f8a921-...",
  "status": "PENDING"
}
```

### 3.2 River Sensor Telemetry

River sensor data persists to `SENTINEL_AI_DB.PUBLIC.river_sensors` and is polled every cycle by the `TelemetryService`. Each sensor stores a `critical_threshold` (default `8.0`) and `warning_threshold` (default `6.0`).

**Sensor Network — Zamboanga City (12 stations):**

| Sensor ID | Barangay | Warning Threshold | Critical Threshold |
|---|---|---|---|
| `ZAM-TUMAGA-01` | Tumaga | >= 6.0m | >= 8.0m |
| `ZAM-STAMARIA-01` | Sta. Maria | >= 6.0m | >= 8.0m |
| `ZAM-TETUAN-01` | Tetuan | >= 6.0m | >= 8.0m |
| `ZAM-TUGBUNGAN-01` | Tugbungan | >= 6.0m | >= 8.0m |
| `ZAM-TALONTALON-01` | Talon-Talon | >= 6.0m | >= 8.0m |
| `ZAM-MANICAHAN-01` | Manicahan | >= 6.0m | >= 8.0m |
| `ZAM-PASONANCA-01` | Pasonanca | >= 6.0m | >= 8.0m |
| `ZAM-SANJOSE-01` | San Jose Gusu | >= 6.0m | >= 8.0m |
| `ZAM-BALIWASAN-01` | Baliwasan | >= 6.0m | >= 8.0m |
| `ZAM-MERCEDES-01` | Mercedes | >= 6.0m | >= 8.0m |
| `ZAM-AYALA-01` | Ayala | >= 6.0m | >= 8.0m |
| `ZAM-VITALI-01` | Vitali | >= 6.0m | >= 8.0m |

### 3.3 Telemetry WebSocket Streaming

The `TelemetryService` pushes live sensor readings to all connected WebSocket clients every **2 seconds** at application startup.

```
TelemetryService (lifespan startup)
        |
        |  asyncio.create_task(_stream_telemetry())
        v
  while self.is_running:
        |
        |---> _fetch_snowflake_sensor_readings()
        |       SELECT sensor_id, water_level FROM river_sensors
        |       Apply micro-jitter: +/- 0.1m (simulates live sensor noise)
        |
        |-- [Fallback if Snowflake offline]
        |       Mock: ZAM-TUMAGA-01 (7.0-9.5m), ZAM-STAMARIA-01 (5.0-8.0m)
        |
        |---> manager.broadcast({"type": "sensor_update", "data": [...]})
              WebSocket -> All connected React clients
              asyncio.sleep(2.0)
```

**WebSocket Broadcast Payload (`sensor_update`):**
```json
{
  "type": "sensor_update",
  "data": [
    { "name": "ZAM-TUMAGA-01",   "level": 8.8, "timestamp": "2026-07-27T20:54:00" },
    { "name": "ZAM-STAMARIA-01", "level": 7.4, "timestamp": "2026-07-27T20:54:00" }
  ]
}
```

---

## 4. Threshold State Machine & Alert Classification

The alert classification engine implements a deterministic state machine driven by two primary telemetry parameters:

```
  river_level (m)      rainfall (mm)       Alert Level
  ----------------------------------------------------------------
  >= 8.0    AND        >= 150.0        --> RED ALERT    (Fast-Path)
  >= 8.0    OR         >= 150.0        --> ORANGE ALERT
  >= 6.0    OR         >= 100.0        --> YELLOW ALERT
  < 6.0     AND        < 100.0         --> NORMAL


              +----------+
         +--->|  NORMAL  |<--------------------------------------+
         |    +----+-----+                                       |
         |         | water_level >= 6.0m OR rainfall >= 100mm   |
         |         v                                             |
         |    +----------------+                                 |
         |    |  YELLOW ALERT  |<--------------------------------+
         |    |  (Monitoring)  |                                 |
         |    +----+-----------+                                 |
         |         | water_level >= 8.0m OR rainfall >= 150mm   |
         |         v                                             |
         |    +----------------+                                 |
         |    |  ORANGE ALERT  |---------------------------------+
         |    |  (Standby)     |  (levels drop below threshold)
         |    +----+-----------+
         |         | water_level >= 8.0m AND rainfall >= 150mm
         |         v
         |    +------------------------------------------------+
         |    |  RED ALERT                                     |
         |    |  -> Mandatory Fast-Path Trigger                |
         |    |  -> Cortex RAG SOP Lookup                      |
         |    |  -> AI Advisory Generation                     |
         |    |  -> Auto-Dispatch Job Queued                   |
         |    +------------------------------------------------+
         |         | water_level drops below all thresholds
         +---------+
```

**Key Thresholds (per SOP-EVAC-01):**

| Trigger | Threshold | Unit | Action |
|---|---|---|---|
| `critical_threshold` | `>= 8.0` | meters | RED ALERT + Fast-Path trigger |
| `warning_threshold` | `>= 6.0` | meters | ORANGE ALERT |
| Rainfall critical | `>= 150.0` | mm/12hr | RED ALERT + Fast-Path trigger |
| Rainfall warning | `>= 100.0` | mm/12hr | YELLOW ALERT |

---

## 5. Fast-Path vs. Guardrailed Manual Directives

### 5.1 Fast-Path Auto-Execution Flow

```
Telemetry Breach Detected
(water_level >= 8.0m OR rainfall >= 150.0mm)
          |
          v
CopilotService.generate_fast_path_alerts(trigger_reason, location, water_level, rainfall)
          |
          |-- Step 1: SOP RAG Retrieval
          |   SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
          |     'SENTINEL_SOP_SEARCH_SERVICE',
          |     '{"query": "flood evacuation responder staging SOP rules",
          |       "columns": ["content","section_id"]}'
          |   )
          |   --> Retrieves SOP-EVAC-01, SOP-ALERT-03 content chunks
          |
          |-- Step 2: Cortex AI Advisory Generation
          |   prompt = "Telemetry breach: {trigger_reason}
          |     (Water Level: {water_level}m, Rainfall: {rainfall}mm)
          |     SOP Context: {sop_context}
          |     Generate JSON: sms_copy, email_copy, staging_alert, citation"
          |   SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('claude-3-5-sonnet', prompt)
          |
          |-- Step 3: Output Generation
          |   {
          |     "sms_copy":      "EMERGENCY ALERT: Zamboanga City water level 8.8m...",
          |     "email_copy":    "<h2>CRITICAL FLOOD EMERGENCY ADVISORY...</h2>",
          |     "staging_alert": "STAND BY & GEAR UP: Deploy crews to Tumaga / Sta. Maria",
          |     "citation":      "SOP-FL-04 Section 3.2: River Basin Emergency Staging"
          |   }
          |
          +-- Step 4: Automatic Dispatch + Audit
              audit_service.log_audit_event(event, "fast_path_execution")
              --> SENTINEL_AI_DB.PUBLIC.audit_logs
              --> Frontend receives AUTO-EXECUTED & STAGED status
```

### 5.2 Guardrailed Manual Directive Flow

```
CopilotService.get_recommendations()
--> Returns: risk_level, affected_barangays, recommended_actions
          |
          v
Frontend: RecommendationPanel renders physical directives
  "Deploy 6 Inflatable Rescue Boats to Sector 3"
  "Open Evacuation Gymnasiums"
          |
          | Commander clicks [Approve & Deploy]
          v
POST /api/v1/jobs/
  {
    "messages": ["Deploy 6 Inflatable Rescue Boats to Sector 3"],
    "channels": ["sms", "email"],
    "recipients_filter": "high_risk_subscribers_tumaga"
  }
  Headers: { "Idempotency-Key": "<uuid>", "X-API-Key": "<firebase-token>" }
          |
          v
jobs.create_job() --> JobExecutionService.create_job()
  --> Idempotency check --> Job UUID minted --> Audit logged
  --> HTTP 201 { job_id, status: "queued" }
          |
          v
process_job_mock(job_id)  [asyncio background task]
  --> status: queued -> processing -> completed
  --> Exponential backoff retries on channel workers
  --> WebSocket log stream to Notification Console
  --> Atomic Snowflake persistence on each state change
```

### 5.3 State Transition Diagram

```
            Commander Input
                   |
    +--------------+------------------+
    |                                 |
    v                                 v
[Fast-Path Directives]      [Guardrailed Directives]
 Public SMS Advisory          Deploy Rescue Boats
 Public Email Advisory        Open Evacuation Centers
 Responder Staging Alert      Dispatch Medical Teams
    |                                 |
    | Auto-dispatched                 | Requires: Approve + X-API-Key
    |                                 v
    |                        POST /api/v1/jobs/
    |                        HTTP 201 --> job_id
    |                                 |
    +--------------+-----------------+
                   |
                   v
          Job Execution Engine
          +-----------------+
          |     QUEUED      |
          +--------+--------+
                   | asyncio background task starts
                   v
          +-----------------+
          |   PROCESSING    |---> WebSocket log stream
          +--------+--------+
                   | all channels complete
                   v
          +-----------------+
          |    COMPLETED    |
          +-----------------+
                   | error / max retries exhausted
                   v
          +-----------------+
          |     FAILED      |
          +-----------------+
```

---

## 6. Job Execution Engine

### 6.1 Idempotency Locking

Every inbound job creation request is deduplicated via two-tier key derivation:

```python
# Tier 1: Explicit header key (from client)
if header_key and header_key.strip():
    return f"hdr:{header_key.strip()}"

# Tier 2: Content-derived SHA-256 hash (auto-deduplication)
payload_str = f"{recipients_filter}:" + ",".join(sorted(messages))
return f"hash:{hashlib.sha256(payload_str.encode('utf-8')).hexdigest()}"
```

**Conflict Resolution (60-second TTL):**

```
Inbound Request
      |
      v
key = derive_idempotency_key(messages, recipients_filter, header_key)
      |
      v
key in _request_locks?
      |
      |-- YES ---> existing_status in ['queued','processing'] OR
      |            (now - existing.timestamp < 60)?
      |                 |
      |                 |-- YES --> raise DuplicateJobError
      |                 |          --> HTTP 409 Conflict
      |                 |              {
      |                 |                "message": "Duplicate request...",
      |                 |                "job_id": "<existing_job_id>",
      |                 |                "error": "DUPLICATE_JOB_SUBMISSION"
      |                 |              }
      |                 |-- NO  --> Lock expired, allow new job
      |
      +-- NO  ---> Create new job, store lock, return HTTP 201
```

### 6.2 Worker Retry Strategy

Each dispatch channel (`sms`, `email`) is wrapped with exponential backoff + jitter:

```
_dispatch_channel_with_retry(job_id, channel, messages, recipients_filter)

  max_retries = 3
  base_delay  = 2.0 seconds
  jitter      = random.uniform(0.1, 0.5)

  Attempt 1 -> fail -> delay = 2.0 * 2^0 + jitter = ~2.1-2.5s
  Attempt 2 -> fail -> delay = 2.0 * 2^1 + jitter = ~4.1-4.5s
  Attempt 3 -> fail -> raise -> FAILED state

  Per-attempt WebSocket log events:
  "[SMS] Carrier retry (Attempt N/3) after timeout... (<error>)"
  "[Email] SMTP relay retry (Attempt N/3) after timeout... (<error>)"
```

**SMS dispatch milestones (1,200 total):**
```
[SMS] Initializing gateway to {recipients_filter}...
[SMS] Dispatched 240 / 1,200 messages (20%)...
[SMS] Dispatched 520 / 1,200 messages (43%)...
[SMS] Dispatched 840 / 1,200 messages (70%)...
[SMS] Dispatched 1,080 / 1,200 messages (90%)...
[SMS] Dispatched 1,200 / 1,200 messages (100%)...
[SMS] Broadcast completed to all high-risk mobile subscribers.
```

**Email dispatch milestones (3,500 total):**
```
[Email] Connecting to SMTP relay service...
[Email] Dispatched 700 / 3,500 emails (20%)...
[Email] Dispatched 3,500 / 3,500 emails (100%)...
[Email] Broadcast completed to registered emergency contacts.
```

### 6.3 WebSocket Event Streams

```json
{
  "type":    "job_log_update",
  "job_id":  "<uuid>",
  "log":     "[SMS] Dispatched 520 / 1,200 messages (43%)...",
  "counts":  { "sms": 520, "email": 0 },
  "status":  "processing"
}
```

Both `sensor_update` and `job_log_update` are multiplexed over the same `/api/v1/ws/telemetry` WebSocket endpoint, distinguished by the `type` field.

### 6.4 Job Lifecycle Sequence

```
  Client                   FastAPI                 Snowflake DB
    |                         |                         |
    | POST /api/v1/jobs/      |                         |
    | {messages, channels,    |                         |
    |  recipients_filter}     |                         |
    | Header: Idempotency-Key |                         |
    |------------------------>|                         |
    |                         | derive_idempotency_key()|
    |                         | check _request_locks{}  |
    |                         |                         |
    |   [Duplicate?]--------->|-- HTTP 409 ------------>|(no DB write)
    |                         |                         |
    |                         | uuid4() -> job_id       |
    |                         | jobs_db[job_id] = {...} |
    |                         | INSERT execution_jobs   |
    |                         |------------------------>|
    |                         |<------------------------|
    |                         |                         |
    | HTTP 201 {job_id}       |                         |
    |<------------------------|                         |
    |                         |                         |
    |                         | [asyncio background]    |
    |                         | process_job_mock()      |
    |                         |                         |
    | WS: job_log_update      |                         |
    |<========================| (every ~500ms)          |
    |                         |                         |
    |                         | UPDATE execution_jobs   |
    |                         | SET status='completed'  |
    |                         |------------------------>|
    |                         |                         |
    | WS: {status:completed}  |                         |
    |<========================|                         |
```

---

## 7. FastAPI Backend Service Layers

```
backend/app/
|-- main.py                    <- FastAPI app factory, lifespan, middleware
|
|-- api/
|   |-- __init__.py            <- APIRouter registration
|   |-- copilot.py             <- POST /ask, GET /recommendations, GET /history
|   |-- jobs.py                <- POST /, GET /{job_id}
|   |-- map.py                 <- GET /data (GeoJSON FeatureCollection)
|   |-- audit.py               <- POST /log, GET /approved-directives, GET /events
|   |-- ingestion.py           <- POST /sync-weather, GET /status/{task_id}
|   |-- websocket.py           <- WS /telemetry
|   +-- websocket_manager.py   <- ConnectionManager singleton (broadcast)
|
|-- core/
|   |-- config.py              <- Pydantic Settings (env-loaded config)
|   |-- auth.py                <- X-API-Key dependency (get_current_user)
|   |-- celery_app.py          <- Celery app + Redis broker init
|   |-- rate_limit.py          <- RateLimitMiddleware (20 req / 5 min window)
|   +-- security_headers.py   <- SecurityHeadersMiddleware
|
|-- services/
|   |-- copilot_service.py     <- Cortex RAG + AI_COMPLETE, chat history, fast-path
|   |-- job_execution_service.py <- Job lifecycle, idempotency, retries, WS broadcast
|   |-- audit_service.py       <- Audit log persistence + retrieval
|   +-- telemetry_service.py   <- Async sensor streaming loop
|
+-- tasks/
    +-- ingestion_tasks.py     <- Celery: fetch_and_store_live_weather_task
```

**Middleware Stack (outermost to innermost):**
```
CORSMiddleware            <- Outermost (wraps 429, 404 with CORS headers)
  +- RateLimitMiddleware  (20 req / 300s per IP)
       +- SecurityHeadersMiddleware  (CSP, X-Frame-Options, etc.)
            +- FastAPI Routes
```

---

## 8. Snowflake Integration Layer

| Pattern | SQL | Usage |
|---|---|---|
| SOP RAG Search | `SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('SENTINEL_SOP_SEARCH_SERVICE', %s)` | Fast-path + copilot |
| LLM Completion | `SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('{model}', %s)` | Advisory generation |
| Atomic Job Update | `UPDATE execution_jobs SET status=%s WHERE job_id=%s AND status IN ('draft','queued','processing')` | Prevents stale writes |

All services connect via `snowflake.connector` using settings from `app/core/config.py`. Offline graceful fallback is implemented when credentials are placeholders.

---

## 9. Frontend Architecture

```
frontend/src/
|-- App.tsx                     <- EOC Shell: theme toggle, Firebase auth, navigation
|-- components/
|   |-- ChatInterface.tsx        <- Copilot chat, quick-action buttons
|   |-- DisasterMap.tsx          <- MapLibre GL, GeoJSON overlays, sensor pins
|   |-- RecommendationPanel.tsx  <- Tiered Guardrail UI (Fast-Path + Guardrailed)
|   |-- NotificationConsole.tsx  <- Job dispatch progress + WebSocket log stream
|   +-- AuditTimeline.tsx        <- Audit events table, JSON exporter
+-- hooks/
    +-- useTelemetryWebSocket.ts <- WS connection, auto-reconnect, message dispatch
```

---

## 10. Security Layers

| Layer | Mechanism | Detail |
|---|---|---|
| Authentication | Firebase Auth / Google OAuth 2.0 | `X-API-Key` header from frontend |
| Authorization | FastAPI `get_current_user` | Applied to `POST /api/v1/jobs/` |
| Rate Limiting | `RateLimitMiddleware` | 20 req / IP / 5-min window |
| Security Headers | `SecurityHeadersMiddleware` | CSP, X-Frame-Options |
| CORS | `CORSMiddleware` | `allow_origins=["*"]` (restrict in prod) |
| Idempotency | SHA-256 key derivation | Prevents duplicate submissions |
| Snowflake Auth | Username + Password | PAT token support via `pat_auth.sql` |

---

## 11. Deployment Topology

```
Internet / EOC Browser
        |
        |-- HTTPS --> React Frontend (port 5173 / static CDN)
        |                 |
        |                 |-- REST API --> FastAPI Backend (port 8000)
        |                 +-- WebSocket -> ws://backend:8000/api/v1/ws/telemetry
        |
        +-- FastAPI Backend (port 8000)
               |
               |---- Redis (Celery broker)
               |         +-- Celery Worker (ingestion_tasks)
               |                 +-- Open-Meteo API (HTTP)
               |
               +---- Snowflake Cloud (SENTINEL_AI_DB.PUBLIC)
                         |-- river_sensors, weather_data, barangays, ...
                         |-- SENTINEL_SOP_SEARCH_SERVICE (Cortex Search)
                         |-- SENTINEL_SEMANTIC_VIEW (Cortex Analyst)
                         +-- SentinelAI Cortex Agent (CoCo CLI)
```

**Environment Variables (backend `.env`):**

| Variable | Description | Default |
|---|---|---|
| `SNOWFLAKE_ACCOUNT` | Snowflake account identifier | `placeholder_account` |
| `SNOWFLAKE_USER` | Snowflake username | `placeholder_user` |
| `SNOWFLAKE_PASSWORD` | Snowflake password | `placeholder_password` |
| `SNOWFLAKE_DATABASE` | Target database | `SENTINEL_AI_DB` |
| `SNOWFLAKE_SCHEMA` | Target schema | `PUBLIC` |
| `SNOWFLAKE_WAREHOUSE` | Compute warehouse | `COMPUTE_WH` |
| `SNOWFLAKE_ROLE` | Execution role | `ACCOUNTADMIN` |
| `SNOWFLAKE_CORTEX_MODEL` | LLM model name | `llama3-8b` |
| `DEFAULT_JURISDICTION_CITY` | Operational jurisdiction | `Zamboanga City` |
| `DEFAULT_JURISDICTION_REGION` | Operational region | `Zamboanga Peninsula` |

---

*© 2026 Sentinel AI. Architecture Reference v1.0.0*
