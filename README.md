# 🛡️ Sentinel AI — Emergency Operations Copilot

> **An AI-powered Emergency Operations Copilot built with Snowflake CoCo CLI that assists disaster response agencies in assessing risks, recommending actionable directives, and reliably notifying affected communities through an audited Job Execution Engine.**

---

## 📖 Overview

**Sentinel AI** is an enterprise decision-support platform engineered for Emergency Operations Centers (EOCs) and Local Disaster Risk Reduction and Management Offices (LDRRMOs). 

Instead of operating as a simple alerting interface, Sentinel AI acts as an **AI Copilot** that ingests real-time disaster telemetry, evaluates flood risks against official Standard Operating Procedures (SOPs), calculates population impact radii, recommends tactical resource deployments, and dispatches audited multi-channel public warnings via a resilient Job Execution Engine.

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│   Data Ingestion       │ ───► │    Risk Assessment     │ ───► │   Impact Analysis      │
│ Weather, Rivers, Census│      │ CoCo CLI & Cortex LLM  │      │ Barangays, Shelters    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                            │
┌────────────────────────┐      ┌────────────────────────┐                  ▼
│  Notification Delivery │ ◄─── │     Human Approval     │ ◄─── ┌────────────────────────┐
│ Job Execution Engine   │      │ Operator Guardrail     │      │ Action Recommendation  │
└────────────────────────┘      └────────────────────────┘      │ Tactical Directives    │
                                                                └────────────────────────┘
```

---

## 🎯 Industry Focus & Operational Relevance

### Emergency Management & Public Safety
During natural disasters (typhoons, flash floods, monsoon surges), disaster commanders operate under tight time constraints. Emergency response teams face critical bottlenecks:

- **Fragmented Data Silos**: Meteorological forecasts, river sensor levels, census databases, and shelter capacity lists are scattered across isolated systems.
- **Manual Assessment Delays**: Officers spend precious time manually collating data before issuing evacuation warnings.
- **Inconsistent Alert Quality**: Broadcast advisories lack standardized local dialect translation or clear action directives.
- **Unreliable Notification Delivery**: Generic messaging channels lack delivery tracking, retry mechanisms, or progress status.

### The Sentinel AI Advantage
Sentinel AI integrates domain-specific data and decision patterns into a unified operational canvas:
1. **Real-World Operational Grounding**: Built directly around official disaster response SOPs and incident management workflows.
2. **Domain-Specific AI Orchestration**: Powered by **Snowflake CoCo CLI** agent skills with hard domain guardrails (e.g. automatic Red Alert triggers when 12-hr rainfall $> 150\text{mm}$ or river levels $\ge 8.0\text{m}$).
3. **End-to-End Decision Support**: Manages the complete lifecycle from data collection to AI reasoning, human-in-the-loop approval, multi-channel dispatch, and audit logging.

---

## 🏗️ System Architecture

```text
       Live Telemetry & Field Feeds
 (Weather APIs, River Sensors, Census, Shelters)
                      │
                      ▼
            ┌──────────────────┐
            │   Snowflake DB   │
            │  Data Platform   │
            └─────────┬────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   CoCo CLI Copilot     │
         │  (Cortex LLM & RAG)    │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Decision Support Engine│
         │  (Risk & Impact Skills)│
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Human Approval Layer   │
         │ (Commander Guardrails) │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Job Execution Engine   │
         │ (SMS, Email, Retries)  │
         └────────────┬───────────┘
                      │
                      ▼
          Responders & Communities
