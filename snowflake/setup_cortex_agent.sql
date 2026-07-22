-- Setup script for SentinelAI Cortex Agent using inline YAML specification
-- Co-authored with CoCo

-- DROP AGENT IF EXISTS SENTINEL_AI_DB.PUBLIC.SentinelAI;

USE ROLE ACCOUNTADMIN;
USE WAREHOUSE COMPUTE_WH;
USE DATABASE SENTINEL_AI_DB;
USE SCHEMA PUBLIC;

-- Step 1: Create internal stage for agent skills
CREATE STAGE IF NOT EXISTS AGENT_SKILLS_STAGE
  DIRECTORY = (ENABLE = TRUE)
  COMMENT = 'Stage for SentinelAI agent skill definitions';

-- Step 2: Upload skill SKILL.md files to stage
-- weather_intelligence
COPY INTO @AGENT_SKILLS_STAGE/skills/weather_intelligence/SKILL.md
FROM (
  SELECT 'name: weather_intelligence
description: Retrieves current weather conditions, active precipitation, wind speed, and meteorological forecasts for specified Philippine cities or regions. Use this skill for weather forecasts, rainfall totals, approaching typhoons, or PAGASA/Open-Meteo telemetry status.
instructions: |
  When the user asks about weather conditions for a location:

  1. Identify the target location (Philippine city, municipality, or region).
     - If location is missing or ambiguous, default to Zamboanga City.
  2. Identify the target date/time. Default to current timestamp if omitted.

  3. Provide the following information:
     - Active 12-hour rainfall volume in millimeters (mm)
     - PAGASA storm classification (e.g., Tropical Depression, Severe Tropical Storm, Super Typhoon)
     - Human-readable meteorological narrative and runoff warning forecast

  4. Apply these rules:
     - If rainfall > 150.0mm within 12 hours, automatically classify the storm as a CRITICAL HAZARD
     - Include wind speed data when available
     - Reference PAGASA and Open-Meteo telemetry sources

  Output format:
  - Location: [target location]
  - Rainfall (12hr): [value] mm
  - Storm Category: [PAGASA classification]
  - Forecast: [narrative forecast with runoff warnings]
  - Hazard Status: [Normal / Critical Hazard]
'
)
FILE_FORMAT = (TYPE = CSV FIELD_OPTIONALLY_ENCLOSED_BY = NONE COMPRESSION = NONE)
SINGLE = TRUE
OVERWRITE = TRUE;

-- flood_risk_assessment
COPY INTO @AGENT_SKILLS_STAGE/skills/flood_risk_assessment/SKILL.md
FROM (
  SELECT 'name: flood_risk_assessment
description: Estimates real-time flood risk levels (Red Alert, Orange Alert, Yellow Alert, Normal) for vulnerable river basins and barangays based on river sensor water levels, active rainfall, and terrain elevation data. Use when evaluating river basin runoff, sensor thresholds, or barangay flood exposure.
instructions: |
  When evaluating flood risk:

  1. Collect input parameters:
     - Accumulated rainfall volume in mm (required, must be >= 0.0)
     - Live river sensor water level reading in meters (required, critical threshold: 8.0m)
     - Historical flooding flag (optional, defaults to true)

  2. Determine risk level using these MANDATORY rules:
     - RED ALERT: river_level >= 8.0m AND rainfall >= 150.0mm
     - ORANGE ALERT: river_level >= 8.0m OR rainfall >= 150.0mm
     - YELLOW ALERT: river_level >= 6.0m OR rainfall >= 100.0mm
     - NORMAL: below all thresholds

  3. Calculate confidence score (0.0 to 1.0):
     - If sensor data is online and recent: confidence >= 0.85
     - If sensor data is offline or unreachable: confidence < 0.50, flag as fallback telemetry

  4. Provide detailed explanation referencing:
     - Specific sensor threshold breaches
     - Runoff rates and drainage capacity
     - High-risk barangays in the flood zone

  Output format:
  - Risk Level: [Red Alert / Orange Alert / Yellow Alert / Normal]
  - Confidence: [0.0 - 1.0] ([percentage]%)
  - River Level: [value] m (threshold: 8.0m)
  - Rainfall: [value] mm (threshold: 150.0mm)
  - Explanation: [detailed rationale]
  - Affected Barangays: [list of high-risk barangays]
'
)
FILE_FORMAT = (TYPE = CSV FIELD_OPTIONALLY_ENCLOSED_BY = NONE COMPRESSION = NONE)
SINGLE = TRUE
OVERWRITE = TRUE;

