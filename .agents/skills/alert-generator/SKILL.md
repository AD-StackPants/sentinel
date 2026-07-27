---
name: alert-generator
description: 'Generates localized, multi-channel emergency advisory copy (SMS broadcast, email alert, public bulletin) tailored for targeted communities in English, Tagalog, and local dialects.'
---

# Alert Generator

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

## Output Format

- SMS Alert (English): [message] ([character count]/160)
- SMS Alert (Tagalog): [message] ([character count]/160)
- Email Advisory: [full HTML email body]
- Public Advisory: [broadcast-ready statement]
