# SMS Notification Troubleshooting Runbook

**Version:** 1.0  
**Status:** OPERATIONAL (Week 5)  
**Last Updated:** April 14, 2026  
**On-Call:** Backend Agent (SMS Service)  
**Escalation:** Lead Architect (Twilio Account)

---

## Service Overview

**Tech Stack:**
- Provider: Twilio
- Delivery: Firebase Cloud Tasks (retry mechanism)
- Storage: Firestore (sms_logs collection)
- Monitoring: Cloud Logging + Stackdriver

**Key Metrics:**
- Delivery SLA: 95%+ within 30 seconds
- Rate Limit: 5 SMS/hour per phone
- Cost per SMS: ₹0.50

---

## Quick Diagnostics

### SMS Not Sending?

**Check 1: Verify Rate Limit Not Exceeded**
```bash
# Query Redis for rate limit key
redis-cli get "sms:+919876543210"
# Expected: number <= 5 (if 1-6 means within limit)
# If > 5: User hit rate limit, will retry next hour
```

**Check 2: Verify Firestore Logs**
```bash
# View recent SMS attempts
gcloud firestore documents list \
  --collection-path='schools/SCHOOL_ID/sms_logs' \
  --limit=20

# Look for your phoneNumber in last 10 entries
# Status should be: 'queued' → 'sent' → 'delivered'
```

**Check 3: Cloud Tasks Queue Status**
```bash
# View pending tasks in SMS queue
gcloud tasks queues describe sms-delivery

# Check for backlog
gcloud tasks list \
  --queues=sms-delivery \
  --filter='state:QUEUED'
# Expected: Empty or very few tasks

# If many queued: Possible Twilio issue or throttling
```

**Check 4: Twilio Account Status**
```bash
# Visit Twilio Console
# https://console.twilio.com

# Verify:
- [ ] Account Active (not suspended)
- [ ] Phone Number verified (+1 or appropriate country)
- [ ] Account balance > ₹0
- [ ] No API errors on dashboard
```

---

## Common Issues & Fixes

### Issue: "Message Status: UNDELIVERED"

**Symptom:** SMS shows status 'UNDELIVERED' in Firestore logs

**Possible Causes & Solutions:**

#### 1. Invalid Phone Number Format

```bash
# Check phone format in logs
gcloud firestore documents get \
  --document='schools/SCHOOL_ID/sms_logs/TWILIO_MESSAGE_ID'

# Look for: phoneNumber field
# Expected format: "+91XXXXXXXXXX"
# Common errors:
#   - Missing +91 prefix
#   - Extra spaces or formatting
#   - Wrong country code
```

**Fix:**
```typescript
// Validate on entry
const phoneRegex = /^\+91\d{10}$/;
if (!phoneRegex.test(phone)) {
  throw new Error('Invalid phone format');
}
```

#### 2. Phone Number Not Reachable

**Troubleshoot:**
- Phone number invalid or deactivated
- Carrier doesn't support international SMS
- Phone in airplane mode or no signal

**Action:**
- Contact parent to verify phone number
- Try SMS from another service (Google Voice, etc.)
- If still fails: Fall back to email notification

#### 3. Blocked by Carrier

**Symptom:** Twilio error: "FORBIDDEN" or "Queue limit exceeded"

**Cause:** Carrier blocking due to rate limiting or TRAI Do Not Call registry

**Resolution:**
```bash
# 1. Check DND registry
# Visit: https://www.nccptreg.in/ (India - NCPR)

# 2. Verify number not in registry
# 3. If in registry: Contact school admin to update preference

# 4. Rate limit enforcement
# If same phone >5 SMS/hour:
#   - Current behavior: Queued for next hour ✓
#   - Fallback to email ✓
#   - Notify parent of whitelist option ✓
```

---

### Issue: "Message Status: BOUNCED"

**Symptom:** SMS shows status 'BOUNCED' or 'FAILED'

**Possible Causes & Solutions:**

#### 1. Twilio Number Invalid

```bash
# Verify Twilio number
echo $TWILIO_PHONE_NUMBER
# Expected: Valid number like +12015550123 or +919999999999

# Check in Twilio Console
# https://console.twilio.com/account/phone-numbers/incoming
```

**Fix:**
```bash
# Update environment variable
export TWILIO_PHONE_NUMBER="+1234567890"
# Redeploy API service
gcloud run deploy school-erp-api --update-env-vars TWILIO_PHONE_NUMBER=+1234567890
```

