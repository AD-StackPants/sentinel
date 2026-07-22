-- Sentinel AI - Snowflake Cortex Search Service DDL Setup Script

USE ROLE ACCOUNTADMIN;
USE WAREHOUSE COMPUTE_WH;
CREATE DATABASE IF NOT EXISTS SENTINEL_AI_DB;
USE DATABASE SENTINEL_AI_DB;

CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- 1. Create Standard Operating Procedures (SOP) Reference Table
CREATE OR REPLACE TABLE SENTINEL_SOPS (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    category VARCHAR(100),
    content TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 2. Seed Official Emergency Response SOP Data
TRUNCATE TABLE SENTINEL_SOPS;

INSERT INTO SENTINEL_SOPS (id, title, category, content) VALUES
(
    'SOP-EVAC-01',
    'Flood Evacuation Trigger Protocol',
    'Evacuation',
    'Mandatory Evacuation Directive: When river sensor readings exceed 8.0 meters (Critical Threshold) or rainfall exceeds 150mm within a 12-hour window, upgrade operational status to RED ALERT. Order immediate mandatory evacuation for low-lying barangays including Tumaga, Sta. Maria, and Tetuan. Direct residents to primary evacuation centers (Tumaga Gymnasium, City Coliseum).'
),
(
    'SOP-RES-02',
    'Resource Allocation & Deployment Guidelines',
    'Resources',
    'Tactical Resource Deployment Standard: For RED ALERT level with an estimated impacted population exceeding 10,000 residents, dispatch a minimum of 8 swift-water rescue teams, 12 inflatable rescue boats, 4 emergency medical units, and open 4 primary evacuation shelters equipped with clean water, food packs, and medical kits.'
),
(
    'SOP-ALERT-03',
    'Multi-Channel Alert Dispatch Protocol',
    'Notifications',
    'Emergency Alert Broadcast Protocol: Localized SMS advisory broadcasts MUST be concise and strictly stay under 160 characters for single-SMS gateway transmission reliability. Include emergency hotline numbers and immediate action steps. Broadcast formal email advisories concurrently to barangay captains and disaster monitoring units.'
),
(
    'SOP-MED-04',
    'Emergency Medical & Casualty Handling Protocol',
    'Medical',
    'Healthcare Facility Mobilization: Coordinate immediate surge capacity with Zamboanga City Medical Center (ZCMC), West Metro Medical Center, and Zamboanga Doctors Hospital. Prioritize triage and evacuation for vulnerable sectors including elderly, infants, pregnant mothers, and persons with disabilities (PWDs).'
);

-- 3. Create Snowflake Cortex Search Service
CREATE OR REPLACE CORTEX SEARCH SERVICE SENTINEL_SOP_SEARCH_SERVICE
  ON content
  ATTRIBUTES title, category
  WAREHOUSE = COMPUTE_WH
  TARGET_LAG = '1 hour'
  AS (
    SELECT id, title, category, content
    FROM SENTINEL_SOPS
  );
