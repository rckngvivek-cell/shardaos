# SMS Template System Operations Guide

**Status:** ACTIVE  
**Last Updated:** April 10, 2026  
**Maintained By:** Backend Agent  
**Audience:** School admins, SMS coordinators, DevOps team

---

## Quick Diagnosis

**"SMS not sending"**
→ Check: Template exists (Section 1.1), Rate limit (Section 2.1)

**"Message text is garbled"**
→ Check: Character encoding (Section 3.2), Unicode splitting (Section 4.1)

**"Cost higher than expected"**
→ Check: SMS count calculation (Section 4.2), Multi-part messages

**"Parent got wrong message"**
→ Check: Template variables (Section 1.3), Variable mapping (Section 2.3)

**"Can't create custom template"**
→ Check: Template validation (Section 1.2), Character limits (Section 3.1)

---

## Section 1: Template Management

### 1.1 View All Templates

**List all active templates for school:**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms-templates" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "templates": [
    {
      "id": "attendance",
      "name": "Attendance Notification",
      "content": "Hi {{parentName}}, {{studentName}} was present today",
      "variables": ["parentName", "studentName", "subjects"],
      "versions": 2,
      "activeVersion": 1,
      "language": "en",
      "status": "active",
      "smsCount": 1,
      "cost": 0.50
    },
    {
      "id": "grades",
      "name": "Grades Notification",
      "content": "Grades: {{studentName}} scored {{marks}}/100",
      "variables": ["studentName", "marks", "subject"],
      "versions": 1,
      "activeVersion": 1,
      "language": "en",
      "status": "active",
      "smsCount": 1,
      "cost": 0.50
    }
  ]
}
```

### 1.2 Create Custom Template

**Before creating, validate template:**

```bash
# POST endpoint: Create new template
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms-templates" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "id": "custom-fee-reminder",
    "name": "Custom Fee Reminder",
    "content": "Hi {{parentName}}, Fee ₹{{amount}} for {{studentName}} due by {{dueDate}}",
    "language": "en"
  }

# Response:
{
  "id": "custom-fee-reminder",
  "version": 1,
  "status": "active",
  "smsCount": 1,                    # ← How many SMS this message = 
  "cost": 0.50,
  "validated": true
}

# Or if validation fails:
HTTP 400 Bad Request
{
  "error": "TEMPLATE_VALIDATION_FAILED",
  "issues": [
    { "field": "content", "issue": "Character count 165 exceeds GSM-7 limit (160)" }
  ]
}
```

### 1.3 Template Variables

**Allowed variables that system will substitute:**

| Variable | Description | Example | Type |
|----------|-------------|---------|------|
| `{{schoolName}}` | Your school name | "St. Mary's School" | System |
| `{{parentName}}` | Parent's name | "Mr. Sharma" | Parent |
| `{{studentName}}` | Student's name | "Rohan Sharma" | Student |
| `{{class}}` | Student's class | "10A" | Student |
| `{{subjects}}` | Subjects (comma-separated) | "Math, English, Science" | Student |
| `{{marks}}` | Numeric score | "85" | Dynamic |
| `{{grade}}` | Letter grade | "A" | Dynamic |
| `{{date}}` | Today's date | "10-Apr-2026" | System |
| `{{dueDate}}` | Payment due date | "15-Apr-2026" | Dynamic |
| `{{amount}}` | Fee amount in rupees | "5000" | Dynamic |

**To use variable, wrap in double braces: `{{variableName}}`**

Example:
```
Template: "Hi {{parentName}}, {{studentName}} in {{class}} marked absent today"
When sending to: parent "Mr. Sharma", student "Rohan", class "10A"
Result: "Hi Mr. Sharma, Rohan in 10A marked absent today"
```

### 1.4 Template Versioning

**Update existing template (creates new version):**

```bash
curl -X PUT "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms-templates/attendance" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "content": "Attendance Update: {{studentName}} ({{class}}) present {{date}}"
  }

# Response:
{
  "id": "attendance",
  "version": 2,
  "status": "pending-review",    # ← New versions reviewed before release
  "previousVersion": 1,
  "changes": {
    "from": "Hi {{parentName}}, {{studentName}} was present today",
    "to": "Attendance Update: {{studentName}} ({{class}}) present {{date}}"
  }
}

# After review (by admin/lead):
# Template version 2 becomes active
# Version 1 archived (can revert if needed)
```

**Revert to previous version:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms-templates/attendance/revert" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d { "targetVersion": 1 }

# Reverts to version 1 immediately
```

---

## Section 2: Sending SMS

### 2.1 Rate Limiting

**SMS sent too fast? Rate limit enforced.**

