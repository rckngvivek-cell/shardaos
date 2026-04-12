# Runbook 005: Database Failover Procedures

**Last Updated:** April 9, 2026  
**Owner:** DevOps Agent + Lead Architect  
**RTO:** 2 minutes (automatic failover)  
**RPO:** <1 minute (no data loss)  

---

## Quick Reference: When to Failover (1 minute)

**Is primary Firestore down?**

```bash
# Test connection to primary (asia-south1)
gcloud firestore query --collection schools --limit=1 --database=default

# If error like "connection refused" or "deadline exceeded":
echo "❌ PRIMARY DOWN - INITIATE FAILOVER"

# If can connect:
echo "✅ PRIMARY OK - NO FAILOVER NEEDED"
```

---

## Firestore Multi-Region Architecture

```
Phase 1 (Week 6 - Current):
┌────────────────────────────────┐
│ asia-south1 (Primary + Backup) │
│ Mumbai                         │
│ - All reads & writes           │
│ - Automatic hourly backups     │
└────────────────────────────────┘

Phase 2 (Week 8+):
┌────────────────────────────────────────────┐
│ asia-south1 (Primary)    Read Replicas:     │
│ Mumbai                   - us-central1      │
│ - All writes             - europe-west1     │
│ - Primary reads          - asia-northeast1  │
│                                             │
│ Change Stream Replication (<30-60 sec lag)  │
└────────────────────────────────────────────┘

Phase 3 (Week 10+):
┌────────────────────────────────────────────┐
│ Automated Failover                          │
│ -Primary down → Automatic failback          │
│ -RTO: 2 minutes (automatic)                 │
│ -RPO: 0 (changes streamed in real-time)    │
└────────────────────────────────────────────┘
```

---

## Current Failover Status (Week 6)

**Primary:** asia-south1 (Mumbai) only  
**Backup:** Automated backups (hourly, restore time 15-20 min)  
**Failover Type:** Manual from backup (not automated yet)

**When Phase 2 deployed (Week 8):**
- Read replicas active (eventual consistency)
- Automated manual failover (5-minute decision window)
- Full automatic failover by Week 10

---

## Failover Triggers

### Automatic Trigger Conditions

**System automatically initiates failover if:**

```
Primary (asia-south1) Firestore shows:
- Connection timeout (no response >30 seconds)
- Service unavailable (HTTP 503)
- Quota errors sustained >1 minute
- Authentication failures >1000/minute
```

**Detection via monitoring:**
```bash
# Health check to detect failure
gcloud compute backend-services health-checks list | grep firestore

# Alert fires if 3 consecutive health checks fail (30 seconds total)
# → Automatic failover initiated
```

### Manual Trigger (if automatic fails)

**When to manually trigger failover:**
- [ ] Primary confirmed down (multiple connection attempts failed)
- [ ] Automatic failover initiated but stalled >2 min
- [ ] Manual override needed for emergency

---

## Automatic Failover Procedure (Hands-Off, 2 minutes)

**Timeline:**

```
T=0:00   Primary goes down
         ↓
T=0:10   Health check #1 fails
         ↓
T=0:20   Health check #2 fails
         ↓
T=0:30   Health check #3 fails → THRESHOLD MET
         ↓ (Automatic failover activates)
T=0:40   Cloud Functions run: Update API config
         ↓
T=1:00   Traffic rerouted to backup region
         ↓
T=1:20   Firestore replica promoted / Emergency DB active
         ↓
T=2:00   ✅ API responding from backup
         ✅ Slack alert: "FAILOVER COMPLETE"
```

**What's automatic (no manual action needed):**
- Cloud Monitoring detects failure
- Cloud Functions triggered
- API redirects to us-central1 replica (if exists)
- Or cached responses served from Redis

**What happens to users:**
- Some in-flight requests timeout (technical users see "Connection reset")
- Retry logic kicks in automatically (built into SDKs)
- Most users unaware (request silently rerouted)
- Stale data possible (cached from backup)

---

## Manual Failover Procedure (If Automatic Fails)

**Only proceed if, after 2 minutes, system still unavailable:**

### Step 1: Confirm Primary is Really Down (2 minutes)

