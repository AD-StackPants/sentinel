# 🛡️ Sentinel AI — Emergency Operations Copilot

> **An AI-powered Emergency Operations Copilot built with Snowflake CoCo CLI that assists disaster response agencies in assessing risks, recommending actionable directives, and reliably notifying affected communities through an audited Job Execution Engine.**

---

## 📖 Overview

**Sentinel AI** is an enterprise decision-support platform engineered for Emergency Operations Centers (EOCs) and Local Disaster Risk Reduction and Management Offices (LDRRMOs). 

Instead of operating as a simple alerting interface, Sentinel AI acts as an **AI Copilot** that ingests real-time disaster telemetry, evaluates flood risks against official Standard Operating Procedures (SOPs), calculates population impact radii, recommends tactical resource deployments, and dispatches audited multi-channel public warnings via a resilient Job Execution Engine.

```
[ Data Ingestion ] ──► [ Risk Assessment ] ──► [ Impact Analysis ]
  Weather, Sensors       CoCo CLI & Cortex      Barangays, Census
                                                       │
                                                       ▼
[ Dispatch Engine ] ◄── [ Tiered Guardrail ] ◄── [ Recommendation ]
  Automated Fast-Path    Automated vs. Manual   Tactical Directives
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
2. **Automated Fast-Path Telemetry Breach Alerts**: When telemetry breaches critical thresholds (river level $\ge 8.0\text{m}$ or rainfall $\ge 150\text{mm}$), the system automatically queries Snowflake Cortex Search, cites matching SOP sections, and dispatches public advisories & responder staging alerts.
3. **Tiered Operator Guardrail Architecture**: Distinguishes zero physical risk automated warnings (Fast-Path) from physical asset deployments (Guardrailed Manual Directives requiring 1-click commander validation).
4. **End-to-End Decision Support**: Manages the complete lifecycle from data collection to AI reasoning, human-in-the-loop approval, multi-channel dispatch, idempotency locking, worker retries, and audit logging.

---

## 🏗️ System Architecture

```text
                  ┌─────────────────────────────────────────────────────────┐
                  │              Live Telemetry Ingestion                   │
                  │ (Open-Meteo Weather, River Sensors, Barangays, Census)  │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Snowflake DB Platform                   │
                  │       (river_sensors, weather_data, SENTINEL_SOPS)      │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FastAPI Backend Service                                      │
│                                                                                              │
│   1. Telemetry Breach Check: (water_level >= 8.0m or rainfall >= 150mm)                      │
│      Trigger Automated Fast-Path SOP RAG Auto-Drafting & Auto-Dispatch                       │
│                                                                                              │
│   2. Retrieve SOP Context via Cortex Search:                                                 │
│      SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('SENTINEL_SOP_SEARCH_SERVICE', %s)                │
│                                                                                              │
│   3. Generate Grounded AI Advisory:                                                          │
│      SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('claude-3-5-sonnet', %s)                            │
└──────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │             Tiered Operator Guardrail UI                │
                  │   ⚡ Fast-Path Automated (Zero Physical Risk)           │
                  │   🛡️ Guardrailed Manual (Physical Asset Deployment)     │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │             Multi-Channel Job Execution Engine            │
                  │   • Single-Request Idempotency Locks (HTTP 409)         │
                  │   • Exponential Backoff Retries & Jitter               │
                  │   • Live WebSocket Streaming to Notification Console     │
                  └─────────────────────────────────────────────────────────┘
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

- **Schema Definition**: [`snowflake/setup_1_schema.sql`](snowflake/setup_1_schema.sql)
- **Seed Telemetry**: [`snowflake/setup_2_seed.sql`](snowflake/setup_2_seed.sql) (pre-loaded with realistic Zamboanga City disaster telemetry)
- **Cortex Search Service**: [`snowflake/setup_3_cortex_search.sql`](snowflake/setup_3_cortex_search.sql) (SOP reference table & vector search)
- **Cortex Semantic View**: [`snowflake/setup_4_semantic_view.sql`](snowflake/setup_4_semantic_view.sql) (Cortex Analyst Text-to-SQL view)
- **Cortex Agent Creation**: [`snowflake/setup_5_cortex_agent.sql`](snowflake/setup_5_cortex_agent.sql) (Agent specification, orchestration, and staged skills)
- **PAT Authentication**: [`snowflake/pat_auth.sql`](snowflake/pat_auth.sql) (Optional Cortex CLI auth policy & PAT token setup)
- **Analytical Verification**: [`snowflake/select.sql`](snowflake/select.sql) (Verification & query checks)