#### 2. Twilio Account Suspended

```bash
# Check account status
curl -X GET https://api.twilio.com/2010-04-01/Accounts \
  --user "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Look for: "status": "active"
# If suspended: Contact Twilio support immediately
```

**Resolution:**
- Check email for suspension notice from Twilio
- Likely cause: Usage spike or potential fraud detection
- Action: Contact Twilio support, explain school context

#### 3. Insufficient Account Balance

```bash
# Check Twilio account balance
gcloud logging read \
  "jsonPayload.error.message=~'Account balance'"  \
  --limit=5 --format=json

# Or visit Twilio Console > Account > Billing
```

**Fix:**
```bash
# Add credit to Twilio account
# https://www.twilio.com/console/account/settings
# Min: Add ₹5,000

# Monitor spending
# Expected: ~₹0.50 per SMS × 100 /day = ₹50/day = ₹1,500/month
```

---

### Issue: "Cloud Tasks Backlog Growing"

**Symptom:** Tasks in queue not processing, backlog increasing

**Diagnostics:**
```bash
# Check queue stats
gcloud tasks queues describe sms-delivery

# View oldest queued task
gcloud tasks list \
  --queues=sms-delivery \
  --filter='state:QUEUED' \
  --sort-by='createTime' \
  --limit=1

# Calculate backlog age
# If >1 hour old: Something is stuck
```

**Possible Causes & Solutions:**

#### 1. Twilio Service Down

```bash
# Check Twilio status page
# https://status.twilio.com/

# If outage listed:
# - Expected: 15-60 min recovery
# - Action: Post update to #sms-status Slack channel
# - Cloud Tasks will auto-retry per exponential backoff
```

#### 2. Invalid Credentials

```bash
# Verify Twilio credentials
env | grep TWILIO
# Should show: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

# Test credentials
curl -X GET https://api.twilio.com/2010-04-01/Accounts \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
# Expected: 200 OK with account details
```

**Fix:**
```bash
# Update API service with correct credentials
gcloud run deploy school-erp-api \
  --update-secrets= \
  TWILIO_ACCOUNT_SID=projects/PROJECT_ID/secrets/twilio-sid:latest \
  TWILIO_AUTH_TOKEN=projects/PROJECT_ID/secrets/twilio-token:latest
```

#### 3. Cloud Tasks Configuration Error

```bash
# Check Cloud Tasks location and auto-scaling
gcloud tasks queues describe sms-delivery --location=us-central1

# Verify:
- rateLimits.maxConcurrent: ≥ 5 (allows 5 parallel sends)
- retryConfig.maxAttempts: ≥ 5 (retry failures)
- retryConfig.maxBackoff: ≈ 3600s (1 hour retry window)
```

**Fix:**
```bash
# Update retry configuration
gcloud tasks queues update sms-delivery \
  --location=us-central1 \
  --max-concurrent-dispatches=10 \
  --max-retry-duration=3600s \
  --min-backoff=5s \
  --max-backoff=600s
```

---

### Issue: "Email Fallback Triggered"

**Symptom:** Parent received email instead of SMS

**Root Cause:** Rate limit exceeded (5 SMS/hour)

**Behavior:**
```
User requests SMS notification
  ↓
Check: Has this phone sent SMS in last hour?
  ↓
If ≤5 SMS: Send SMS ✓
If >5 SMS: Send email fallback + notify parent
           SMS will retry next hour when count resets
```

**Not a Problem:** This is intended behavior for spam prevention

**Verify:**
```bash
# Check rate limit hits in logs
gcloud logging read \
  "jsonPayload.reason='RATE_LIMIT_EXCEEDED'" \
  --limit=10 --format=json

# Parent should have received email notification
# SMS will send on next hour
```

---

### Issue: "Twilio Webhook Timeout"

**Symptom:** SMS logs stuck in 'sent' status, never reaching 'delivered'

**Cause:** Twilio webhook delivery timeout

**Solution:**
```bash
# 1. Verify webhook endpoint is accessible
curl -X POST https://YOUR_API.cloud.run/webhooks/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM000&MessageStatus=delivered&To=%2B919999999999"
# Expected: 200 OK

# 2. Check Cloud Run service
gcloud run services describe school-erp-api

# 3. Monitor webhook logs
gcloud logging read \
  "resource.type='cloud_run_revision' AND \
   jsonPayload.endpoint='/webhooks/twilio/status'" \
  --limit=20 --format=json

# Look for: timeout or 5xx errors
```