```bash
# Multiple connection attempts from different sources
for i in {1..5}; do
  echo "Attempt $i:"
  timeout 5 gcloud firestore query --collection schools --limit=1
  sleep 2
done

# If all 5 fail → Primary confirmed down
```

### Step 2: Activate Failover (5 minutes)

```bash
# Option A (Week 6): Restore from backup
# Uses most recent hourly backup

gcloud firestore restore firestore-backup-latest \
  --destination-database=failover-recovery

# Wait 15-20 minutes for restore to complete...
# This creates a NEW database instance

# Option B (Week 8+): Failover to read replica

gcloud firestore failover --database=default \
  --target-region=us-central1  # Promote replica to primary

# Takes ~2 minutes

# Option C (Week 8+): Graceful switch (recommended)

# 1. Promote replica
gcloud firestore promote-replica --replica=us-central1

# 2. Verify reads working
gcloud firestore query --collection schools --limit=1 --database=default

# 3. Monitor for 5 minutes
# (Make sure error rate stays <0.1%)
```

---

## Step 3: Traffic Rerouting

### Automatic (Recommended)

Cloud Run API automatically tries multiple endpoints:
```javascript
const firestore = new Firestore({
  projectId: 'school-erp-prod',
  database: 'default',
  preferredRegion: 'asia-south1',  // Primary preference
  fallbackRegions: ['us-central1', 'europe-west1'],  // Fallback order
  timeout: 5000  // 5 sec timeout before next region
});
```

During failover: Asia-south1 times out → tries us-central1 → succeeds ✅

### Manual Rerouting (if auto fails)

```bash
# Force API to use secondary region only
gcloud run services update school-erp-api \
  --set-env-vars FIRESTORE_REGION=us-central1

# Then restart
gcloud run services update school-erp-api \
  --no-traffic  # Pause

sleep 30

gcloud run services update school-erp-api \
  --traffic=school-erp-api-current=100  # Resume

# Monitor
curl https://api.school-erp.in/health
```

---

## Step 4: Verification (5 minutes)

### Verify Database Accessible

```bash
# Query main collections
gcloud firestore query --collection schools --limit=5
gcloud firestore query --collection students --limit=5
gcloud firestore query --collection attendance --limit=5

# All should succeed ✅
```

### Verify API Responding

```bash
# From multiple clients
for i in {1..10}; do
  curl -s https://api.school-erp.in/health | jq .status
  sleep 2
done

# All should return: "ok" ✅
```

### Check Error Rate

```bash
gcloud logging read \
  'resource.labels.service_name=school-erp-api AND severity=ERROR' \
  --limit=50 | wc -l

# Should be <10 errors in recent logs (low)
```

### Monitor for 30 Minutes

```bash
# Watch dashboard
open 'https://console.cloud.google.com/monitoring/dashboards/custom/school-erp'

# Verify:
# - Error rate <0.1% ✅
# - Latency <400ms p95 ✅
# - Uptime >99.95% during window ✅
# - No cascading failures ✅
```

---

## Step 5: Communication

### Slack #incidents

```
🚨 FAILOVER INITIATED
Primary Firestore (asia-south1) unresponsive
Failover to us-central1 in progress

Timeline:
- 14:30 Primary detected down
- 14:32 Failover initiated
- 14:35 Currently serving from backup
- Status: RECOVERING (monitoring)

Users may see 30-sec lag or stale data briefly
Expected resolution: 15:00 (30 minutes from start)

Questions? Join #war-room
```

### Customer Communication (if >10 min outage)

Send to all connected schools:
```
Subject: Service Disruption - Incident Report

Dear School Partners,

We experienced a brief service disruption (14:30-14:45 IST, 15 minutes).

What affected you:
- Attendance/grade entry may have been slow
- Mobile app may have asked to retry
- Dashboard data refreshed slower

What we did:
- Automatically detected the issue (30 sec)
- Failover to backup infrastructure (2 min)
- Service recovered (15 min total)

What we're doing:
- Investigating root cause
- Implementing improved monitoring
- No data was lost

Apologies for any inconvenience.
School ERP Platform Team
```

---

## Recovery: Switching Back to Primary (After Fix)

