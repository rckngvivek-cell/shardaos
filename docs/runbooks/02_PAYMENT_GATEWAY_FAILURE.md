# Operational Runbook: Payment Gateway Failure Recovery

**Severity**: P0 | **Affected Revenue**: All payments blocked | **Estimated MTTR**: 20 minutes

## Incident Detection

- **Alert**: "P0: Payment Gateway Failure" OR "P0: Payment Success Rate < 95%"
- **Typical Symptoms**:
  - Payment initiation failures (HTTP 500/503)
  - Payment verification failures
  - Timeout errors to Razorpay API
  - Zero successful transactions for > 2 minutes

## Immediate Actions (0-2 minutes)

### Step 1: Confirm Payment Gateway Status
```bash
# Check Razorpay status page
curl -s https://status.razorpay.com/api/v2/status.json

# Test Razorpay connectivity from primary region
gcloud compute ssh ops-jumphost-primary --zone=asia-south1-b

# From jumphost:
curl -v https://api.razorpay.com/v1/health
# Response should be 200 OK

# Check payment webhook logs
gcloud logging read "resource.type=cloud_run_revision 
  AND jsonPayload.component=payment_webhook" \
  --limit 50 --format="table(timestamp,jsonPayload.event,jsonPayload.status)"
```

### Step 2: Check DeerFlow Payment Service Logs
```bash
# Error logs in last 5 minutes
gcloud logging read "resource.type=cloud_run_revision 
  AND resource.labels.service_name=deerflow-backend-primary 
  AND jsonPayload.module=payment 
  AND severity=ERROR" \
  --limit 50 \
  --format="table(timestamp,jsonPayload.error,jsonPayload.error_code)"

# Connection timeout analysis
gcloud logging read "resource.type=cloud_run_revision 
  AND jsonPayload.error_message ~ 'timeout|connect|refused'" \
  --limit 20 --format="table(timestamp,jsonPayload.error_message)"
```

## Root Cause Diagnosis (2-7 minutes)

### Scenario 1: Razorpay API Unavailable
```bash
# Verify Razorpay is actually down (not just rate limited)
for i in {1..5}; do
  time curl -I https://api.razorpay.com/v1/health
  sleep 2
done

# Check if rate limited (429)
curl -v https://api.razorpay.com/v1/health -H "X-Request-ID: test-$(date +%s)"
```

**If Razorpay is down:**
- Check http://status.razorpay.com for official status
- Expected resolution time from provider?
- Contact Razorpay support: support@razorpay.com

### Scenario 2: API Key Issues
```bash
# Verify API credentials in Secret Manager
gcloud secrets versions access latest --secret="razorpay-api-key"
gcloud secrets versions access latest --secret="razorpay-api-secret"

# Test API key validity
RAZORPAY_KEY="<retrieved_key>"
RAZORPAY_SECRET="<retrieved_secret>"

curl -X GET https://api.razorpay.com/v1/keys \
  -u "$RAZORPAY_KEY:$RAZORPAY_SECRET"

# If 401 Unauthorized: Keys are invalid
# If 403 Forbidden: Account suspended or restricted
```

### Scenario 3: Network Connectivity Issue
```bash
# Check VPC routing to Razorpay
from primary Cloud Run instance:
nslookup api.razorpay.com
dig api.razorpay.com

# Verify DNS resolution
gcloud compute ssh ops-jumphost-primary --zone=asia-south1-b
dig api.razorpay.com @8.8.8.8

# Check firewall rules allow HTTPS to external IPs
gcloud compute firewall-rules list --format="table(name,allowed)" | grep https
```

### Scenario 4: Payment Service Bug
```bash
# Check service logs for application errors
gcloud logging read "resource.type=cloud_run_revision 
  AND resource.labels.service_name=deerflow-backend-primary 
  AND jsonPayload.stack_trace ~ 'payment'" \
  --limit 10 --format=json | jq '.[] | {time: .timestamp, error: .jsonPayload.message}'

# Recent deployments
gcloud run revisions list --service=deerflow-backend-primary --region=asia-south1 --limit=5
```

## Mitigation Strategies (7-15 minutes)

### If Razorpay API is Down (Wait & Monitor)
```bash
# Enable manual payment entry queue
kubectl patch deployment deerflow-backend-primary -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","env":[{"name":"PAYMENT_MODE","value":"MANUAL_QUEUE"}]}]}}}}'

# Notify affected users
gcloud logging write payment_notification "Payment processing delayed - manual entry queued" \
  --severity=WARNING

# Monitor for resolution
watch -n 30 'curl -s https://api.razorpay.com/v1/health && echo "Razorpay recovered!"'
```