```
Limit: 5 SMS per hour per phone number
Example:
├─ 09:00 → Send SMS #1 to 9876543210 ✓
├─ 09:15 → Send SMS #2 to 9876543210 ✓
├─ 09:30 → Send SMS #3 to 9876543210 ✓
├─ 09:45 → Send SMS #4 to 9876543210 ✓
├─ 10:00 → Send SMS #5 to 9876543210 ✓
├─ 10:05 → Send SMS #6 to 9876543210 ✗ REJECTED (rate limit)
└─ After 11:00 → Can send again (oldest expired)
```

**Check rate limit status:**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/rate-limit/9876543210" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "phone": "9876543210",
  "sentToday": 5,
  "sentThisHour": 4,
  "canSendNow": true,
  "nextResetTime": "2026-04-10T11:00:00Z"
}
```

### 2.2 Send Single SMS

**Manual SMS sending (admin use):**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/send" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "templateId": "attendance",
    "recipient": {
      "phone": "9876543210",
      "variables": {
        "parentName": "Mr. Sharma",
        "studentName": "Rohan",
        "subjects": "Math, English"
      }
    }
  }

# Response (Immediate):
{
  "requestId": "sms-req-001",
  "status": "queued",         # ← Queued for delivery
  "message": "Hi Mr. Sharma, Rohan was present in Math, English",
  "estimatedDeliveryTime": 5000  # milliseconds
}

# Check delivery status later:
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/status/sms-req-001" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "requestId": "sms-req-001",
  "status": "delivered",      # ← Confirmed by Twilio
  "deliveredAt": "2026-04-10T10:35:42Z",
  "cost": 0.50
}
```

### 2.3 Bulk Send (Many Recipients)

**Send same template to multiple parents:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/bulk-send" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "templateId": "attendance",
    "recipients": [
      {
        "phone": "9876543210",
        "variables": {
          "parentName": "Mr. Sharma",
          "studentName": "Rohan",
          "subjects": "Math, English"
        }
      },
      {
        "phone": "9876543211",
        "variables": {
          "parentName": "Mrs. Patel",
          "studentName": "Priya",
          "subjects": "Math, English, Science"
        }
      }
      # ... more recipients
    ]
  }

# Response (Queued):
{
  "batchId": "sms-batch-001",
  "status": "processing",
  "totalRecipients": 2,
  "estimatedDuration": 30000,  # milliseconds
  "estimatedCost": 1.00       # ₹
}

# Check batch progress:
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/bulk/sms-batch-001" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "batchId": "sms-batch-001",
  "status": "completed",
  "totalRecipients": 2,
  "successful": 2,
  "failed": 0,
  "totalCost": 1.00
}
```

---

## Section 3: Character Counting & Encoding

### 3.1 GSM-7 vs Unicode

**GSM-7 (160-character SMS):**
- Supports: A-Z, a-z, 0-9, space, common punctuation
- Cost: 1 SMS per 160 characters
- Example: `"Hi Mr. Sharma, Rohan present today"` → 1 SMS

**Unicode (70-character SMS):**
- Supports: Hindi (नमस्ते), Gujarati (નમસ્તે), Tamil (வணக்கம்), Chinese, etc.
- Cost: 1 SMS per 70 characters (same cost as GSM but shorter)
- Example: `"नमस्ते श्री शर्मा, रोहन आज उपस्थित था"` → 1 SMS (if <70 chars) or 2 SMS (if >70)

**System automatically detects and splits:**
```
If template content uses Unicode:
├─ Message length 71-140 chars → 2 SMS
└─ Message length 141-210 chars → 3 SMS

Cost calculation:
├─ GSM-7, 160 chars → 1 SMS → ₹0.50
├─ Unicode, 70 chars → 1 SMS → ₹0.50
├─ Unicode, 140 chars → 2 SMS → ₹1.00
└─ Unicode, 210 chars → 3 SMS → ₹1.50
```

### 3.2 Check Character Count

**Before sending, preview message:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms-templates/attendance/preview" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "variables": {
      "parentName": "Mr. Sharma",
      "studentName": "Rohan",
      "subjects": "Math, English, Science, History"
    }
  }

# Response:
{
  "rendered": "Hi Mr. Sharma, Rohan was present in Math, English, Science, History",
  "charCount": 68,
  "encoding": "GSM-7",           # ← Compatible with standard SMS
  "smsCount": 1,
  "cost": 0.50,
  "warnings": []
}

# If encoding was Unicode:
{
  "rendered": "नमस्ते श्री शर्मा, रोहन...",
  "charCount": 85,
  "encoding": "Unicode",
  "smsCount": 2,                 # ← Requires 2 SMS
  "cost": 1.00,
  "warnings": ["Message split into 2 SMS due to Unicode chars"]
}
```