**Fix:**
```bash
# Increase Cloud Run timeout
gcloud run deploy school-erp-api \
  --timeout=300 \
  --max-instances=100

# Or manually fetch delivery status
# Call: /api/v1/sms/message/{twilioMessageSid}/status
# This compensates for failed webhooks
```

---

## Performance Optimization

### SMS Sending Slow?

**Target:** <1 second to enqueue SMS

```bash
# Profile SMS send operation
gcloud logging read \
  "jsonPayload.duration_ms" \
  --filter='jsonPayload.operation="send_sms"' \
  --limit=100 \
  --format=json | \
  jq '[.[] | .jsonPayload.duration_ms] | add / length'

# Expected median: <200ms
# If >500ms: Potential optimization needed
```

**Optimizations:**
```typescript
// 1. Batch enqueue to Cloud Tasks
async function batchEnqueueSMS(messages, batchSize = 10) {
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    await Promise.all(batch.map(msg => enqueueSMS(msg)));
  }
}

// 2. Use connection pooling
const twilioClient = twilio(accountSid, authToken, {
  httpClient: new NodeClient({ keepAlive: true })
});

// 3. Redis cache for recent log lookups
const redis = new Redis({
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: true
});
```

---

## Cost Monitoring

### Track Monthly Spend

```bash
# Export SMS logs from Firestore
gcloud firestore export gs://school-erp-backups/sms-export --async

# Analyze in BigQuery
bq query --use_legacy_sql=false '
  SELECT 
    DATE(createdAt) as date,
    COUNT(*) as count,
    SUM(cost_in_rupees) as daily_cost
  FROM `school-erp.sms_logs`
  WHERE DATE(createdAt) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY date
  ORDER BY date DESC
'

# Expected: <₹1,500/month for 2,500 users
```

**Set Budget Alert:**
```bash
# Create alert if spending exceeds threshold
gcloud billing budgets create \
  --billing-account=ACCOUNT_ID \
  --display-name='SMS Budget Alert' \
  --budget-amount=2000 \
  --threshold-rule=percent=80,percent=100
```

---

## Escalation Procedures

### Level 1: Troubleshoot (15 min)

Use diagnostics above. If issue persists:

### Level 2: Contact Twilio Support (30 min)

```bash
# Collect diagnostic info
gcloud logging read \
  "resource.type='cloud_run_revision' AND \
   (severity=ERROR OR severity=WARNING)" \
  --limit=50 --format=json > /tmp/logs.json

# Prepare info for support:
# 1. Twilio Account SID
# 2. Error logs (last 50 entries)
# 3. Phone number that failed
# 4. Exact timestamp of failure

# Contact: https://www.twilio.com/console/support
# Severity: Customer-Facing (depends on impact)
```

### Level 3: Escalate (60 min)

Contact Lead Architect if:
- Twilio account suspended
- Widespread SMS failures (>50% of messages)
- On-call can't reach Twilio support

**Lead Architect Actions:**
- Initiate Twilio account investigation
- Evaluate SMS provider alternatives (AWS SNS)
- Coordinate with Product for customer communication

---

## Monitoring Dashboard

**Key Metrics to Watch:**

```
Cloud Logging Query:
SELECT
  resource.labels.service_name,
  jsonPayload.status,
  COUNT(*) as count,
  AVG(jsonPayload.latency_ms) as avg_latency
FROM `school-erp.logs`
WHERE jsonPayload.service = 'sms'
GROUP BY resource.labels.service_name, jsonPayload.status

Target SLO:
- Status: sent (100%)
- Status: delivered (95%+)
- Status: failed (<2%)
- Avg latency: <1000ms
```

**Set Up Alert:**
```bash
# Alert if delivery rate drops below 90%
gcloud alpha monitoring policies create \
  --display-name='SMS Delivery Rate Low' \
  --condition-name='delivery_rate_low' \
  --condition-threshold-value=0.90 \
  --condition-threshold-comparison=COMPARISON_LT
```

---

## Recovery Procedures

### Bulk Retry Failed SMS

```bash
# If multiple SMS failed, bulk retry
# 1. Identify failed messages
gcloud firestore documents list \
  --collection-path='sms_logs' \
  --filter='status = "failed" AND createdAt >= 2026-04-14'

# 2. Create retry task
# Requeue to Cloud Tasks
gcloud tasks create-app-engine-task \
  retry-sms-batch \
  --queue=sms-delivery \
  --url=/batch-retry
```

---

