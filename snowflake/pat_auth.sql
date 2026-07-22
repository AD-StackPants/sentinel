-- Sentinel AI - Snowflake Authentication & PAT Setup

USE ROLE ACCOUNTADMIN;
CREATE DATABASE IF NOT EXISTS SENTINEL_AI_DB;
USE DATABASE SENTINEL_AI_DB;

CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- Create an auth policy that allows PAT for programmatic clients
CREATE OR REPLACE AUTHENTICATION POLICY pat_auth_policy
  AUTHENTICATION_METHODS = ('ALL')
  CLIENT_TYPES = ('SNOWFLAKE_UI', 'DRIVERS')
  SECURITY_INTEGRATIONS = ('ALL');

-- Assign authentication policy to user (replace ZEREXEI with your Snowflake username if different)
ALTER USER ZEREXEI SET AUTHENTICATION POLICY = pat_auth_policy;

-- Generate Programmatic Access Token for Cortex CLI
ALTER USER IF EXISTS ZEREXEI ADD PROGRAMMATIC ACCESS TOKEN cortex_cli_pat DAYS_TO_EXPIRY = 30;

DESCRIBE USER ZEREXEI;