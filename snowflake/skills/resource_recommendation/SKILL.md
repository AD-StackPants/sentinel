name: resource_recommendation
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