### If API Credentials are Invalid
```bash
# Rotate API keys with Razorpay (requires admin access)
# 1. Go to https://dashboard.razorpay.com/app/settings/api-keys
# 2. Generate new API Key & Secret
# 3. Update in Secret Manager:

gcloud secrets versions add razorpay-api-key --data-file=- << EOF
<new_api_key>
EOF

gcloud secrets versions add razorpay-api-secret --data-file=- << EOF
<new_api_secret>
EOF

# Restart payment service with new credentials
gcloud run deploy deerflow-backend-primary \
  --region=asia-south1 \
  --update-secrets=RAZORPAY_API_KEY=razorpay-api-key:latest \
  --update-secrets=RAZORPAY_API_SECRET=razorpay-api-secret:latest \
  --image=gcr.io/PROJECT_ID/deerflow-backend:latest
```

### If Network Connectivity Broken
```bash
# Update VPC-SC perimeter to allow Razorpay
gcloud access-context-manager perimeters update "deerflow_perimeter" \
  --add-permitted-resources="api.razorpay.com" \
  --update-restricted-services "apikeys.googleapis.com,iam.googleapis.com"

# Verify egress rules allow HTTPS
gcloud compute firewall-rules create allow-razorpay-egress \
  --direction=EGRESS \
  --priority=1000 \
  --destination-ranges=0.0.0.0/0 \
  --allow=tcp:443 \
  --target-tags=cloud-run

# Restart service
gcloud run services update deerflow-backend-primary --region=asia-south1
```

### If Application Bug in Payment Logic
```bash
# Rollback to previous working version
PREVIOUS_REVISION=$(gcloud run revisions list --service=deerflow-backend-primary \
  --region=asia-south1 --limit=2 --format="value(name)" | tail -1)

gcloud run services update-traffic deerflow-backend-primary \
  --to-revisions $PREVIOUS_REVISION=100 \
  --region=asia-south1

# Monitor recovery
for i in {1..10}; do
  curl -X POST https://api.deerflow.dev/api/v1/payments/test \
    -H "Content-Type: application/json" \
    -d '{"amount":100,"currency":"INR"}'
  sleep 10
done
```

## Verification & Testing (15-18 minutes)

### End-to-End Payment Test
```bash
# Create test invoice
TEST_INVOICE=$(curl -s -X POST https://api.deerflow.dev/api/v1/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "studentId": "test-student-001",
    "amount": 100,
    "currency": "INR"
  }' | jq -r '.data.id')

# Initiate payment
PAYMENT=$(curl -s -X POST https://api.deerflow.dev/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d "{
    \"invoiceId\": \"$TEST_INVOICE\",
    \"amount\": 100,
    \"currency\": \"INR\"
  }")

echo $PAYMENT | jq '.'

# Success check
echo $PAYMENT | jq -r '.data.order_id' > /dev/null && echo "✅ Payment initiation successful"
```

### Metrics Verification
```bash
# Payment success rate should return to > 95%
gcloud monitoring read-time-series \
  --filter 'resource.type="cloud_run_revision" 
    AND metric.type="logging.googleapis.com/user/payment_success_rate"' \
  --format="table(points[0].value.double_value)"

# Check latency P99 < 1000ms
gcloud monitoring read-time-series \
  --filter 'resource.type="cloud_run_revision" 
    AND metric.type="logging.googleapis.com/user/payment_latency_p99"' \
  --format="table(points[0].value.double_value)"
```

## Post-Incident Review (18-20 minutes)

### Document Incident
```bash
cat > incident_payment_YYYYMMDD.md << EOF
# Payment Gateway Incident Report - YYYYMMDD

## Summary
Payment processing unavailable from HH:MM to HH:MM UTC (XX minutes)
Affected: ~XXX failed transactions

## Timeline
- HH:MM UTC: First alert triggered
- HH:MM UTC: Investigation began
- HH:MM UTC: Root cause identified: [API_DOWN/CREDS/NETWORK/BUG]
- HH:MM UTC: Mitigation applied: [ACTION]
- HH:MM UTC: Service recovered

## Root Cause
[Detailed explanation]

## Resolution
[What was done to fix]

## Prevention
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

## Follow-up
- [ ] Update monitoring threshold
- [ ] Add automated remediation
- [ ] Schedule postmortem
EOF
```

### Reconciliation
```bash
# Check for failed transactions that need manual intervention
gcloud logging read "resource.type=cloud_run_revision 
  AND jsonPayload.module=payment 
  AND jsonPayload.status=failed 
  AND timestamp >= $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S)Z" \
  --format=json | jq '.[] | {transaction_id: .jsonPayload.transaction_id, amount: .jsonPayload.amount}' > failed_transactions.json

# Notify finance team for manual follow-up
echo "Failed transaction report: $(wc -l < failed_transactions.json) transactions"
```

## Escalation

- **5 min no resolution**: Escalate to Payment Team Lead
- **10 min no resolution**: Escalate to VP Product  
- **15 min no resolution**: Public status update required

## Contacts

- **Payment Team**: payment-oncall@deerflow.dev
- **Finance Team**: finance@deerflow.dev
- **Razorpay Support**: support@razorpay.com
- **War Room**: https://meet.google.com/deerflow-payments-war-room