-- population_impact
COPY INTO @AGENT_SKILLS_STAGE/skills/population_impact/SKILL.md
FROM (
  SELECT 'name: population_impact
description: Calculates estimated number of impacted residents, households, and vulnerable sectors (elderly, infants, PWDs) for affected barangays based on official census statistics and active flood contours.
instructions: |
  When calculating population impact:

  1. Identify affected barangays from the request.
     - If no specific barangays are given, provide jurisdiction-wide estimates for Zamboanga City.

  2. For each affected barangay, estimate:
     - Total number of residents in the flood zone
     - Total number of affected household units
     - Vulnerable demographic groups requiring priority evacuation:
       * Elderly (60+ years)
       * Infants and children (0-5 years)
       * Persons with Disabilities (PWDs)
       * Pregnant women
       * Bedridden individuals

  3. Base estimates on:
     - Official census statistics (PSA data)
     - Active flood contour mapping
     - Historical displacement records

  4. Handle edge cases:
     - Empty or missing barangay list: return jurisdiction-wide totals
     - Unknown barangay name: flag and provide nearest known estimate

  Output format:
  - Affected Barangays: [list]
  - Total Residents at Risk: [number]
  - Total Households: [number]
  - Vulnerable Sectors:
    * Elderly: [estimated count]
    * Infants/Children: [estimated count]
    * PWDs: [estimated count]
    * Other vulnerable: [estimated count]
  - Data Source: [census year / estimation method]
'
)
FILE_FORMAT = (TYPE = CSV FIELD_OPTIONALLY_ENCLOSED_BY = NONE COMPRESSION = NONE)
SINGLE = TRUE
OVERWRITE = TRUE;

-- resource_recommendation
COPY INTO @AGENT_SKILLS_STAGE/skills/resource_recommendation/SKILL.md
FROM (
  SELECT 'name: resource_recommendation
description: Recommends tactical resource allocation (watercraft, rescue teams, medical units, evacuation shelters) based on alert level severity and impacted population size.
instructions: |
  When recommending resources:

  1. Collect inputs:
     - Current operational alert level (Red Alert, Orange Alert, Yellow Alert, Normal)
     - Estimated affected population count

  2. Apply resource allocation rules:

     RED ALERT (affected_population > 10,000):
     - Rescue teams: minimum 8 swift-water rescue teams
     - Boats: minimum 12 inflatable rescue boats
     - Medical teams: minimum 4 emergency medical teams with ambulances
     - Evacuation centers: minimum 4 primary shelters activated

     RED ALERT (affected_population <= 10,000):
     - Rescue teams: minimum 4
     - Boats: minimum 6
     - Medical teams: minimum 2
     - Evacuation centers: minimum 2

     ORANGE ALERT:
     - Rescue teams: minimum 3
     - Boats: minimum 4
     - Medical teams: minimum 2
     - Evacuation centers: minimum 2

     YELLOW ALERT:
     - Rescue teams: minimum 1 on standby
     - Boats: minimum 2 on standby
     - Medical teams: minimum 1 on standby
     - Evacuation centers: minimum 1 identified (not yet activated)

     NORMAL:
     - No deployment required
     - Routine readiness checks only

  3. Scale recommendations proportionally:
     - For every additional 5,000 people above thresholds, add +2 rescue teams, +3 boats, +1 medical team

  Output format:
  - Alert Level: [level]
  - Affected Population: [count]
  - Recommended Resources:
    * Rescue Teams: [count] ([swift-water / general])
    * Boats: [count] (inflatable rescue craft)
    * Medical Teams: [count] (with [ambulance count] ambulances)
    * Evacuation Centers: [count] ([status: activated / standby / identified])
  - Deployment Priority: [Immediate / Within 2hrs / Standby]
'
)
FILE_FORMAT = (TYPE = CSV FIELD_OPTIONALLY_ENCLOSED_BY = NONE COMPRESSION = NONE)
SINGLE = TRUE
OVERWRITE = TRUE;

