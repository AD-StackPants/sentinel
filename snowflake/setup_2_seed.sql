-- Sentinel AI - Comprehensive Zamboanga City Disaster Risk Seed Data

USE ROLE ACCOUNTADMIN;
USE WAREHOUSE COMPUTE_WH;
CREATE DATABASE IF NOT EXISTS SENTINEL_AI_DB;
USE DATABASE SENTINEL_AI_DB;

CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- Clear existing data
TRUNCATE TABLE weather_data;
TRUNCATE TABLE flood_history;
TRUNCATE TABLE river_sensors;
TRUNCATE TABLE barangays;
TRUNCATE TABLE evacuation_centers;
TRUNCATE TABLE hospitals;
TRUNCATE TABLE citizen_contacts;

-- 1. Weather Data (Real-time Meteorological Feed Simulation)
INSERT INTO weather_data (timestamp, location, rainfall, wind_speed, storm_name, forecast) VALUES
(CURRENT_TIMESTAMP, 'Zamboanga Peninsula', 175.0, 85.0, 'Typhoon Approaching', 'Heavy to intense rainfall continuing over next 12-18 hours. Torrential river runoff along Tumaga, Sta. Maria, and Manicahan basins.');

-- 2. Barangays (Accurate Coordinates & Census Population for Zamboanga City)
INSERT INTO barangays (barangay, city, population, latitude, longitude) VALUES
('Tumaga', 'Zamboanga City', 31200, 6.9450, 122.0650),
('Sta. Maria', 'Zamboanga City', 25400, 6.9350, 122.0750),
('Tetuan', 'Zamboanga City', 29800, 6.9250, 122.0850),
('Tugbungan', 'Zamboanga City', 23100, 6.9180, 122.0950),
('Talon-Talon', 'Zamboanga City', 34700, 6.9050, 122.1050),
('Guiwan', 'Zamboanga City', 16500, 6.9310, 122.0920),
('Manicahan', 'Zamboanga City', 18100, 7.0200, 122.2000),
('Pasonanca', 'Zamboanga City', 21300, 6.9550, 122.0700),
('San Jose Gusu', 'Zamboanga City', 27900, 6.9210, 122.0530),
('Baliwasan', 'Zamboanga City', 26400, 6.9130, 122.0610),
('Calarian', 'Zamboanga City', 31000, 6.9280, 122.0150),
('Ayala', 'Zamboanga City', 22800, 6.9620, 121.9540),
('Mercedes', 'Zamboanga City', 15600, 6.9480, 122.1350),
('Curuan', 'Zamboanga City', 11800, 7.2150, 122.2420),
('Vitali', 'Zamboanga City', 14200, 7.3600, 122.2800);

-- 3. River Sensors (Real Telemetry Station Network across River Basins with distinct coordinates)
INSERT INTO river_sensors (sensor_id, barangay, water_level, timestamp, latitude, longitude) VALUES
('ZAM-TUMAGA-01', 'Tumaga', 8.8, CURRENT_TIMESTAMP, 6.9440, 122.0630),
('ZAM-STAMARIA-01', 'Sta. Maria', 7.4, CURRENT_TIMESTAMP, 6.9355, 122.0740),
('ZAM-TETUAN-01', 'Tetuan', 6.9, CURRENT_TIMESTAMP, 6.9230, 122.0840),
('ZAM-TUGBUNGAN-01', 'Tugbungan', 7.1, CURRENT_TIMESTAMP, 6.9185, 122.0940),
('ZAM-TALONTALON-01', 'Talon-Talon', 6.8, CURRENT_TIMESTAMP, 6.9060, 122.1040),
('ZAM-MANICAHAN-01', 'Manicahan', 6.2, CURRENT_TIMESTAMP, 7.0185, 122.1980),
('ZAM-PASONANCA-01', 'Pasonanca', 4.5, CURRENT_TIMESTAMP, 6.9580, 122.0690),
('ZAM-SANJOSE-01', 'San Jose Gusu', 5.2, CURRENT_TIMESTAMP, 6.9200, 122.0510),
('ZAM-BALIWASAN-01', 'Baliwasan', 4.8, CURRENT_TIMESTAMP, 6.9140, 122.0590),
('ZAM-MERCEDES-01', 'Mercedes', 5.5, CURRENT_TIMESTAMP, 6.9470, 122.1330),
('ZAM-AYALA-01', 'Ayala', 3.9, CURRENT_TIMESTAMP, 6.9600, 121.9520),
('ZAM-VITALI-01', 'Vitali', 3.1, CURRENT_TIMESTAMP, 7.3580, 122.2780);

-- 4. Evacuation Centers (Real Infrastructure Landmarks with distinct coordinates)
INSERT INTO evacuation_centers (name, capacity, current_occupancy, barangay, latitude, longitude) VALUES
('Tumaga Gymnasium', 800, 450, 'Tumaga', 6.9465, 122.0640),
('City Coliseum Tetuan', 2500, 1200, 'Tetuan', 6.9240, 122.0860),
('Don Pablo Lorenzo Memorial High School', 1500, 680, 'Sta. Maria', 6.9370, 122.0760),
('Tugbungan Elementary School', 900, 320, 'Tugbungan', 6.9175, 122.0960),
('Talon-Talon National High School', 1200, 510, 'Talon-Talon', 6.9040, 122.1060),
('Manicahan Elementary School', 600, 180, 'Manicahan', 7.0215, 122.2010),
('Pasonanca Elementary School', 750, 120, 'Pasonanca', 6.9560, 122.0710),
('WMSU Gymnasium (Western Mindanao State Univ)', 3000, 850, 'Baliwasan', 6.9120, 122.0620),
('Southcom Elementary School', 1000, 250, 'Calarian', 6.9290, 122.0160),
('Ayala National High School', 1100, 190, 'Ayala', 6.9630, 121.9550);