```

---

## 🤖 Snowflake CoCo CLI & Agent Skills Architecture

The copilot's intelligence and domain workflows are configured in [`coco/agent.yaml`](coco/agent.yaml) using the **Snowflake CoCo CLI specification**:

```yaml
name: SentinelAI
description: AI-powered Emergency Operations Copilot helping disaster response agencies assess risks, recommend actions, and reliably notify affected communities.
```

### 🛠️ Configured Agent Skills:

| Skill Name | Purpose | Domain Inputs | Output Metrics & Directives |
| :--- | :--- | :--- | :--- |
| **`weather_intelligence`** | Retrieves active precipitation, wind speed, & forecasts. | `location`, `date` | Rainfall (mm), PAGASA storm classification, meteorological forecast narrative. |
| **`flood_risk_assessment`** | Computes real-time flood alert level (Red/Orange/Yellow/Normal). | `rainfall`, `river_level`, `historical_flooding` | Alert level, statistical confidence score, threshold explanation. |
| **`population_impact`** | Aggregates impacted demographic metrics across barangays. | `barangays` | Estimated residents, households, and vulnerable sectors requiring evacuation. |
| **`resource_recommendation`** | Recommends tactical deployment assets based on risk level. | `risk_level`, `affected_population` | Recommended swift-water rescue teams, inflatable boats, ambulances, & shelters. |
| **`alert_generator`** | Crafts localized multi-channel advisories in English & Tagalog. | `alert_level`, `recommended_actions`, `affected_areas` | 160-char SMS copy, formal HTML email advisory, and public press statement. |
| **`notification_dispatcher`** | Launches multi-channel alert campaign via Job Execution Engine. | `messages`, `channels`, `recipients_filter` | Tracking `job_id`, initial queue status, and audit execution log. |

---

## 🗄️ Snowflake Data Model

The platform relies on a centralized operational data warehouse schema in Snowflake (`SENTINEL_AI_DB.PUBLIC`):

```text
SENTINEL_AI_DB.PUBLIC
├── weather_data         (timestamp, location, rainfall, wind_speed, storm_name, forecast)
├── flood_history        (barangay, date, severity, water_level)
├── river_sensors        (sensor_id, barangay, water_level, timestamp, latitude, longitude)
├── barangays            (barangay, city, population, latitude, longitude)
├── evacuation_centers   (name, capacity, current_occupancy, barangay, latitude, longitude)
├── hospitals            (hospital, beds_available, barangay, latitude, longitude)
├── citizen_contacts     (phone, email, barangay)
├── audit_logs           (event, event_type, timestamp)
├── execution_jobs       (job_id, status, messages, channels, recipients_filter, logs, counts)
├── execution_tasks      (task_id, job_id, type, payload, status, retry_count)
└── chat_history         (id, session_id, role, content, metadata, created_at)
```

- **Schema Definition**: [`snowflake/schema.sql`](snowflake/schema.sql)
- **Seed Telemetry**: [`snowflake/seed.sql`](snowflake/seed.sql) (pre-loaded with realistic Zamboanga City disaster telemetry)

---

## ⚙️ Core Features & Operational Dashboard

### 🤖 1. Copilot Intelligence Interface
- Ask free-form operational questions or use quick-action prompt buttons (*"What is the flood risk?"*, *"What should we do?"*, *"Notify affected residents"*).
- Grounded responses powered by **Snowflake Cortex LLM** (`SNOWFLAKE.CORTEX.COMPLETE`) with explicit reasoning explanations and Cortex Search RAG over official SOPs.
- Session transcript history stored in Snowflake `chat_history`.

### 🗺️ 2. Dynamic GIS Disaster Map
- Rendered using **MapLibre GL** with dark/light EOC theme options.
- **Dynamic Risk Zone Polygons**: Computed dynamically on the backend ([`map.py`](backend/app/api/map.py)) based on active high-risk river sensors and barangay spatial coordinates.
- Interactive map layers: Flood Risk Zones, Evacuation Centers (with capacity stats), Hospitals (with bed availability), and River Sensor Stations.
- **Real-Time Telemetry Updates**: River sensor water levels stream live to the map via WebSockets.

### 📋 3. Recommendation & Directive Panel
- **Alert Status & Confidence**: Real-time alert status badge (e.g. `Orange Alert`, `94% Confidence`).
- **Impact Radius**: Displays total affected population and targeted barangays.
- **Human-in-the-Loop Directive Approvals**: Interactive buttons allow commanders to review and approve specific AI directives (e.g., *"Deploy 8 rescue teams"*, *"Open City Coliseum"*).

### 📡 4. Job Execution & Notification Console
- Tracks multi-channel broadcast jobs (`SMS` and `Email`).
- Live dispatch progress counters (e.g. `1,200 / 1,200 SMS (100%)`).
- Real-time log streaming via WebSocket updates (`job_log_update`).
- Controls for text resizing, log filtering (`SMS`/`Email`), and log copying.

### 📜 5. Audit Timeline & Incident Reporting
- Logs all AI risk assessments, human directive approvals, and broadcast job dispatches.
- Automatically persisted to Snowflake `audit_logs`.
- One-click **JSON Incident Report Exporter** for post-disaster agency debriefs.

---

## 🎬 Operational Scenario Walkthrough

1. **Typhoon Surge**: Severe precipitation triggers 175mm rainfall and river sensor `ZAM-TUMAGA-01` reaches **8.8m** (exceeding 8.0m Critical Threshold).
2. **Operator Query**: Commander asks: *"Which areas are at greatest flood risk?"*
3. **AI Reasoning**: Copilot identifies high-risk barangays (*Tumaga, Sta. Maria, Tetuan*), calculates 28,000 affected residents, and explains sensor threshold breach.
4. **Action Directive**: Commander asks: *"What should we do?"* -> Copilot recommends an **Orange Alert**, deploying 8 rescue teams, 4 ambulances, and opening local shelters.
5. **Human Approval & Execution**: Commander clicks **"Approve Directive"** -> The Job Execution Engine queues and dispatches SMS/Email alerts to affected residents, streaming live delivery logs to the console and recording audit trails in Snowflake.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **AI Copilot Orchestration** | **Snowflake CoCo CLI** | Agent Skills specification (`agent.yaml`), domain constraints, and workflow routing. |
| **LLM & Search Platform** | **Snowflake Cortex** | `SNOWFLAKE.CORTEX.COMPLETE` & `SEARCH_PREVIEW` for SOP RAG retrieval. |
| **Data Platform** | **Snowflake DB** | Centralized operational telemetry, census data, spatial coordinates, and audit logs. |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous REST endpoints, WebSockets, Structlog, and Pydantic validation. |
| **Background Processing** | **Celery & Redis** | Asynchronous weather ingestion worker tasks with idempotency & retry protection. |
| **Frontend UI** | **React.js (TypeScript)** | Modern EOC layout, Tailwind CSS design tokens, MapLibre GL, Recharts analytics. |
| **Real-Time Streaming** | **WebSockets** | Live stream of river sensor updates and job dispatch execution logs. |
| **Notification Engine** | **Job Execution Engine** | Multi-channel SMS (Twilio gateway mock) & Email (SMTP relay mock) task dispatcher. |

---

## 📂 Project Structure

```text
sentinel/
├── README.md                 # Product documentation & setup guide
├── coco/
│   └── agent.yaml            # Snowflake CoCo CLI Agent & Skills specification
├── snowflake/
│   ├── schema.sql            # Snowflake DB tables & initial schema setup
│   ├── seed.sql              # Telemetry & census seed dataset
│   └── select.sql            # Analytical verification queries
├── backend/
│   ├── pyproject.toml        # Python dependencies (managed via uv)
│   ├── tests/                # Pytest suite
│   └── app/
│       ├── main.py           # FastAPI application entrypoint
│       ├── api/              # REST & WebSocket endpoints (copilot, map, jobs, audit, ingestion)
│       ├── core/             # Configuration & Celery app initialization
│       ├── services/         # Copilot Service, Job Execution Service, Audit Service
│       └── tasks/            # Celery background ingestion worker tasks
└── frontend/
    ├── package.json          # Node dependencies
    ├── vite.config.ts        # Vite build configuration
    └── src/
        ├── App.tsx           # EOC Shell with Dark/Light theme toggle & navigation bar
        ├── components/       # Dashboard components (ChatInterface, DisasterMap, RecommendationPanel, etc.)
        └── hooks/            # Custom React hooks (useTelemetryWebSocket)
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **Python**: `3.12+` with [`uv`](https://github.com/astral-sh/uv) installed
- **Node.js**: `v18+` and `npm`
- **Snowflake Account**: *(Optional for production Cortex LLM execution; offline mock fallback is included out of the box)*

---

### Step 1: Database Setup (Snowflake)
1. Log into your Snowflake Worksheets interface.
2. Run [`snowflake/schema.sql`](snowflake/schema.sql) to initialize database tables.
3. Run [`snowflake/seed.sql`](snowflake/seed.sql) to populate initial telemetry, barangays, evacuation centers, and hospitals.

---

### Step 2: Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies using `uv`:
   ```bash
   uv sync
   ```
3. Configure environment variables (`.env`):
   ```env
   DEFAULT_JURISDICTION_CITY=Zamboanga City
   DEFAULT_JURISDICTION_REGION=Zamboanga Peninsula
   DEFAULT_MAP_LATITUDE=6.9214
   DEFAULT_MAP_LONGITUDE=122.0790
   
   # Optional Snowflake Credentials (falls back gracefully to offline mock if placeholder)
   SNOWFLAKE_USER=placeholder_user
   SNOWFLAKE_PASSWORD=placeholder_password
   SNOWFLAKE_ACCOUNT=placeholder_account
   SNOWFLAKE_DATABASE=SENTINEL_AI_DB
   SNOWFLAKE_SCHEMA=PUBLIC
   ```
4. Run the FastAPI development server:
   ```bash
   uv run fastapi dev
   ```
   The backend API will run on `http://localhost:8000`.

5. Run test suite:
   ```bash
   uv run pytest
   ```

---

### Step 3: Celery Background Ingestion Worker (Optional)
To run asynchronous weather ingestion workers:
```bash
cd backend
uv run celery -A app.core.celery_app worker --loglevel=info
```
*(You can also trigger manual Celery telemetry syncs directly from the dashboard header button).*

---

### Step 4: Frontend Setup (React.js)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the Operational Dashboard at `http://localhost:5173`.

---

### Step 5: Cortex Agent Registration
The custom agent definition is configured in `.cortex/agents/SentinelAI.yaml` (and `~/.snowflake/cortex/agents/SentinelAI.yaml`).

To run the Cortex Agent with the SentinelAI custom specification:
```bash
cortex --agent SentinelAI
```

---

## 📜 License & Copyright

© 2026 Sentinel AI. Built with Snowflake CoCo CLI, Snowflake Cortex, FastAPI, and React.
