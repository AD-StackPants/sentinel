name: flood_risk_assessment
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
