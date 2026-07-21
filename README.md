# Sentinel AI — Emergency Operations Copilot

**An AI-powered Emergency Operations Copilot that helps disaster response agencies assess risks, recommend actions, and reliably notify affected communities.**

## 📖 Overview

Sentinel AI is an AI copilot built with Snowflake CoCo CLI that assists emergency operations centers in making faster and better disaster response decisions.

Instead of acting as a simple alerting platform, Sentinel AI gathers operational context from multiple data sources, analyzes disaster risks, explains its reasoning, recommends appropriate response actions, and executes reliable public notifications through a Job Execution Engine.

The project demonstrates a complete decision-support workflow—from data collection to actionable recommendations and operational execution.

## 🏗 System Architecture

```text
Weather APIs
River Sensors
Flood Sensors
Earthquake Feeds
Population Database
Evacuation Centers
      │
      ▼
   Snowflake
      │
      ▼
 CoCo CLI Copilot
      │
      ▼
Decision Support Engine
      │
      ▼
Human Approval
      │
      ▼
Job Execution Engine
      │
      ▼
 Citizens & Responders
```

## ⚙ Core Features

- **🤖 AI Copilot**: Conversational assistant for operational questions, context gathering, and workflow guidance.
- **🌧 Risk Assessment**: Analyzes rainfall, flood history, river levels, and weather forecasts.
- **📍 Impact Assessment**: Estimates affected population and critical infrastructure.
- **🚑 Resource Recommendation**: Suggests rescue teams, medical teams, food packs, and evacuation sites.
- **📢 Alert Generation**: Automatically generates multi-lingual emergency advisories (English, Filipino, Cebuano).
- **🚀 Reliable Notification Delivery**: Uses a robust Job Execution Engine for SMS, Email, and Push notifications.
- **📊 Operational Dashboard**: Real-time map-based view of disaster operations.

## 🛠 Technology Stack

- **AI Copilot**: Snowflake CoCo CLI
- **Data Platform**: Snowflake
- **Backend**: FastAPI (Python)
- **Frontend**: React.js, MapLibre
- **Notifications**: Custom Job Execution Engine (Twilio/SMTP)

## Project Structure

- `backend/`: FastAPI application containing the Decision Support Engine and Job Execution Engine.
- `frontend/`: React application providing the Operational Dashboard.
- `snowflake/`: SQL scripts for setting up the data platform.
- `coco/`: CoCo CLI configuration and agent skills setup.