---

## ⚙️ Core Features & Operational Dashboard

### ⚡ 1. Automated Fast-Path Alert Trigger
- **Telemetry Breach Detection**: Automatically triggers when updated river sensor level $\ge 8.0\text{m}$ or rainfall $\ge 150.0\text{mm}$.
- **SOP RAG Auto-Drafting**: Queries Snowflake Cortex Search (`SENTINEL_SOP_SEARCH_SERVICE`) and feeds context to Cortex AI (`claude-3-5-sonnet`) to generate:
  - Localized Public Advisory SMS (<160 chars) + HTML Email.
  - Technical First Responder Staging Alert ("STAND BY & GEAR UP: Deploy crews to staging stations in Tumaga / Sta. Maria").
  - Cited SOP rule section (logged to `audit_logs` with event type `fast_path_execution`).
- **Auto-Dispatch**: Automatically dispatches warning jobs without waiting for manual commander input.

### 🛡️ 2. Tiered Operator Guardrail UI
- **⚡ Fast-Path Automated Directives (Zero Physical Risk)**: Displays Public Multi-Channel Warnings & Responder Staging Notifications as `⚡ AUTO-EXECUTED & STAGED` with live timestamp.
- **🛡️ Guardrailed Manual Directives (Physical Asset Deployment)**: Displays physical commitment directives (e.g., *"Deploy 6 Inflatable Rescue Boats to Sector 3"*, *"Open Evacuation Gymnasiums"*) requiring explicit 1-Click **Approve & Deploy** commander validation.

### 🔒 3. Single-Request Idempotency Locks & Worker Retries
- **Anti-Duplicate Protection**: Central request lock cache checking `Idempotency-Key` headers or payload hashes (`recipients_filter` + `messages`). Rejects duplicate submissions with `HTTP 409 Conflict`.
- **Atomic Database Persistence**: Enforces atomic state transitions in `_persist_job_state`.
- **Exponential Backoff Retries**: Wraps SMS and Email dispatchers with max 3 retries, 2s base delay, and random jitter, streaming retry logs over WebSockets.

### 🤖 4. Copilot Intelligence Interface
- Ask free-form operational questions or use quick-action prompt buttons (*"What is the flood risk?"*, *"What should we do?"*, *"Notify affected residents"*).
- Grounded responses powered by **Snowflake Cortex LLM** with SOP Search RAG over official disaster guidelines.
- Session transcript history stored in Snowflake `chat_history`.

### 🗺️ 5. Dynamic GIS Disaster Map
- Rendered using **MapLibre GL** with dark/light EOC theme options.
- **Dynamic Risk Zone Polygons**: Computed dynamically on the backend ([`map.py`](backend/app/api/map.py)) based on active high-risk river sensors and barangay spatial coordinates.
- Interactive map layers: Flood Risk Zones, Evacuation Centers, Hospitals, and River Sensor Stations with real-time WebSocket telemetry updates.

### 📜 6. Audit Timeline & Incident Reporting
- Persists all AI risk assessments, fast-path SOP executions, human directive approvals, and broadcast job dispatches to Snowflake `audit_logs`.
- One-click **JSON Incident Report Exporter** for post-disaster agency debriefs.

---

## 🎬 Operational Scenario Walkthrough

1. **Typhoon Surge**: Severe precipitation triggers 185mm rainfall and river sensor `ZAM-TUMAGA-01` reaches **8.5m** (exceeding 8.0m Critical Threshold).
2. **Fast-Path Auto Trigger**: Sentinel AI automatically cites `SOP-FL-04 Section 3.2`, logs a `fast_path_execution` audit event, and dispatches public SMS/Email advisories and responder staging notifications.
3. **Operator Overview**: Commander reviews the **Tiered Guardrail UI**:
   - ⚡ **Fast-Path Section**: Shows public warnings and responder staging as `⚡ AUTO-EXECUTED & STAGED`.
   - 🛡️ **Guardrailed Section**: Displays physical deployment directives (*"Deploy 6 Inflatable Rescue Boats to Sector 3"*).