-- 5. Hospitals (Active Zamboanga City Healthcare Facilities with distinct coordinates)
INSERT INTO hospitals (hospital, beds_available, barangay, latitude, longitude) VALUES
('Zamboanga City Medical Center (ZCMC)', 65, 'Sta. Maria', 6.9335, 122.0735),
('West Metro Medical Center', 50, 'Sta. Maria', 6.9385, 122.0775),
('Zamboanga Doctors Hospital', 45, 'Tumaga', 6.9430, 122.0670),
('Brent Hospital and Colleges', 30, 'Pasonanca', 6.9520, 122.0680),
('Ciudad Medical Zamboanga', 40, 'Guiwan', 6.9300, 122.0900),
('Universidad de Zamboanga Medical Center', 35, 'Tetuan', 6.9260, 122.0830),
('Labuan General Hospital', 20, 'Calarian', 6.9265, 122.0130);

-- 6. Historical Flood Log (Past Major Flooding Events)
INSERT INTO flood_history (barangay, date, severity, water_level) VALUES
('Tumaga', '2024-07-12', 'Severe', 9.1),
('Sta. Maria', '2024-07-12', 'High', 8.2),
('Tetuan', '2024-07-12', 'High', 7.8),
('Tumaga', '2023-01-11', 'Critical', 9.4),
('Manicahan', '2023-01-11', 'Moderate', 6.8),
('Talon-Talon', '2022-10-29', 'High', 7.9),
('Tugbungan', '2022-10-29', 'High', 7.5);

-- 7. Citizen Emergency Notification Contacts (Mock Registered Contacts)
INSERT INTO citizen_contacts (phone, email, barangay) VALUES
('+639170000001', 'resident.tumaga1@zamboanga.gov.ph', 'Tumaga'),
('+639170000002', 'resident.stamaria1@zamboanga.gov.ph', 'Sta. Maria'),
('+639170000003', 'resident.tetuan1@zamboanga.gov.ph', 'Tetuan'),
('+639170000004', 'resident.tugbungan1@zamboanga.gov.ph', 'Tugbungan'),
('+639170000005', 'resident.talontalon1@zamboanga.gov.ph', 'Talon-Talon'),
('+639170000006', 'resident.manicahan1@zamboanga.gov.ph', 'Manicahan'),
('+639170000007', 'resident.pasonanca1@zamboanga.gov.ph', 'Pasonanca'),
('+639170000008', 'resident.baliwasan1@zamboanga.gov.ph', 'Baliwasan');

-- 8. Standard Operating Procedures (SOP) Reference Data
TRUNCATE TABLE SENTINEL_SOPS;
INSERT INTO SENTINEL_SOPS (id, title, category, content) VALUES
('SOP-EVAC-01', 'Flood Evacuation Trigger Protocol', 'Evacuation', 'Mandatory Evacuation Directive: When river sensor readings exceed 8.0 meters (Critical Threshold) or rainfall exceeds 150mm within a 12-hour window, upgrade operational status to RED ALERT. Order immediate mandatory evacuation for low-lying barangays including Tumaga, Sta. Maria, and Tetuan. Direct residents to primary evacuation centers (Tumaga Gymnasium, City Coliseum).'),
('SOP-RES-02', 'Resource Allocation & Deployment Guidelines', 'Resources', 'Tactical Resource Deployment Standard: For RED ALERT level with an estimated impacted population exceeding 10,000 residents, dispatch a minimum of 8 swift-water rescue teams, 12 inflatable rescue boats, 4 emergency medical units, and open 4 primary evacuation shelters equipped with clean water, food packs, and medical kits.'),
('SOP-ALERT-03', 'Multi-Channel Alert Dispatch Protocol', 'Notifications', 'Emergency Alert Broadcast Protocol: Localized SMS advisory broadcasts MUST be concise and strictly stay under 160 characters for single-SMS gateway transmission reliability. Include emergency hotline numbers and immediate action steps. Broadcast formal email advisories concurrently to barangay captains and disaster monitoring units.'),
('SOP-MED-04', 'Emergency Medical & Casualty Handling Protocol', 'Medical', 'Healthcare Facility Mobilization: Coordinate immediate surge capacity with Zamboanga City Medical Center (ZCMC), West Metro Medical Center, and Zamboanga Doctors Hospital. Prioritize triage and evacuation for vulnerable sectors including elderly, infants, pregnant mothers, and persons with disabilities (PWDs).');

-- 9. Create Snowflake Cortex Search Service
CREATE OR REPLACE CORTEX SEARCH SERVICE SENTINEL_SOP_SEARCH_SERVICE
  ON content
  ATTRIBUTES title, category
  WAREHOUSE = COMPUTE_WH
  TARGET_LAG = '1 hour'
  AS (
    SELECT id, title, category, content
    FROM SENTINEL_SOPS
  );
