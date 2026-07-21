-- Sentinel AI - Zamboanga City Seed Data

-- Create database and schema if they don't exist
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

-- Insert Weather Data
INSERT INTO weather_data (timestamp, location, rainfall, wind_speed, storm_name, forecast) VALUES
(CURRENT_TIMESTAMP, 'Zamboanga Peninsula', 175.0, 85.0, 'Typhoon Approaching', 'Heavy rainfall continuing for next 12 hours, high risk of severe flooding.');

-- Insert Barangays (Ensure exact name matching with river_sensors for SQL JOIN)
INSERT INTO barangays (barangay, city, population, latitude, longitude) VALUES
('Tumaga', 'Zamboanga City', 31000, 6.9450, 122.0650),
('Sta. Maria', 'Zamboanga City', 25000, 6.9350, 122.0750),
('Tetuan', 'Zamboanga City', 29000, 6.9250, 122.0850),
('Manicahan', 'Zamboanga City', 18000, 7.0200, 122.2000),
('Pasonanca', 'Zamboanga City', 21000, 6.9550, 122.0700),
('Vitali', 'Zamboanga City', 14000, 7.3600, 122.2800);

-- Insert River Sensors
INSERT INTO river_sensors (sensor_id, barangay, water_level, timestamp) VALUES
('ZAM-TUMAGA-01', 'Tumaga', 8.8, CURRENT_TIMESTAMP),
('ZAM-STAMARIA-01', 'Sta. Maria', 7.4, CURRENT_TIMESTAMP),
('ZAM-TETUAN-01', 'Tetuan', 6.9, CURRENT_TIMESTAMP),
('ZAM-MANICAHAN-01', 'Manicahan', 6.2, CURRENT_TIMESTAMP),
('ZAM-PASONANCA-01', 'Pasonanca', 4.5, CURRENT_TIMESTAMP),
('ZAM-VITALI-01', 'Vitali', 3.1, CURRENT_TIMESTAMP);

-- Insert Evacuation Centers
INSERT INTO evacuation_centers (name, capacity, current_occupancy, barangay) VALUES
('Tumaga Gymnasium', 800, 450, 'Tumaga'),
('City Coliseum Tetuan', 2500, 1200, 'Tetuan'),
('Don Pablo Lorenzo Memorial High School', 1500, 680, 'Sta. Maria'),
('Manicahan Elementary School', 600, 180, 'Manicahan');

-- Insert Hospitals
INSERT INTO hospitals (hospital, beds_available, barangay) VALUES
('Zamboanga City Medical Center - ZCMC', 65, 'Sta. Maria'),
('Brent Hospital', 30, 'Pasonanca'),
('Ciudad Medical Zamboanga', 40, 'Camino Nuevo');

-- Insert Citizen Contacts (Mock)
INSERT INTO citizen_contacts (phone, email, barangay) VALUES
('+639170000001', 'resident1@zamboanga.demo.ph', 'Tumaga'),
('+639170000002', 'resident2@zamboanga.demo.ph', 'Sta. Maria'),
('+639170000003', 'resident3@zamboanga.demo.ph', 'Tetuan'),
('+639170000004', 'resident4@zamboanga.demo.ph', 'Tumaga'),
('+639170000005', 'resident5@zamboanga.demo.ph', 'Sta. Maria');