-- alert_generator
COPY INTO @AGENT_SKILLS_STAGE/skills/alert_generator/SKILL.md
FROM (
  SELECT 'name: alert_generator
description: Generates localized, multi-channel emergency advisory copy (SMS broadcast, email alert, public bulletin) tailored for targeted communities in English, Tagalog, and local dialects.
instructions: |
  When generating emergency alerts:

  1. Collect inputs:
     - Alert level (e.g., "RED ALERT - EVACUATE IMMEDIATELY")
     - List of recommended protective actions for residents
     - List of affected barangays or river basin sectors

  2. Generate three message formats:

     SMS (CRITICAL CONSTRAINT: must be under 160 characters):
     - Include alert level, affected area, action directive, and emergency hotline
     - Format: "[ALERT LEVEL] [Area]: [Action]. Call [number]. -CDRRMO"
     - Example: "RED ALERT Tumaga: EVACUATE NOW to nearest center. Call 911. -CDRRMO"
     - VERIFY character count before finalizing

     EMAIL:
     - Formal HTML-structured advisory
     - Recipients: Barangay captains, emergency responders, LGU officials
     - Include: situation summary, affected areas, recommended actions, resource status, contact numbers
     - Tone: professional, authoritative, urgent

     PUBLIC ADVISORY:
     - Official press statement for social media and broadcast
     - Include: timestamp, situation overview, affected communities, protective actions, next update schedule
     - Suitable for: Facebook, radio broadcast, local TV

  3. Language requirements:
     - Primary: English
     - Include Tagalog translation for SMS and public advisory
     - Include local Chavacano/Bisaya translation when applicable

  4. Always include:
     - CDRRMO emergency hotline numbers
     - Nearest evacuation center information
     - Next advisory update schedule

  Output format:
  - SMS Alert (English): [message] ([character count]/160)
  - SMS Alert (Tagalog): [message] ([character count]/160)
  - Email Advisory: [full HTML email body]
  - Public Advisory: [broadcast-ready statement]
'
)
FILE_FORMAT = (TYPE = CSV FIELD_OPTIONALLY_ENCLOSED_BY = NONE COMPRESSION = NONE)
SINGLE = TRUE
OVERWRITE = TRUE;

