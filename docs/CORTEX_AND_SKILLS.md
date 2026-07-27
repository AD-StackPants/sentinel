# Sentinel AI — Cortex & Skills Technical Reference

> **Document Type:** AI Platform & Agent Skills Specification
> **Version:** 0.1.0
> **Last Updated:** 2026-07-27

---

## Table of Contents

1. [Snowflake Cortex Platform Overview](#1-snowflake-cortex-platform-overview)
2. [CoCo CLI Agent Configuration](#2-coco-cli-agent-configuration)
3. [Agent Skills Reference](#3-agent-skills-reference)
4. [SENTINEL_SOP_SEARCH_SERVICE (Cortex Search RAG)](#4-sentinel_sop_search_service-cortex-search-rag)
5. [Cortex Analyst Semantic Model](#5-cortex-analyst-semantic-model)
6. [Snowflake Cortex Agent DDL](#6-snowflake-cortex-agent-ddl)
7. [Fast-Path Cortex Integration (Backend)](#7-fast-path-cortex-integration-backend)
8. [Cortex AI_COMPLETE Integration](#8-cortex-ai_complete-integration)
9. [Authentication: PAT Token Setup](#9-authentication-pat-token-setup)
10. [Running the Agent via CoCo CLI](#10-running-the-agent-via-coco-cli)

---

## 1. Snowflake Cortex Platform Overview

Sentinel AI integrates three Snowflake Cortex capabilities:

| Cortex Capability | SQL Function / Object | Usage in Sentinel AI |
|---|---|---|
| **Cortex Search** | `SNOWFLAKE.CORTEX.SEARCH_PREVIEW(...)` | SOP vector search RAG for grounded advisories |
| **Cortex LLM (AI_COMPLETE)** | `SNOWFLAKE.CORTEX.AI_COMPLETE(model, prompt)` | Advisory text generation, risk assessments |
| **Cortex Analyst (Text-to-SQL)** | `sentinel_data` tool | NL queries over live telemetry |
| **Cortex Agent** | `CREATE AGENT SentinelAI` | Multi-tool orchestrated agent |

```
User/Backend Query
        |
        v
+----------------------------+
|  Snowflake Cortex Agent    |  <- SentinelAI (CoCo CLI / AGENT_RUN)
|  (Orchestration: auto)     |
+--------+-------------------+
         |
         +-- sop_search (Cortex Search) -------> SENTINEL_SOP_SEARCH_SERVICE
         |        |
         |        v SOP chunks returned
         +-- sentinel_data (Cortex Analyst) ---> SENTINEL_SEMANTIC_VIEW
                  |
                  v live sensor data returned
         CORTEX.AI_COMPLETE (claude-3-5-sonnet / llama3-8b)
                  |
                  v Structured advisory response
```

---

## 2. CoCo CLI Agent Configuration

**Agent Spec:** `.cortex/agents/SentinelAI.yaml`
**CoCo CLI Runtime Path:** `~/.snowflake/cortex/agents/SentinelAI.yaml`

### Top-Level YAML Structure

```yaml
name: SentinelAI
description: >
  AI-powered Emergency Operations Copilot helping disaster response agencies
  assess risks, recommend actions, and reliably notify affected communities.

instructions: |
  You are SentinelAI, an Emergency Operations Copilot designed for disaster
  response officers. Always provide evidence-based recommendations grounded
  in current telemetry and official SOPs. Never invent sensor readings or
  bypass safety thresholds.

skills:
  - name: weather_intelligence
  - name: flood_risk_assessment
  - name: population_impact
  - name: resource_recommendation
  - name: alert_generator
  - name: notification_dispatcher
```

### YAML Schema Fields

| Field | Type | Description |
|---|---|---|
| `name` | string | Agent identifier for `cortex --agent SentinelAI` |
| `description` | string | Human-readable agent summary |
| `instructions` | string (multiline) | System prompt injected before all interactions |
| `skills` | array | List of skill specifications |
| `skills[].name` | string | Skill identifier |
| `skills[].description` | string | Skill routing description |
| `skills[].input` | object | Input parameter schema |
| `skills[].output` | object | Output field schema |
| `skills[].constraints` | array[string] | Hard behavioral rules |

---

## 3. Agent Skills Reference

All 6 skills are defined in `.cortex/agents/SentinelAI.yaml` and staged to Snowflake at:

```
@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/{skill_name}/SKILL.md
```

---

### 3.1 weather_intelligence

**Purpose:** Retrieves current weather conditions, precipitation, wind speed, and meteorological forecasts for Philippine cities or regions.

**Input Parameters:**

| Parameter | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `location` | string | YES | `"Zamboanga City"` | Philippine city or region |
| `date` | string | NO | Current timestamp | ISO timestamp |

**Output Fields:**

| Field | Type | Description |
|---|---|---|
| `rainfall` | float | Active 12-hour rainfall in mm |
| `storm_category` | string | PAGASA classification |
| `forecast` | string | Narrative forecast with runoff warnings |

**Constraints:**
- `rainfall > 150.0mm` within 12hrs → classify as **CRITICAL HAZARD**
- Ambiguous location → fallback to `Zamboanga City`

---

### 3.2 flood_risk_assessment

**Purpose:** Estimates flood risk levels for river basins and barangays based on sensor water levels, rainfall, and terrain data.

**Input Parameters:**

| Parameter | Type | Required | Default |
|---|---|---|---|
| `rainfall` | float | YES | — |
| `river_level` | float | YES | — |
| `historical_flooding` | boolean | NO | `true` |

**Output Fields:**

| Field | Type | Description |
|---|---|---|
| `risk_level` | string | `Red Alert`, `Orange Alert`, `Yellow Alert`, or `Normal` |
| `confidence` | float | 0.0–1.0 confidence score |
| `explanation` | string | Detailed rationale with sensor thresholds |

**Risk Level Decision Matrix:**

| Condition | Risk Level |
|---|---|
| `river_level >= 8.0m AND rainfall >= 150.0mm` | Red Alert |
| `river_level >= 8.0m OR rainfall >= 150.0mm` | Orange Alert |
| `river_level >= 6.0m OR rainfall >= 100.0mm` | Yellow Alert |
| Below all thresholds | Normal |

**Mandatory Constraints:**
- If `river_level >= 8.0m OR rainfall >= 150.0mm` → risk_level MUST be Red Alert or Orange Alert
- Offline sensor data → `confidence < 0.50`, flagged as fallback telemetry

---

### 3.3 population_impact

**Purpose:** Calculates estimated impacted residents, households, and vulnerable sectors for affected barangays.

**Input Parameters:**

| Parameter | Type | Required |
|---|---|---|
| `barangays` | array[string] | YES |

**Output Fields:**

| Field | Type | Description |
|---|---|---|
| `residents` | integer | Total individuals in flood zone |
| `households` | integer | Total affected household units |
| `vulnerable_sectors` | array[string] | Elderly, infants, PWDs, pregnant women |

---

### 3.4 resource_recommendation

**Purpose:** Recommends tactical resource allocation based on alert level and impacted population.

**Input Parameters:**

| Parameter | Type | Required |
|---|---|---|
| `risk_level` | string | YES |
| `affected_population` | integer | YES |

**Resource Allocation Matrix:**

| Alert Level | Population | Rescue Teams | Boats | Medical Teams | Shelters |
|---|---|---|---|---|---|
| Red Alert | > 10,000 | >= 8 | >= 12 | >= 4 | >= 4 |
| Red Alert | <= 10,000 | >= 4 | >= 6 | >= 2 | >= 2 |
| Orange Alert | Any | >= 3 | >= 4 | >= 2 | >= 2 |
| Yellow Alert | Any | >= 1 standby | >= 2 standby | >= 1 standby | >= 1 identified |

**Scaling:** +2 rescue teams, +3 boats, +1 medical team per additional 5,000 population above base.

---

### 3.5 alert_generator

**Purpose:** Generates localized multi-channel emergency advisory copy (SMS, email, public bulletin) in English, Tagalog, and Chavacano/Bisaya.

**Input Parameters:**

| Parameter | Type | Required |
|---|---|---|
| `alert_level` | string | YES |
| `recommended_actions` | array[string] | YES |
| `affected_areas` | array[string] | YES |

**Output Fields:**

| Field | Type | Constraint |
|---|---|---|
| `sms` | string | MUST be < 160 characters |
| `email` | string | HTML formatted |
| `public_advisory` | string | Press/social media statement |

**SMS Template:**
```
[ALERT LEVEL] [Area]: [Action]. Call [number]. -CDRRMO
```

**Mandatory Constraints:**
- SMS MUST remain under **160 characters**
- Always include CDRRMO emergency hotline
- Include Tagalog translation

**Backend SMS truncation guard:**
```python
sms_text = f"EMERGENCY ALERT: {location} water level {water_level}m / {rainfall}mm rain. Evacuate now!"
if len(sms_text) > 160:
    sms_text = sms_text[:157] + "..."
```

---

### 3.6 notification_dispatcher

**Purpose:** Executes and dispatches emergency alert campaigns through the Job Execution Engine.

**Input Parameters:**

| Parameter | Type | Required | Constraints |
|---|---|---|---|
| `messages` | array[string] | YES | Non-empty |
| `channels` | array[string] | YES | `["sms"]`, `["email"]`, or `["sms","email"]` |
| `recipients_filter` | string | YES | Recognized demographic group |

**Output Fields:**

| Field | Type | Description |
|---|---|---|
| `job_id` | string | UUID v4 tracking identifier |
| `delivery_status` | string | Initial state: `queued` |
| `execution_history` | string | Initial audit log entry |

**Mandatory Constraints:**
- At least 1 valid delivery channel required
- All jobs must create a UUID tracking entry in audit logs

---

## 4. SENTINEL_SOP_SEARCH_SERVICE (Cortex Search RAG)

**Setup Script:** `snowflake/setup_3_cortex_search.sql`

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE SENTINEL_SOP_SEARCH_SERVICE
  ON content
  ATTRIBUTES title, category
  WAREHOUSE = COMPUTE_WH
  TARGET_LAG = '1 hour'
  AS (SELECT id, title, category, content FROM SENTINEL_SOPS);
```

### Service Parameters

| Parameter | Value | Description |
|---|---|---|
| `ON content` | Indexed column | `content` TEXT vectorized |
| `ATTRIBUTES` | `title`, `category` | Filterable metadata |
| `TARGET_LAG` | `1 hour` | Maximum index staleness |
| `WAREHOUSE` | `COMPUTE_WH` | Embedding compute resource |

### SOP Documents Indexed

| SOP ID | Title | Category | Key Threshold |
|---|---|---|---|
| `SOP-EVAC-01` | Flood Evacuation Trigger Protocol | Evacuation | river >= 8.0m or rainfall >= 150mm |
| `SOP-RES-02` | Resource Allocation & Deployment Guidelines | Resources | RED ALERT + pop > 10,000 |
| `SOP-ALERT-03` | Multi-Channel Alert Dispatch Protocol | Notifications | SMS < 160 chars |
| `SOP-MED-04` | Emergency Medical & Casualty Handling Protocol | Medical | ZCMC/West Metro/ZDH mobilization |

### Python RAG Query Pattern

```python
search_config = {
    "query": "flood evacuation SOP rules critical water level threshold",
    "columns": ["content", "section_id"],
}
cursor.execute(
    "SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('SENTINEL_SOP_SEARCH_SERVICE', %s)",
    (json.dumps(search_config),)
)
rag_result = cursor.fetchone()
results_json = json.loads(str(rag_result[0]))
sop_context = " ".join([r.get("content", "") for r in results_json["results"]])
```

### Cortex Agent Tool Binding

```sql
tools:
  - tool_spec:
      type: "cortex_search"
      name: "sop_search"
      description: "Search official emergency SOPs, flood thresholds, evacuation guidelines"
tool_resources:
  sop_search:
    search_service: "SENTINEL_AI_DB.PUBLIC.SENTINEL_SOP_SEARCH_SERVICE"
```

---

## 5. Cortex Analyst Semantic Model

**Setup Script:** `snowflake/setup_4_semantic_view.sql`
**Stage Path:** `@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/sentinel_semantic_model.yaml`

### Semantic Model YAML (abbreviated)

```yaml
name: sentinel_semantic_model
description: >
  Sentinel AI disaster telemetry, river sensors, barangays,
  evacuation centers, and hospital capacity semantic model

tables:
  - name: weather_data
    measures:
      - name: rainfall
        description: Rainfall amount in millimeters
        data_type: NUMBER
        default_aggregation: sum

  - name: river_sensors
    dimensions:
      - name: alert_level
        description: "RED ALERT (>= 8.0m), ORANGE ALERT (>= 6.0m), NORMAL (< 6.0m)"
    measures:
      - name: water_level
        description: Current water level in meters
        data_type: NUMBER
        default_aggregation: max

  - name: barangays
    measures:
      - name: population
        description: Total resident population
        default_aggregation: sum

  - name: evacuation_centers
    measures:
      - name: capacity
        default_aggregation: sum
      - name: current_occupancy
        default_aggregation: sum

  - name: hospitals
    measures:
      - name: beds_available
        default_aggregation: sum
```

### Sample Natural Language Queries

| Query | Generated SQL Pattern |
|---|---|
| `"Which sensors are at RED ALERT?"` | `SELECT sensor_id, water_level FROM river_sensors WHERE alert_level = 'RED ALERT'` |
| `"Total affected population?"` | `SELECT SUM(population) FROM barangays WHERE barangay IN (SELECT barangay FROM river_sensors WHERE water_level >= 6.0)` |
| `"Available evacuation beds?"` | `SELECT SUM(capacity - current_occupancy) FROM evacuation_centers` |
| `"Current rainfall?"` | `SELECT rainfall, storm_name FROM weather_data ORDER BY timestamp DESC LIMIT 1` |

### Cortex Agent Tool Binding

```sql
tools:
  - tool_spec:
      type: "cortex_analyst_text_to_sql"
      name: "sentinel_data"
      description: "Query river sensors, weather data, barangays, evacuation centers, flood history"
tool_resources:
  sentinel_data:
    semantic_model_file: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/sentinel_semantic_model.yaml"
    execution_environment:
      type: "warehouse"
      warehouse: "COMPUTE_WH"
```

---

## 6. Snowflake Cortex Agent DDL

**Setup Script:** `snowflake/setup_5_cortex_agent.sql`

```sql
CREATE OR REPLACE AGENT SentinelAI
  FROM SPECIFICATION $$
models:
  orchestration: "auto"

instructions:
  system: |
    You are SentinelAI, an AI-powered Emergency Operations Copilot.
    Always use your tools:
    1. 'sop_search': Retrieves official SOPs, river thresholds, evacuation directives
    2. 'sentinel_data': Queries live sensors, weather, demographics, shelter availability

    ALWAYS call 'sop_search' when responding to disaster/flood queries.
    Compare sensor levels against official SOP thresholds to classify risk.

  orchestration: |
    Follow a 5-step reasoning sequence:
    1. Protocol Search: sop_search for official guidelines
    2. Telemetry Assessment: Compare levels vs SOP thresholds
    3. Population Impact: Estimate affected residents and vulnerable sectors
    4. Resource Prescription: Rescue teams, boats, medical units, shelters
    5. Advisory & Campaign: Draft SMS (<160 chars) and email advisories

  response: |
    Provide structured, SOP-grounded guidance.
    Use uppercase headers: [RED ALERT - EVACUATE IMMEDIATELY]
    SMS must remain strictly under 160 characters.

  sample_questions:
    - question: "Assess flood risk for Tumaga river level 8.8m and rainfall 175mm"
    - question: "Deploy resources for Red Alert affecting 15,000 residents"
    - question: "Generate evacuation SMS for high-risk barangays"

tools:
  - tool_spec:
      type: "cortex_search"
      name: "sop_search"
      description: "Search official emergency SOPs, flood thresholds, evacuation guidelines"
  - tool_spec:
      type: "cortex_analyst_text_to_sql"
      name: "sentinel_data"
      description: "Query river sensors, weather data, barangays, evacuation centers, flood history"

tool_resources:
  sop_search:
    search_service: "SENTINEL_AI_DB.PUBLIC.SENTINEL_SOP_SEARCH_SERVICE"
  sentinel_data:
    semantic_model_file: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/sentinel_semantic_model.yaml"
    execution_environment:
      type: "warehouse"
      warehouse: "COMPUTE_WH"
$$;
```

### Agent Verification

```sql
DESCRIBE AGENT SENTINEL_AI_DB.PUBLIC.SentinelAI;
```

---

## 7. Fast-Path Cortex Integration (Backend)

The backend (`copilot_service.py`) integrates Cortex Search + AI_COMPLETE directly for sub-second automated advisories on telemetry breach.

### generate_fast_path_alerts() Flow

```python
def generate_fast_path_alerts(
    self,
    trigger_reason: str,
    location: str = "Zamboanga City",
    water_level: float = 8.5,
    rainfall: float = 165.0,
) -> dict:

    # Step 1: Cortex Search SOP RAG
    search_config = {
        "query": "flood evacuation responder staging SOP rules critical water level",
        "columns": ["content", "section_id"],
    }
    cursor.execute(
        "SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('SENTINEL_SOP_SEARCH_SERVICE', %s)",
        (json.dumps(search_config),)
    )
    sop_context = " ".join([r.get("content", "") for r in results_json["results"]])

    # Step 2: AI_COMPLETE advisory generation
    prompt = (
        f"You are Sentinel AI Emergency Operations Assistant for {location}.\n"
        f"Telemetry breach: {trigger_reason} "
        f"(Water Level: {water_level}m, Rainfall: {rainfall}mm).\n"
        f"SOP Context: {sop_context}.\n"
        "Generate a JSON object with: sms_copy (<160 chars), "
        "email_copy (HTML), staging_alert, citation."
    )
    cursor.execute(
        f"SELECT SNOWFLAKE.CORTEX.AI_COMPLETE('{model}', %s)", (prompt,)
    )

    # Step 3: Return structured response
    return {
        "sms_copy":      "...",
        "email_copy":    "<h2>...</h2>",
        "staging_alert": "STAND BY & GEAR UP: Deploy crews to staging stations",
        "citation":      "SOP-FL-04 Section 3.2: River Basin Emergency Staging",
    }
```

### Fallback Pattern (Snowflake Offline)

```python
sms_text = (
    f"EMERGENCY ALERT: {location} water level {water_level}m / "
    f"{rainfall}mm rain. Evacuate low zones Tumaga/Sta. Maria now!"
)
if len(sms_text) > 160:
    sms_text = sms_text[:157] + "..."

staging_msg = "STAND BY & GEAR UP: Deploy crews to staging stations in Tumaga / Sta. Maria"
citation = "SOP-FL-04 Section 3.2: River Basin Emergency Staging & Mass Advisory Protocol"
```

---

## 8. Cortex AI_COMPLETE Integration

### Function Signature

```sql
SELECT SNOWFLAKE.CORTEX.AI_COMPLETE(
    '<model_name>',  -- LLM model identifier
    <prompt_string>  -- System + user prompt string
)
```

### Configured Models

| Setting | Value | Context |
|---|---|---|
| `SNOWFLAKE_CORTEX_MODEL` (env var) | `llama3-8b` | Default Copilot queries |
| Fast-Path model (hardcoded) | `claude-3-5-sonnet` | Fast-path advisory generation |

### Double-Stringification Handling

Cortex occasionally wraps JSON responses in a string literal. The backend handles this defensively:

```python
raw_text = str(cortex_res[0])
if raw_text.startswith('"') and raw_text.endswith('"'):
    try:
        raw_text = json.loads(raw_text)  # Decode outer string wrapper
    except Exception:
        pass

# Extract embedded JSON object
json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
if json_match:
    parsed = json.loads(json_match.group().strip())
```

### Recommendations Prompt Structure

```python
prompt = (
    f"You are an Emergency Operations AI Copilot.\n"
    f"Analyze current disaster telemetry for {city} ({region}):\n"
    f"- Storm: {storm_name} ({rainfall}mm rainfall)\n"
    f"- Highest River Sensor: {highest_water_level}m\n"
    f"- High Risk Barangays: {', '.join(high_risk_barangays)}\n"
    f"- Estimated Affected Population: {total_affected_pop}\n\n"
    "Return ONLY a JSON object with keys: "
    "risk_level, confidence_score, affected_population, "
    "affected_barangays, recommended_actions"
)
```

---

## 9. Authentication: PAT Token Setup

**Setup Script:** `snowflake/pat_auth.sql`

```sql
-- Create authentication policy for PAT tokens
CREATE OR REPLACE AUTHENTICATION POLICY pat_auth_policy
  AUTHENTICATION_METHODS = ('PASSWORD', 'KEYPAIR', 'PROGRAMMATIC_ACCESS_TOKEN');

-- Apply policy to SentinelAI service user
ALTER USER sentinelai_service_user
  SET AUTHENTICATION POLICY = pat_auth_policy;
```

**CoCo CLI Connection Config (`~/.snowflake/connections.toml`):**
```toml
[connections.sentinelai]
account = "your_account"
user = "sentinelai_service_user"
token = "<programmatic_access_token>"
role = "ACCOUNTADMIN"
warehouse = "COMPUTE_WH"
database = "SENTINEL_AI_DB"
schema = "PUBLIC"
```

---

## 10. Running the Agent via CoCo CLI

### Prerequisites

1. Snowflake CoCo CLI installed
2. PAT token in `~/.snowflake/connections.toml`
3. Agent YAML in `~/.snowflake/cortex/agents/SentinelAI.yaml`
4. All setup scripts executed (`setup_1` through `setup_5`)

### Run Command

```bash
cortex --agent SentinelAI
```

### Interactive Session Example

```
SentinelAI> Assess flood risk for Tumaga river level 8.8m and rainfall 175mm
```

**Agent Reasoning Chain:**
```
Step 1: [sop_search] "flood evacuation trigger protocol RED ALERT 8.0m 150mm"
        --> Retrieved SOP-EVAC-01: "When river sensor readings exceed 8.0 meters..."

Step 2: [sentinel_data] "SELECT water_level FROM river_sensors WHERE barangay='Tumaga'"
        --> water_level = 8.8m, alert_level = 'RED ALERT'

Step 3: Risk: 8.8m >= 8.0m AND 175mm >= 150mm --> RED ALERT (confidence: 0.97)

Step 4: [sentinel_data] "SELECT SUM(population) FROM barangays WHERE barangay IN (...)"
        --> affected_population: 86,400

Step 5: Generate SOP-cited response with tactical directives and SMS advisory
```

**Agent Response:**
```
[RED ALERT - EVACUATE IMMEDIATELY]

ZAM-TUMAGA-01: 8.8m (exceeds 8.0m critical threshold, SOP-EVAC-01)
Active Rainfall: 175mm (exceeds 150mm threshold)
MANDATORY EVACUATION: Tumaga, Sta. Maria, Tetuan (est. 86,400 residents)

TACTICAL RESOURCES (SOP-RES-02):
  Rescue Teams: >= 8 swift-water teams
  Boats: >= 12 inflatable rescue craft
  Medical Units: >= 4 emergency medical teams
  Shelters: >= 4 (Tumaga Gymnasium, City Coliseum Tetuan...)

SMS (158/160 chars):
"RED ALERT Tumaga: EVACUATE NOW to Tumaga Gymnasium/City Coliseum. Call 911/CDRRMO. -EOC"
```

---

*© 2026 Sentinel AI. Cortex & Skills Reference v1.0.0*