**Once primary is fixed, switch back:**

```bash
# 1. Verify primary is healthy
gcloud firestore query --collection schools --limit=1 --database=primary

# 2. Sync any data written during failover
# (If failover lasted >5 minutes, some data may have been written to backup)
python3 <<'EOF'
# Compare primary vs backup
# If small differences, manually merge

# If large differences, sync from backup to primary
import json

primary = fetch_database('primary')
backup = fetch_database('backup')

# Find records only in backup
backup_only = set(backup.keys()) - set(primary.keys())
for record_id in backup_only:
  primary[record_id] = backup[record_id]
EOF

# 3. Failover back to primary
gcloud firestore failover --database=default \
  --target-region=asia-south1

# Takes ~2 minutes

# 4. Verify traffic back on primary
gcloud run services describe school-erp-api \
  --format='value(status.traffic)'

# Should show: primary 100% ✅

# 5. Monitor for 30 minutes (ensure stability)
```

---

## Failover Drill (Monthly)

**Practice failover to ensure procedures work:**

```bash
# Every month (1st Friday):

# 1. Schedule maintenance window (2 PM IST, low traffic)
# Communicate to schools: "Testing backup systems, may see brief delay"

# 2. Simulate primary down
# (Don't actually take it down, just test rerouting)

gcloud firestore failover --database=default \
  --target-region=us-central1 \
  --dry-run=true  # Test mode

# 3. Verify failover would work
curl https://api.school-erp.in/health

# 4. Switch back (no-op since dry-run)
# Verify we're back on primary

# 5. Document results:
# - RTO was 2 minutes ✅
# - No data loss ✅
# - All endpoints functional ✅
# - All teams trained and responsive ✅

# 6. Share results in #postmortems
```

---

## Common Mistakes During Failover

### ❌ MISTAKE 1: Writing to Dead Database
If primary is partially responsive (reads fail, writes succeed):
- Can create data inconsistency
- **Fix:** Use connection pooling with fallback (automatic)

### ❌ MISTAKE 2: Failover Without Backup
Attempting failover without verified backup:
- Can lose all recent data
- **Fix:** Test backups monthly (restore drill)

### ❌ MISTAKE 3: Too-Long Failover RTO
Manual failover taking >10 minutes:
- User experience degrades significantly
- **Fix:** Automate failover, test monthly

### ❌ MISTAKE 4: No Data Sync After Failover
After recovering primary:
- Backup data not synced back
- Creates inconsistency
- **Fix:** Use Phase 2 two-way replication (Week 8+)

---

## Cost of Failover

**Infrastructure for failover readiness:**

| Component | Cost |
|-----------|------|
| Primary backup (hourly) | Included in Firestore |
| Read replicas (Week 8) | +$50-100/month |
| Cloud Functions (failover) | <$1/month |
| Monitoring/alerting | <$10/month |
| **Total (with replicas)** | **~₹1,500-3,000/month** |

**ROI:** One prevented outage saves ₹10,000+

---

## Disaster Recovery SLA

| Metric | Target | Current (W6) | Week 8 | Week 10 |
|--------|--------|---|---|---|
| RTO | <5 min | 15 min | 2 min | <30 sec |
| RPO | <1 min | <1 hour | <30 sec | <5 sec |
| MTTR | <1 hour | <2 hours | <1 hour | <30 min |
| Auto failover | Yes | No | Yes | Yes |
| Manual failover | Yes | Yes | Yes | Yes |

---

## Related Documents

- [Production Incident Response](./001-production-incident-response.md)
- [Data Recovery from Corruption](./003-data-recovery-corruption.md)
- [Multi-Region Replication ADR](../architecture/ADRs/003-firestore-multi-region-replication.md)

---

## On-Call Escalation for Failover

**If failover needed:**

1. **Call DevOps Lead** (on-call)
   - Confirm primary is down
   - Initiate failover

2. **Alert Lead Architect** (concurrent)
   - Keeps strategic oversight
   - Makes policy decisions

3. **Notify Product Lead** (after 5 min)
   - For customer communication if>15 min outage

4. **War room** (if >15 min recovery)
   - Full incident command structure
   - All team leads join