4. **Human Approval & Dispatch Execution**: Commander clicks **"Approve & Deploy"** -> The Job Execution Engine locks request idempotency, dispatches worker jobs with exponential backoff retries, and streams live delivery progress to the console.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **AI Copilot Orchestration** | **Snowflake CoCo CLI** | Agent Skills specification (`agent.yaml`), domain constraints, and workflow routing. |
| **LLM & Search Platform** | **Snowflake Cortex** | `SNOWFLAKE.CORTEX.AI_COMPLETE`, `AGENT_RUN`, and Cortex Search for SOP RAG retrieval. |
| **Data Platform** | **Snowflake DB** | Centralized operational telemetry, census data, spatial coordinates, and audit logs. |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous REST endpoints, WebSockets, Structlog, and Pydantic validation. |
| **Background Processing** | **Celery & Redis** | Asynchronous weather ingestion worker tasks with fast-path triggers & retry protection. |
| **Frontend UI** | **React.js (TypeScript)** | Modern EOC layout, Tailwind CSS design tokens, MapLibre GL, Recharts analytics. |
| **Real-Time Streaming** | **WebSockets** | Live stream of river sensor updates and job dispatch execution logs. |
| **Notification Engine** | **Job Execution Engine** | Multi-channel SMS & Email worker dispatcher with idempotency locks & exponential retries. |
| **Authentication & Security** | **Firebase Auth & FastAPI Dependency** | Google OAuth 2.0 Sign-In, Firebase Bearer Token verification, and protected FastAPI endpoints. |

---

## 📂 Project Structure

```text
sentinel/
├── README.md                 # Product documentation & setup guide
├── .cortex/
│   └── agents/
│       └── SentinelAI.yaml   # Snowflake Cortex / CoCo CLI Agent & Skills specification
├── snowflake/
│   ├── setup.sh              # Automated Snowflake setup shell script
│   ├── setup_1_schema.sql    # Step 1: Database schema DDL setup
│   ├── setup_2_seed.sql      # Step 2: Initial telemetry & census seed data
│   ├── setup_3_cortex_search.sql # Step 3: SOP table & Cortex Search Service setup
│   ├── setup_4_semantic_view.sql # Step 4: Semantic View DDL for Cortex Analyst Text-to-SQL
│   ├── setup_5_cortex_agent.sql  # Step 5: Cortex Agent DDL with staged skills & tool specifications
│   ├── pat_auth.sql          # Snowflake PAT authentication policy & token setup
│   ├── select.sql            # Verification & validation SQL queries
│   └── skills/               # Individual SKILL.md definition directories
├── backend/
│   ├── pyproject.toml        # Python dependencies (managed via uv)
│   ├── tests/                # Pytest suite (test_jobs, test_main, test_rate_limit)
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

### Step 1: Database & Cortex Agent Setup (Snowflake Worksheets or SnowSQL CLI)

Execute the setup scripts in sequential order inside your **Snowflake Worksheets / Dashboard**, or run the automated shell script via SnowSQL CLI:

```bash
./snowflake/setup.sh
```

**Manual Execution Order (Snowsight Worksheets):**

1. **Schema Setup**: Run [`snowflake/setup_1_schema.sql`](snowflake/setup_1_schema.sql) to initialize `SENTINEL_AI_DB` database, schema, and operational tables.
2. **Seed Data**: Run [`snowflake/setup_2_seed.sql`](snowflake/setup_2_seed.sql) to populate initial telemetry, barangay census metrics, evacuation centers, and hospital beds.
3. **PAT Authentication Setup**: Run [`snowflake/pat_auth.sql`](snowflake/pat_auth.sql) to configure authentication policy (`pat_auth_policy`) and generate Programmatic Access Tokens for Cortex CLI.
4. **Cortex Search**: Run [`snowflake/setup_3_cortex_search.sql`](snowflake/setup_3_cortex_search.sql) to set up SOP reference tables and create `SENTINEL_SOP_SEARCH_SERVICE`.
5. **Semantic View**: Run [`snowflake/setup_4_semantic_view.sql`](snowflake/setup_4_semantic_view.sql) to create `SENTINEL_SEMANTIC_VIEW` for Cortex Analyst Text-to-SQL querying.
6. **Cortex Agent**: Run [`snowflake/setup_5_cortex_agent.sql`](snowflake/setup_5_cortex_agent.sql) to stage skills and create the `SentinelAI` Cortex Agent.
7. **Verify Installation**: Run [`snowflake/select.sql`](snowflake/select.sql) to test telemetry, RAG search preview, and Cortex Agent execution.

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

### Step 4: Frontend Setup (React.js & Firebase Auth)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env` (refer to `frontend/.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Access the Sentinel AI Platform at `http://localhost:5173`.
   - **Unauthenticated Users**: View the interactive 1-way scroll landing page and EOC Workflow Simulator with zero backend database queries.
   - **Authenticated Commanders**: Click **"SIGN IN WITH GOOGLE"** to authenticate and access the live Command Center Dashboard.

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
