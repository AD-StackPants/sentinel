---
name: weather-intelligence
description: 'Retrieves current weather conditions, active precipitation, wind speed, and meteorological forecasts for specified Philippine cities or regions. Use for weather forecasts, rainfall totals, approaching typhoons, or PAGASA/Open-Meteo telemetry status.'
---

# Weather Intelligence

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

## Data Sources

Query from SENTINEL_AI_DB.PUBLIC:
- WEATHER_DATA — current conditions, rainfall, wind speed, storm name, forecast

## Output Format

- Location: [target location]
- Rainfall (12hr): [value] mm
- Storm Category: [PAGASA classification]
- Forecast: [narrative forecast with runoff warnings]
- Hazard Status: [Normal / Critical Hazard]