### 3.3 Optimize for SMS Limits

**Reduce character count (GSM-7 has 160 char limit):**

| Strategy | Before | After | Savings |
|----------|--------|-------|---------|
| Abbreviate | "Mr." | "M." | -2 chars |
| Abbreviate | "students" | "stdnts" | -3 chars |
| Remove redundant word | "Hi Mr. Sharma, Your child" | "Hi Mr. Sharma, Your" | -5 chars |
| Use emoji (if Unicode anyway) | "Good job, excellent work" | "Good job👍" | -14 chars |

**Example optimization:**
```
BEFORE: "Hi Mr. Sharma, Your child Rohan was present today in Math, Science"
(Length: 67 chars) → 1 SMS

AFTER: "Hi Mr. Sharma, Rohan present in Math, Science"
(Length: 46 chars) → 1 SMS (but shorter for faster read)

Or if length > 160:
BEFORE: "Hi {{parentName}}, We're delighted to inform you that {{studentName}} scored {{marks}}/100 in {{subject}} on {{date}}. Excellent performance!"
(Length: ~165) → 2 SMS → Cost ₹1.00

AFTER: "{{parentName}}, {{studentName}} scored {{marks}}/100 in {{subject}}!"
(Length: ~70) → 1 SMS → Cost ₹0.50
```

---

## Section 4: Cost Tracking & Budget

### 4.1 View SMS Costs

**Check current month's usage:**

```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/usage" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "periodiType": "monthly",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "smsCount": 2500,
  "cost": {
    "currency": "INR",
    "perSMS": 0.50,
    "totalCost": 1250,
    "budget": 5000,
    "percentageUsed": 25,
    "projected": 3750  # Estimated by end of month
  }
}
```

### 4.2 Set Budget Alerts

**Alert when SMS spending exceeds threshold:**

```bash
curl -X PUT "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/budget" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "monthlyBudget": 5000,        # INR
    "alertThreshold": 80,          # % of budget
    "alertRecipients": [
      "admin@school.com",
      "finance@school.com"
    ]
  }

# Alerts triggered:
# - At 80% (₹4000 spent): Warning email
# - At 90% (₹4500 spent): Critical email + SMS to admins
# - At 100% (₹5000 spent): All SMS blocked until next period
```

### 4.3 Review Detailed Cost Breakdown

**See cost per template:**

```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/cost-by-template" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "breakdown": [
    {
      "templateId": "attendance",
      "templateName": "Attendance Notification",
      "smsCount": 1200,
      "cost": 600,
      "percentage": 48
    },
    {
      "templateId": "grades",
      "templateName": "Grades Notification",
      "smsCount": 800,
      "cost": 400,
      "percentage": 32
    },
    {
      "templateId": "fee-due",
      "templateName": "Fee Due Reminder",
      "smsCount": 500,
      "cost": 250,
      "percentage": 20
    }
  ]
}
```

---

## Section 5: Delivery & Failure Handling

### 5.1 Delivery Status Tracking

**SMS delivery can take 5-30 seconds. Status flow:**

```
┌─────────────┐
│   Queued    │  (just received)
└──────┬──────┘
       │ (sent to Twilio)
       ▼
┌─────────────┐
│   Sending   │  (Twilio processing)
└──────┬──────┘
       │ (delivered to carrier)
       ▼
┌─────────────┐
│ Delivered   │  ✓ SUCCESS - SMS on parent's phone
└─────────────┘

OR failures:

       ▼
┌─────────────┐
│  Bounced    │  ✗ Invalid phone number
└─────────────┘

       ▼
┌─────────────┐
│  Failed     │  ✗ Carrier rejection (spam list, etc)
└─────────────┘

       ▼
┌─────────────┐
│  Expired    │  ✗ No delivery after 24 hours
└─────────────┘
```

### 5.2 Failed SMS Investigation

**If SMS shows "Failed" status:**

```bash
# Get details
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/status/sms-req-001" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "requestId": "sms-req-001",
  "status": "failed",
  "failureReason": "INVALID_PHONE_NUMBER",  # ← Specific reason
  "phone": "9876543210",
  "retryable": false,
  "suggestions": [
    "Verify phone number format (should be 10 digits)",
    "Check if phone number belongs to school's student database"
  ]
}
```

**Common failure reasons:**

| Reason | Cause | Solution |
|--------|-------|----------|
| INVALID_PHONE_NUMBER | Format wrong | Check format (10 digits) |
| RATE_LIMIT_EXCEEDED | Sent too many SMS to this phone | Wait 1 hour, try again |
| CARRIER_REJECTION | Phone on spam list or carrier issue | Contact support |
| DUPLICATE_REQUEST | Same SMS sent twice in 5 seconds | Check app logs, retry |
| INSUFFICIENT_BALANCE | School account balance too low | Contact billing |

