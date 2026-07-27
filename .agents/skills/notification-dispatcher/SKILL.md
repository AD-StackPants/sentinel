---
name: notification-dispatcher
description: 'Executes and dispatches emergency alert campaigns through the Job Execution Engine, broadcasting SMS and Email messages to registered emergency contacts and high-risk mobile subscribers.'
---

# Notification Dispatcher

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
   - queued → processing → completed
   - If delivery fails: queued → processing → failed (with error details)

5. Report back:
   - Job ID for tracking
   - Initial delivery status
   - Estimated delivery time based on recipient count
   - Execution history log entry

## Data Sources

Query from SENTINEL_AI_DB.PUBLIC:
- CITIZEN_CONTACTS — registered emergency contacts
- EXECUTION_JOBS — job tracking
- EXECUTION_TASKS — task execution records
- AUDIT_LOGS — dispatch audit trail

## Output Format

- Job ID: [UUID]
- Channels: [sms / email / sms+email]
- Recipients: [filter description] ([estimated count] contacts)
- Status: [queued]
- Messages Queued: [count]
- Estimated Delivery: [timeframe]
- Audit Log Entry: [timestamp] | [job_id] | [channel] | [status]
