# Sentinel AI — API Reference

> **Document Type:** REST & WebSocket API Specification  
> **Base URL:** `http://localhost:8000/api/v1`  
> **Version:** 0.1.0  
> **Last Updated:** 2026-07-27  

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [Authentication](#2-authentication)
3. [Rate Limiting](#3-rate-limiting)
4. [Error Codes](#4-error-codes)
5. [Health Check](#5-health-check)
6. [Copilot Endpoints (`/copilot`)](#6-copilot-endpoints-copilot)
7. [Jobs Endpoints (`/jobs`)](#7-jobs-endpoints-jobs)
8. [Map Endpoints (`/map`)](#8-map-endpoints-map)
9. [Audit Endpoints (`/audit`)](#9-audit-endpoints-audit)
10. [Ingestion Endpoints (`/ingestion`)](#10-ingestion-endpoints-ingestion)
11. [WebSocket Endpoint (`/ws`)](#11-websocket-endpoint-ws)
12. [WebSocket Payload Structures](#12-websocket-payload-structures)

---

## 1. Global Conventions

| Property | Value |
|---|---|
| **Base URL** | `http://localhost:8000/api/v1` |
| **Protocol** | HTTP/1.1 + WebSocket (RFC 6455) |
| **Content-Type** | `application/json` (all REST endpoints) |
| **Response Format** | JSON |
| **Auth Header** | `X-API-Key: <firebase_token>` |
| **Idempotency Header** | `Idempotency-Key: <uuid>` or `X-Idempotency-Key: <uuid>` |
| **CORS** | `Access-Control-Allow-Origin: *` |

All timestamps are ISO 8601 / UTC unless otherwise noted.

---

## 2. Authentication

The `/jobs` creation endpoint requires a valid Firebase Auth bearer token passed as an API key header:

```
X-API-Key: <firebase_id_token>
```

All other endpoints are publicly accessible (no auth required in the current configuration).

**Auth Flow:**
```
Frontend (Google Sign-In)
        |
        | Firebase Auth SDK
        v
Firebase Auth (Google OAuth 2.0)
        |
        | returns: ID Token (JWT)
        v
FastAPI Header: X-API-Key: <ID Token>
        |
        | get_current_user() dependency
        v
{ "token": "<ID Token>" }
```

---

## 3. Rate Limiting

The API enforces a sliding-window rate limit via `RateLimitMiddleware`:

| Property | Value |
|---|---|
| Max Requests | 20 per IP address |
| Window | 300 seconds (5 minutes) |
| Exceeded Response | `HTTP 429 Too Many Requests` |

```json
// HTTP 429 Response Body
{
  "detail": "Rate limit exceeded. Try again later."
}
```

---

## 4. Error Codes

| HTTP Status | Meaning | Trigger |
|---|---|---|
| `200 OK` | Success (GET/PUT) | Normal response |
| `201 Created` | Resource created | POST /jobs/ success |
| `409 Conflict` | Idempotency lock triggered | Duplicate job submission |
| `422 Unprocessable Entity` | Validation error | Pydantic schema violation |
| `429 Too Many Requests` | Rate limit exceeded | > 20 req / 5min per IP |
| `500 Internal Server Error` | Unhandled exception | Snowflake connection error, task failure |

**409 Conflict (Idempotency Lock) Body:**
```json
{
  "detail": {
    "message": "Duplicate request detected for key hash:<sha256>. Active job_id: <uuid>",
    "job_id": "3f8b1c2d-0000-4abc-def1-000000000000",
    "error": "DUPLICATE_JOB_SUBMISSION"
  }
}
```

**422 Validation Error Body:**
```json
{
  "detail": [
    {
      "loc": ["body", "query"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 5. Health Check

### `GET /healthz`

Returns the API liveness status. No authentication required.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "message": "Sentinel AI Backend is running."
}
```

---

## 6. Copilot Endpoints (`/copilot`)

Base path: `/api/v1/copilot`

### 6.1 POST /copilot/ask

Submits a free-form natural language query to the AI copilot. The backend:
1. Saves the user message to `chat_history`
2. Retrieves SOP context via `CORTEX.SEARCH_PREVIEW`
3. Generates a grounded response via `CORTEX.AI_COMPLETE`
4. Saves the assistant response + metadata to `chat_history`

**Request Body (JSON):**

| Field | Type | Required | Max Length | Default | Description |
|---|---|---|---|---|---|
| `query` | string | YES | 500 | — | Natural language question or command |
| `session_id` | string | NO | 100 | `default_session` | Session scoping key for chat history |
| `context` | object | NO | — | `null` | Optional additional context key-value pairs |

**Request Example:**
```json
{
  "query": "What is the current flood risk in Tumaga?",
  "session_id": "commander-session-a7f3",
  "context": { "current_alert": "RED ALERT" }
}
```

**Response `200 OK`:**

| Field | Type | Nullable | Description |
|---|---|---|---|
| `response` | string | NO | AI-generated advisory text |
| `explanation` | string | YES | Source explanation (e.g., `Generated live using Snowflake Cortex`) |
| `recommended_actions` | array[string] | YES | 1–3 recommended immediate actions |

**Response Example:**
```json
{
  "response": "Based on current telemetry (ZAM-TUMAGA-01: 8.8m water level, 175mm rainfall), Tumaga is under RED ALERT. Mandatory evacuation to Tumaga Gymnasium is required per SOP-EVAC-01. Immediate SOP deployment prescribed.",
  "explanation": "Generated live using Snowflake Cortex (claude-3-5-sonnet) against active Sentinel AI database. Grounded with SOP Search.",
  "recommended_actions": [
    "Issue Evacuation Advisory",
    "Dispatch Emergency Notifications"
  ]
}
```

---

### 6.2 GET /copilot/recommendations

Returns AI-generated operational risk assessment and tactical recommendations based on live Snowflake telemetry. Used to populate the Tiered Guardrail Recommendation Panel.

**Query Parameters:** None

**Processing Logic:**
1. Fetches live `river_sensors` + `barangays` + `weather_data` join
2. Identifies high-risk barangays (`water_level >= 6.0`)
3. Computes total affected population
4. Prompts `CORTEX.AI_COMPLETE` with telemetry summary
5. Returns structured JSON risk assessment

**Response `200 OK`:**

| Field | Type | Description |
|---|---|---|
| `risk_level` | string | `Red Alert`, `Orange Alert`, or `Yellow Alert` |
| `confidence_score` | integer | Statistical confidence 0–100 |
| `affected_population` | integer | Total estimated impacted residents |
| `affected_barangays` | array[string] | List of high-risk barangay names |
| `recommended_actions` | array[string] | 3 tactical directives |

**Response Example:**
```json
{
  "risk_level": "Red Alert",
  "confidence_score": 94,
  "affected_population": 31200,
  "affected_barangays": ["Tumaga", "Sta. Maria", "Tetuan"],
  "recommended_actions": [
    "Deploy rescue teams to Tumaga",
    "Dispatch multi-channel emergency broadcast",
    "Open local evacuation gymnasiums"
  ]
}
```

---

### 6.3 GET /copilot/history

Retrieves the paginated chat transcript for a given session from `chat_history`.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `session_id` | string | NO | `default_session` | Target session identifier |
| `limit` | integer | NO | `50` | Maximum messages to return (ordered ASC by `created_at`) |

**Request Example:**
```
GET /api/v1/copilot/history?session_id=commander-session-a7f3&limit=20
```

**Response `200 OK`:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "sender": "user",
    "text": "What is the current flood risk in Tumaga?",
    "response": "What is the current flood risk in Tumaga?",
    "explanation": null,
    "recommended_actions": null,
    "timestamp": "2026-07-27T20:54:00"
  },
  {
    "id": "e5f6g7h8-...",
    "sender": "assistant",
    "text": "Based on current telemetry...",
    "response": "Based on current telemetry...",
    "explanation": "Generated live using Snowflake Cortex...",
    "recommended_actions": ["Issue Evacuation Advisory", "Dispatch Emergency Notifications"],
    "timestamp": "2026-07-27T20:54:02"
  }
]
```

---

## 7. Jobs Endpoints (`/jobs`)

Base path: `/api/v1/jobs`

### 7.1 POST /jobs/

Creates a new multi-channel emergency broadcast job. Requires authentication.

**Authentication:** `X-API-Key: <firebase_token>` (required)

**Idempotency:** Provide `Idempotency-Key` or `X-Idempotency-Key` header to enable explicit deduplication. If omitted, a SHA-256 hash of `(recipients_filter + sorted(messages))` is used as the automatic idempotency key.

**Request Headers:**

| Header | Required | Description |
|---|---|---|
| `X-API-Key` | YES | Firebase bearer token |
| `Idempotency-Key` | NO | Client-provided UUID for deduplication |
| `X-Idempotency-Key` | NO | Alias for `Idempotency-Key` |
| `Content-Type` | YES | `application/json` |

**Request Body (JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `messages` | array[string] | YES | One or more message texts to broadcast |
| `channels` | array[string] | YES | Delivery channels: `"sms"`, `"email"`, or both |
| `recipients_filter` | string | YES | Recipient demographic filter (e.g., `high_risk_subscribers_tumaga`) |

**Request Example:**
```json
{
  "messages": [
    "EMERGENCY ALERT: Zamboanga City water level 8.8m. Evacuate Tumaga/Sta. Maria NOW. Call 911. -CDRRMO"
  ],
  "channels": ["sms", "email"],
  "recipients_filter": "high_risk_subscribers_tumaga"
}
```

**Response `201 Created`:**

| Field | Type | Description |
|---|---|---|
| `job_id` | string | UUID v4 tracking identifier |
| `status` | string | Initial status: `queued` |
| `logs` | array[string] | Initial log entry array |
| `counts` | object | Initial dispatch counts: `{"sms": 0, "email": 0}` |

**Response Example:**
```json
{
  "job_id": "3f8b1c2d-0000-4abc-def1-000000000000",
  "status": "queued",
  "logs": [],
  "counts": { "sms": 0, "email": 0 }
}
```

**Error: `409 Conflict` (Duplicate Job):**
```json
{
  "detail": {
    "message": "Duplicate request detected for key hash:a3f82c91... Active job_id: 3f8b1c2d-...",
    "job_id": "3f8b1c2d-0000-4abc-def1-000000000000",
    "error": "DUPLICATE_JOB_SUBMISSION"
  }
}
```

---

### 7.2 GET /jobs/{job_id}

Polls the current status of a broadcast job by its UUID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `job_id` | string (UUID) | YES | Job identifier returned from POST /jobs/ |

**Response `200 OK`:**

| Field | Type | Description |
|---|---|---|
| `job_id` | string | UUID of the job |
| `status` | string | `queued`, `processing`, `completed`, or `failed` |
| `logs` | array[string] | Chronological dispatch log entries |
| `counts` | object | Running delivery counts |

**Response Example (in-progress):**
```json
{
  "job_id": "3f8b1c2d-0000-4abc-def1-000000000000",
  "status": "processing",
  "logs": [
    "Job initialized for filter target: high_risk_subscribers_tumaga",
    "[SMS] Initializing gateway to high_risk_subscribers_tumaga...",
    "[SMS] Dispatched 520 / 1,200 messages (43%)..."
  ],
  "counts": { "sms": 520, "email": 0 }
}
```

**Response Example (completed):**
```json
{
  "job_id": "3f8b1c2d-0000-4abc-def1-000000000000",
  "status": "completed",
  "logs": [
    "Job initialized for filter target: high_risk_subscribers_tumaga",
    "[SMS] Dispatched 1,200 / 1,200 messages (100%)...",
    "[SMS] Broadcast completed to all high-risk mobile subscribers.",
    "[Email] Dispatched 3,500 / 3,500 emails (100%)...",
    "[Email] Broadcast completed to registered emergency contacts.",
    "All multi-channel emergency dispatches verified & completed."
  ],
  "counts": { "sms": 1200, "email": 3500 }
}
```

**Job Not Found:**
```json
{
  "job_id": "nonexistent-uuid",
  "status": "not_found",
  "logs": [],
  "counts": {}
}
```

---

## 8. Map Endpoints (`/map`)

Base path: `/api/v1/map`

### 8.1 GET /map/data

Returns a live GeoJSON FeatureCollection populated from Snowflake database, containing dynamic flood risk zone polygons, evacuation center points, hospital points, and river sensor points.

**Query Parameters:** None

**Response `200 OK`:** GeoJSON FeatureCollection

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "type": "risk_zone",
        "name": "Tumaga / Central River Basin Active Flood Zone",
        "risk_level": "High"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[122.050, 6.930], [122.060, 6.945], ...]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "type": "evacuation_center",
        "name": "Tumaga Gymnasium",
        "capacity": 800,
        "occupancy": 450
      },
      "geometry": {
        "type": "Point",
        "coordinates": [122.0640, 6.9465]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "type": "hospital",
        "name": "Zamboanga City Medical Center (ZCMC)",
        "beds": 65
      },
      "geometry": {
        "type": "Point",
        "coordinates": [122.0735, 6.9335]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "type": "sensor",
        "name": "ZAM-TUMAGA-01",
        "level": "8.8m",
        "status": "Critical"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [122.0630, 6.9440]
      }
    }
  ]
}
```

**Feature Types and Properties:**

| `type` | Geometry | Properties |
|---|---|---|
| `risk_zone` | Polygon | `name`, `risk_level` (`High`) |
| `evacuation_center` | Point | `name`, `capacity`, `occupancy` |
| `hospital` | Point | `name`, `beds` |
| `sensor` | Point | `name`, `level` (e.g., `8.8m`), `status` (`Critical`/`Warning`/`Normal`) |

**Sensor Status Classification:**

| Condition | Status |
|---|---|
| `water_level >= 8.0` | `Critical` |
| `water_level >= 6.0` | `Warning` |
| `water_level < 6.0` | `Normal` |

**Risk Zone Generation:** Dynamic flood risk polygons are computed server-side in `map.py` using `_generate_dynamic_risk_polygon()`. The algorithm:
1. Queries `river_sensors JOIN barangays WHERE water_level >= 6.0`
2. Clusters sensors by latitude threshold (< 7.0° vs >= 7.0°)
3. Generates convex-hull-like polygon with 0.015° buffer (main cluster) or 0.012° buffer (outer cluster)
4. Returns GeoJSON Polygon with closed ring

**Fallback:** Returns `{"type": "FeatureCollection", "features": []}` if Snowflake is unreachable.

---

## 9. Audit Endpoints (`/audit`)

Base path: `/api/v1/audit`

### 9.1 POST /audit/log

Manually inserts an audit event into `SENTINEL_AI_DB.PUBLIC.audit_logs`.

**Request Body (JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `event` | string | YES | Human-readable event description |
| `event_type` | string | YES | Event category code |

**Valid `event_type` Values:**

| Value | Description |
|---|---|
| `fast_path_execution` | Automatic Fast-Path alert triggered |
| `user_approval` | Commander approved a manual directive |
| `risk_assessment` | AI risk assessment computed |
| `copilot_query` | Copilot query processed |

**Request Example:**
```json
{
  "event": "Commander Approved Directive: Deploy 6 Inflatable Rescue Boats to Sector 3",
  "event_type": "user_approval"
}
```

**Response `200 OK`:**
```json
{
  "status": "ok"
}
```

---

### 9.2 GET /audit/approved-directives

Returns the list of all commander-approved directive texts from audit logs.

**Query Parameters:** None

**Response `200 OK`:**
```json
{
  "approved_directives": [
    "Deploy 6 Inflatable Rescue Boats to Sector 3",
    "Open Evacuation Gymnasiums for Tumaga and Tetuan"
  ]
}
```

**Derivation Logic:**
```sql
SELECT DISTINCT event
FROM audit_logs
WHERE event_type = 'user_approval'
  AND event LIKE 'User Approved Directive: %'
```
The prefix `User Approved Directive: ` is stripped from the returned strings.

---

### 9.3 GET /audit/events

Returns the 50 most recent audit events ordered by timestamp descending.

**Query Parameters:** None

**Response `200 OK`:**
```json
{
  "events": [
    {
      "event": "Verified Commander (firebase_anonymous_user) Queued Broadcast Job: 3f8b1c2d-...",
      "type": "user_approval",
      "timestamp": "2026-07-27T20:54:01.000000"
    },
    {
      "event": "Fast-Path Auto-Executed: water_level 8.8m triggered advisory dispatch",
      "type": "fast_path_execution",
      "timestamp": "2026-07-27T20:53:45.000000"
    }
  ]
}
```

**Event Object Schema:**

| Field | Type | Description |
|---|---|---|
| `event` | string | Raw event text |
| `type` | string | Event type category |
| `timestamp` | string | ISO 8601 UTC timestamp string |

---

## 10. Ingestion Endpoints (`/ingestion`)

Base path: `/api/v1/ingestion`

### 10.1 POST /ingestion/sync-weather

Dispatches an asynchronous Celery task to fetch live weather telemetry from Open-Meteo and persist to Snowflake `weather_data`.

**Request Body:** None required

**Response `200 OK`:**

| Field | Type | Description |
|---|---|---|
| `message` | string | Confirmation message |
| `task_id` | string | Celery task UUID for status polling |
| `status` | string | Initial Celery state: `PENDING` |

**Response Example:**
```json
{
  "message": "Celery weather ingestion task dispatched asynchronously",
  "task_id": "c3f8a921-b2e4-4d1a-9f3c-000000000001",
  "status": "PENDING"
}
```

**Error `500 Internal Server Error`:**
```json
{
  "detail": "Failed to dispatch Celery task: Connection refused to Redis broker"
}
```

---

### 10.2 GET /ingestion/status/{task_id}

Polls the execution state and result of a Celery background task.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `task_id` | string | YES | Celery task UUID from POST /ingestion/sync-weather |

**Response `200 OK`:**

| Field | Type | Description |
|---|---|---|
| `task_id` | string | Celery task UUID |
| `status` | string | Celery state: `PENDING`, `STARTED`, `SUCCESS`, `FAILURE`, `RETRY` |
| `ready` | boolean | `true` if task has completed (SUCCESS or FAILURE) |
| `result` | any | Task result payload (null if still pending) |

**Response Example (completed):**
```json
{
  "task_id": "c3f8a921-b2e4-4d1a-9f3c-000000000001",
  "status": "SUCCESS",
  "ready": true,
  "result": {
    "records_inserted": 1,
    "location": "Zamboanga Peninsula",
    "rainfall_mm": 175.0,
    "storm_name": "Typhoon Approaching"
  }
}
```

**Response Example (in-progress):**
```json
{
  "task_id": "c3f8a921-b2e4-4d1a-9f3c-000000000001",
  "status": "STARTED",
  "ready": false,
  "result": null
}
```

---

## 11. WebSocket Endpoint (`/ws`)

Base path: `/api/v1/ws`

### 11.1 WS /ws/telemetry

Establishes a persistent WebSocket connection for real-time bidirectional event streaming. The server pushes two message types: `sensor_update` (every 2 seconds) and `job_log_update` (on job state changes).

**Connection URL:**
```
ws://localhost:8000/api/v1/ws/telemetry
```

**Connection Protocol:**
```
Client                         FastAPI ConnectionManager
  |                                     |
  | ws://...telemetry (HTTP Upgrade)    |
  |------------------------------------>|
  |                                     | accept()
  |                                     | active_connections.append(ws)
  |<----- 101 Switching Protocols ------|
  |                                     |
  |<==== {"type":"sensor_update"...} ===| (every 2s, TelemetryService push)
  |                                     |
  |<==== {"type":"job_log_update"...} ==| (on job state change, broadcast)
  |                                     |
  | client ping (optional)              |
  |------------------------------------>| logged, no response required
  |                                     |
  | disconnect / error                  |
  |------------------------------------>| active_connections.remove(ws)
```

**Notes:**
- Server pushes messages; client-to-server messages are optionally accepted (e.g., ping) but not required
- If the server cannot deliver to a dead connection, it is automatically removed from `active_connections`
- All connected clients receive the same broadcast messages simultaneously (fan-out pattern)
- No authentication required for WebSocket connection in current configuration

---

## 12. WebSocket Payload Structures

### 12.1 `sensor_update`

Pushed every 2 seconds by `TelemetryService._stream_telemetry()`. Contains live sensor readings for all tracked river stations.

```json
{
  "type": "sensor_update",
  "data": [
    {
      "name": "ZAM-TUMAGA-01",
      "level": 8.8,
      "timestamp": "2026-07-27T20:54:00.123456"
    },
    {
      "name": "ZAM-STAMARIA-01",
      "level": 7.4,
      "timestamp": "2026-07-27T20:54:00.123456"
    }
  ]
}
```

**Data Array Item Schema:**

| Field | Type | Description |
|---|---|---|
| `name` | string | Sensor identifier (e.g., `ZAM-TUMAGA-01`) |
| `level` | float | Current water level in meters (±0.1m jitter applied for realism) |
| `timestamp` | string | ISO 8601 timestamp of reading |

---

### 12.2 `job_log_update`

Pushed by `JobExecutionService._broadcast_log()` on every state change and dispatch milestone during a broadcast job.

```json
{
  "type": "job_log_update",
  "job_id": "3f8b1c2d-0000-4abc-def1-000000000000",
  "log": "[SMS] Dispatched 520 / 1,200 messages (43%)...",
  "counts": {
    "sms": 520,
    "email": 0
  },
  "status": "processing"
}
```

**Payload Schema:**

| Field | Type | Description |
|---|---|---|
| `type` | string | Always `"job_log_update"` |
| `job_id` | string | UUID of the active broadcast job |
| `log` | string | Human-readable progress log entry |
| `counts` | object | Running delivery counts per channel |
| `status` | string | Current job state: `queued`, `processing`, `completed`, `failed` |

**Status Progression Events:**

| Log Message | Status |
|---|---|
| `Job initialized for filter target: {filter}` | `queued` |
| `[SMS] Initializing gateway to {filter}...` | `processing` |
| `[SMS] Dispatched N / 1,200 messages (P%)...` | `processing` |
| `[SMS] Broadcast completed to all high-risk mobile subscribers.` | `processing` |
| `[Email] Connecting to SMTP relay service...` | `processing` |
| `[Email] Dispatched N / 3,500 emails (P%)...` | `processing` |
| `[Email] Broadcast completed to registered emergency contacts.` | `processing` |
| `All multi-channel emergency dispatches verified & completed.` | `completed` |
| `[SMS] Carrier retry (Attempt N/3) after timeout... (err)` | `processing` |
| `[Email] SMTP relay retry (Attempt N/3) after timeout... (err)` | `processing` |

---

## Appendix: cURL Examples

**POST /copilot/ask:**
```bash
curl -X POST http://localhost:8000/api/v1/copilot/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the flood risk in Tumaga?","session_id":"test"}'
```

**POST /jobs/ (with idempotency):**
```bash
curl -X POST http://localhost:8000/api/v1/jobs/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: firebase_token" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "messages": ["EMERGENCY ALERT: Evacuate Tumaga immediately!"],
    "channels": ["sms", "email"],
    "recipients_filter": "high_risk_subscribers_tumaga"
  }'
```

**GET /jobs/{job_id}:**
```bash
curl http://localhost:8000/api/v1/jobs/3f8b1c2d-0000-4abc-def1-000000000000
```

**GET /map/data:**
```bash
curl http://localhost:8000/api/v1/map/data | python3 -m json.tool
```

**POST /ingestion/sync-weather:**
```bash
curl -X POST http://localhost:8000/api/v1/ingestion/sync-weather
```

**WebSocket (wscat):**
```bash
wscat -c ws://localhost:8000/api/v1/ws/telemetry
```

---

*© 2026 Sentinel AI. API Reference v0.1.0*