### 5.3 Retry Failed SMS

**Manually retry failed SMS:**

```bash
# Retry after fixing issue (e.g., correcting phone number)
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/retry/sms-req-001" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "phone": "9876543210"  # Fixed phone number if needed
  }

# Response:
{
  "requestId": "sms-req-002",  # ← New request ID
  "status": "queued",
  "note": "Retry of original request (sms-req-001)"
}
```

---

## Section 6: Troubleshooting

### 6.1 "SMS not arriving after 5 minutes"

```
Checklist:
1. Check delivery status
   GET /sms/status/{requestId} → "delivered"? OK
   
2. Check recipient phone number
   Is it correct format? (10 digits, no spaces)
   Does parent have SMS enabled on their phone?
   
3. Check spam folder
   Tell parent to check SMS spam/junk folder (carriers filter)
   
4. Check parent's carrier
   Indian carriers silently drop SMS from unknown senders
   → Add sender ID to template (whitelist)
   
5. Check school's account balance
   (if balance = 0, no SMS sent)
   GET /schools/{schoolId}/billing → balance
```

### 6.2 "Message is garbled/corrupted"

```
Checklist:
1. Check template encoding
   GET /sms-templates/preview → check "encoding" field
   
2. If Unicode (Hindi/Gujarati/Tamil):
   ✗ Message over 70 chars? Might split incorrectly
   → Shorten message or test with preview API
   
3. If GSM-7 (English):
   ✗ Using Unicode characters? (é, ñ, ü)
   → System converts to Unicode → char limit drops to 70!
   
Action: 
   → Use preview API before sending
   → Switch to Unicode-safe template if needed
```

### 6.3 "Costs are too high"

```
Checklist:
1. Check SMS count per message
   GET /sms-templates/preview → "smsCount": ?
   
   If smsCount = 1: ✓ Optimal (₹0.50)
   If smsCount = 2: ⚠️ Message over limit (₹1.00)
   If smsCount = 3: ⚠️⚠️ Long message (₹1.50)
   
2. Reduce message length
   Remove unnecessary words, abbreviate
   → Reduces SMS count → Saves cost
   
3. Use templates efficiently
   Combine similar messages (one template, multiple variants)
   → Reduces template management overhead
   
4. Check for duplicate sends
   Maybe same SMS sent twice? 
   → Check logs in dashboard
   
Action:
   → Optimize long templates (if smsCount > 1)
   → Set budget alerts (see Section 4.2)
```

---

## Section 7: Audit & Compliance

### 7.1 SMS Audit Trail

**View all SMS sent:**

```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/sms/audit?limit=100" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "audit": [
    {
      "timestamp": "2026-04-10T10:35:00Z",
      "templateId": "attendance",
      "phone": "9876543210",
      "message": "Hi Mr. Sharma, Rohan was present",
      "status": "delivered",
      "cost": 0.50
    }
  ]
}
```

### 7.2 TRAI Compliance

**Mandatory for India (to avoid carrier blocking):**

```
✓ Every SMS must include Sender ID (e.g., "XYZSCH")
✓ Unsubscribe/Opt-out option in messages (or footer)
✓ Parent can opt-out from SMS notifications
✓ Opt-out requests honored within 24 hours
✓ No promotional SMS (only transactional: attendance, grades, fees)

Current compliance:
├─ Sender ID: "SCHOOLERP" (pre-configured by DevOps)
├─ Opt-out link: Automatically added to all SMS
└─ Message type: All templates classified as "Transactional"
```

---

## Contacts & Escalation

| Issue | Contact | Response Time |
|-------|---------|---|
| SMS not arriving | Support chat | < 5 min |
| Template rendering incorrect | Backend Agent | 30 min |
| SMS costs too high | Backend Agent + Finance | 1 hour |
| Twilio account issue | DevOps Agent | 15 min |
| Carrier blocking | Twilio support (escalate) | 1-4 hours |

---

## FAQ

**Q: Why did one SMS cost ₹1.00 instead of ₹0.50?**
A: Message likely over 160 chars (GSM-7) or contains Unicode. Check preview API.

**Q: Can I schedule SMS for later?**
A: Not yet. Feature planned (use Cloud Scheduler for now if critical).

**Q: Parent says they never got SMS but we show "delivered"**
A: Likely in spam folder. Parent should check. Or carrier silently dropped (known issue). Suggest WhatsApp as alternative (future feature).

**Q: How do I stop SMS sending?**
A: Can't stop already "delivered" SMS. Can click "stop" on "queued" or "sending" SMS (rare). For bulk operations: Check batch status and cancel if still processing.