-- notification_dispatcher
COPY INTO @AGENT_SKILLS_STAGE/skills/notification_dispatcher/SKILL.md
FROM (
  SELECT 'name: notification_dispatcher
description: Executes and dispatches emergency alert campaigns through the Job Execution Engine, broadcasting SMS and Email messages to registered emergency contacts and high-risk mobile subscribers.
instructions: |
  When dispatching notifications:

  1. Collect inputs:
     - Array of validated message texts to dispatch
     - Target delivery channels: "sms", "email", or both ["sms", "email"]
     - Recipient filter (e.g., "high_risk_subscribers_tumaga", "all_barangay_captains")

  2. Validation rules (MANDATORY):
     - At least 1 valid delivery channel must be specified
     - Message array must not be empty
     - Recipient filter must be a recognized group or query

  3. For each dispatch job:
     - Generate a unique tracking UUID (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
     - Record initial status as "queued"
     - Log entry in execution audit trail with:
       * Job ID (UUID)
       * Timestamp (ISO 8601)
       * Channel(s)
       * Recipient filter applied
       * Message count
       * Initiating officer/role

  4. Status progression:
     - queued -> processing -> completed
     - If delivery fails: queued -> processing -> failed (with error details)

  5. Report back:
     - Job ID for tracking
     - Initial delivery status
     - Estimated delivery time based on recipient count
     - Execution history log entry

  Output format:
  - Job ID: [UUID]
  - Channels: [sms / email / sms+email]
  - Recipients: [filter description] ([estimated count] contacts)
  - Status: [queued]
  - Messages Queued: [count]
  - Estimated Delivery: [timeframe]
  - Audit Log Entry: [timestamp] | [job_id] | [channel] | [status]
'
)
FILE_FORMAT = (TYPE = CSV FIELD_OPTIONALLY_ENCLOSED_BY = NONE COMPRESSION = NONE)
SINGLE = TRUE
OVERWRITE = TRUE;

-- Step 3: Create Cortex Agent with skills from stage
CREATE OR REPLACE AGENT SentinelAI
  FROM SPECIFICATION $$
models:
  orchestration: "auto"

orchestration:
  budget:
    seconds: 300
    tokens: 4096

instructions:
  system: |
    You are SentinelAI, an AI-powered Emergency Operations Copilot designed for disaster response officers
    in Zamboanga City and the Zamboanga Peninsula, Philippines.

    Your primary role is to assist emergency officers in:
    1. Assessing disaster risks and evaluating river sensor telemetry
    2. Determining impact on barangays
    3. Recommending tactical resources
    4. Dispatching multi-channel emergency alerts

    Always provide evidence-based recommendations grounded in current telemetry and official SOPs.
    Never invent sensor readings or bypass safety thresholds.

  orchestration: |
    Follow a strict 5-step operational reasoning sequence when responding to disaster queries:
    1. Telemetry & Hazard Evaluation: First, invoke 'weather_intelligence' and 'flood_risk_assessment' skills to evaluate active rainfall (mm) and river sensor water levels. If river_level >= 8.0m OR rainfall >= 150.0mm, automatically classify hazard as Red Alert or Orange Alert.
    2. Population Impact Analysis: Next, invoke the 'population_impact' skill to calculate affected residents, households, and priority vulnerable sectors (elderly, infants, PWDs) for targeted barangays (Tumaga, Sta. Maria, Tetuan).
    3. Tactical Resource Allocation: Invoke 'resource_recommendation' to determine required swift-water rescue teams, inflatable boats, medical units, and open evacuation shelters. (For Red Alert with >10,000 residents, prescribe min 8 rescue teams and 12 boats).
    4. Protocol Grounding: Search official guidelines using sop_search to ensure all steps adhere to official emergency SOPs.
    5. Advisory Draft & Campaign Execution: Invoke 'alert_generator' to draft localized SMS copy (<160 characters) and formal email advisories, then trigger delivery jobs via 'notification_dispatcher'.

  response: |
    Provide structured, actionable emergency response guidance. Use bullet points for resource lists and clear alert level headers. Always state confidence levels for risk assessments.
    - Format alert status codes clearly using bold uppercase headers (e.g., [RED ALERT - EVACUATE IMMEDIATELY]).
    - Ground all rationales strictly in live river sensor telemetry and official SOP search results. Never invent sensor readings or bypass safety thresholds.
    - Ensure SMS draft messages remain strictly under 160 characters for single-SMS gateway transmission.

  sample_questions:
    - question: "Evaluate flood risk for Tumaga river level 8.8m and rainfall 175mm in Zamboanga City"
    - question: "What emergency resources should we deploy for a Red Alert affecting 15,000 residents?"
    - question: "Generate an evacuation SMS alert for barangays Tumaga, Sta. Maria, and Tetuan"

tools:
  - tool_spec:
      type: "cortex_search"
      name: "sop_search"
      description: "Search official emergency Standard Operating Procedures and guidelines"

tool_resources:
  sop_search:
    search_service: "SENTINEL_AI_DB.PUBLIC.SENTINEL_SOP_SEARCH_SERVICE"

skills:
  - name: "weather_intelligence"
    source:
      type: "STAGE"
      path: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/weather_intelligence"
  - name: "flood_risk_assessment"
    source:
      type: "STAGE"
      path: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/flood_risk_assessment"
  - name: "population_impact"
    source:
      type: "STAGE"
      path: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/population_impact"
  - name: "resource_recommendation"
    source:
      type: "STAGE"
      path: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/resource_recommendation"
  - name: "alert_generator"
    source:
      type: "STAGE"
      path: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/alert_generator"
  - name: "notification_dispatcher"
    source:
      type: "STAGE"
      path: "@SENTINEL_AI_DB.PUBLIC.AGENT_SKILLS_STAGE/skills/notification_dispatcher"
$$;

-- Step 4: Verify created Agent
DESCRIBE AGENT SENTINEL_AI_DB.PUBLIC.SentinelAI;