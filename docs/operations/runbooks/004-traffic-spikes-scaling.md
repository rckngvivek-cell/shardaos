# Runbook 004: Handling Traffic Spikes & Scaling

**Last Updated:** April 9, 2026  
**Owner:** DevOps Agent  
**Target:** Auto-scale to 50x normal traffic without downtime  

---

## Quick Reference: Traffic Spike Response (2 minutes)

**Is it a real spike or false alarm?**

```bash
# Check current traffic rate
gcloud monitoring read --format=json \
  --filter='resource.labels.service_name=school-erp-api AND metric.type=loadbalancing.googleapis.com/https/request_count' \
  | jq '.[] | .points[0].value.int64_value'

# Normal: 100-200 req/sec
# Spike: >500 req/sec (2.5x+)
# Crisis: >5000 req/sec (25x+)
```

**If spike is real:**
- [ ] Confirm no attack (check IP distribution, user diversity)
- [ ] Note timestamp (when did spike start?)
- [ ] Check if expected (school event, media coverage, etc.)
- [ ] Monitor auto-scaling response

---

## Traffic Spike Tiers

### Tier 1: Minor Spike (2-5x normal)
**Normal:** 200 req/sec → **Spike:** 500-1000 req/sec

**Automatic Response:**
- Cloud Run auto-scales (2 → 10 replicas)
- Time to scale: 30 seconds
- User impact: Minimal (may see <500ms latency bump)

**Manual Actions:**
- None required (system auto-handles)
- Monitor for 5 minutes

---

### Tier 2: Major Spike (5-10x normal)
**Normal:** 200 req/sec → **Spike:** 1000-2000 req/sec

**Automatic Response:**
- Cloud Run scales (2 → 25 replicas)
- Load Balancer distributes across regions
- Redis cache hits increase (fewer Firestore queries)

**Manual Actions:**
- [ ] Review spike cause (school event? viral content?)
- [ ] Monitor error rate (should stay <0.1%)
- [ ] Check Firestore quota usage (should be <80%)
- [ ] If quota approaching: Increase quota pre-emptively

**Example Response:**
```bash
# 1. Verify spike is not attack
gcloud compute security-policies rules list \
  --sort-by priority | head -5

# 2. Check Firestore quota
gcloud firestore databases get
# Look for: capacityMode, realReadOperationsCount

# 3. If quota approaching (>70%), increase
gcloud firestore databases update default \
  --enable-point-in-time-recovery

# 4. Monitor for 30 minutes
watch -n 10 'curl -s https://api.school-erp.in/health | jq .'
```

---

### Tier 3: Extreme Spike (10x+ normal)
**Normal:** 200 req/sec → **Spike:** >2000 req/sec

**Automatic Response:**
- Cloud Run scales to maximum (50 replicas)
- If traffic >cloud Run capacity → HTTP 429 (Too Many Requests)
- Cloud Armor rate limits apply

**Manual Actions (URGENT - activate war room):**

```bash
# 1. Check if legitimate or attack
# Legitimate: Diverse IPs, real user-agents, school event
# Attack: Same IP, bot user-agents, specific endpoints

gcloud logging read \
  'resource.labels.service_name=school-erp-api AND severity=ERROR' \
  --limit=100 --format=json | jq '.[] | .sourceLocation.file' | sort | uniq -c

# 2. If attack: Enable advanced Cloud Armor rules
gcloud compute security-policies rules create 10001 \
  --action=deny-403 \
  --origin-region-list=CN,RU,KP  # Geo-block high-risk countries

# 3. If legitimate (school event): Add capacity
# Option A: Temporarily increase Cloud Run max replicas
gcloud run services update school-erp-api \
  --max-instances=100  # Increase from 50

# Option B: Cache aggressively
# (reduce database hits)
export CACHE_TTL=600  # 10 minutes (normally 300)

# 4. Monitor recovery
# Wait 30-60 minutes for spike to subside
# Then revert max-instances back to 50
```

---

## Auto-Scaling Configuration

### Current Settings (Week 6)

```yaml
# Cloud Run auto-scaling
minimumInstances: 2        # Always keep warm
maximumInstances: 50       # Cap to limit costs
concurrencyPerInstance: 100  # Max simultaneous requests per pod
cpuThreshold: 70%          # Scale up if CPU >70%
memoryThreshold: 80%       # Scale up if memory >80%
scaleDownDuration: 600s    # Don't scale down for 10 min (avoid thrashing)
scaleUpDuration: 30s       # Scale up immediately
```

### Monitoring Auto-Scale Health

```bash
# 1. Check current replica count
gcloud run services describe school-erp-api \
  --format='value(status.currentReplicas)'

# 2. View scaling history
gcloud logging read \
  'resource.labels.service_name=school-erp-api AND textPayload=~"scaled"' \
  --limit=20 --format=compact

# 3. Check if scaling is working (should see replicas increase during load)
# Expected pattern during spike:
# 14:00 - 2 replicas (baseline)
# 14:05 - 5 replicas (spike detected)
# 14:10 - 15 replicas (still scaling)
# 14:15 - 25 replicas (at capacity)
# 14:45 - spike subsides
# 15:00 - scales back to 2 replicas
```

---

## Firestore Quota Management During Spikes

**Read/Write Quotas:**

```
Normal: 100k reads/day, 100k writes/day
Spike (5x): 500k reads/day, 500k writes/day
Extreme (25x): 2.5M reads/day, 2.5M writes/day
```

### Check Current Quota Usage

```bash
# View dashboard
gcloud firestore databases describe default \
  --format='value(capacityMode, realReadOperationsCount, realWriteOperationsCount)'

# If approaching limit:
# realReadOperationsCount: 95000 (out of 100k) ❌

# Increase quota
gcloud firestore databases update default \
  --enable-point-in-time-recovery  # Increases quota tier

# Verify increase
# Takes ~1-2 minutes to apply
watch gcloud firestore databases describe default \
  --format='value(realReadOperationsCount)'
```

### Quota Surge Pricing

After free tier (document ops):
- $0.06 per 100,000 reads
- $0.18 per 100,000 writes
- $0.25 per GB/month storage

**Cost during 25x spike (1 day):**
- Normal day: ~₹2,000 (within free tier)
- Spike day: ~₹50,000 (if sustained 24 hours)

**Mitigation:**
- Enable caching (Redis hits reduce Firestore reads by 40-60%)
- Premium accounts have burst quota (request surge allocation)

---

## Query Optimization During Spikes

**Problematic queries that hurt under load:**

```javascript
// ❌ BAD: Scans all 50k students
db.collection('students')
  .where('status', '==', 'active')
  .get()

// ✅ GOOD: Indexed, returns subset
db.collection('students')
  .where('school_id', '==', schoolId)
  .where('status', '==', 'active')
  .get()

// ✅ BETTER: Paginate, cache result
const page1 = await db.collection('students')
  .where('school_id', '==', schoolId)
  .paginate(pageSize: 100)

redis.setex(`students:${schoolId}`, 300, JSON.stringify(page1))
```

**During spike: Enable aggressively**

```bash
# 1. Identify slow queries
gcloud logging read \
  'resource.labels.service_name=school-erp-api AND duration_ms > 1000' \
  --limit=50 --format=json | jq '.[] | .jsonPayload.query'

# 2. Check if they're hitting production
# (May need to disable certain reports during spike)

# 3. Enable query result caching
export CACHE_RESULTS=true  # Cache ALL read queries
export CACHE_TTL=300       # 5 minutes (default)

# During extreme spike, increase TTL:
export CACHE_TTL=600       # 10 minutes (trade freshness for performance)
```

---

## User-Facing Degradation Handling

**If system still over capacity after max scaling:**

### Option 1: Rate Limiting (Polite Rejection)
"Too many requests. Try again in 60 seconds."

```bash
# Cloud Armor automatically enforces
# Returns HTTP 429

# Client-side retry logic:
async function apiCallWithRetry(url, maxRetries=3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url);
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      await sleep(retryAfter * 1000);
      continue;  // Retry
    }
    return response;
  }
}
```

### Option 2: Read-Only Mode
"System under heavy load, some features temporarily read-only."

```javascript
// Backend feature flag
const IS_OVERLOADED = metrics.errorRate > 0.1;

// Disable expensive writes
if (IS_OVERLOADED) {
  // ❌ BLOCK: Grade entry, attendance entry
  // ✅ ALLOW: View grades, attendance history
  
  if (req.method === 'POST' && req.path === '/attendance') {
    return res.status(503).json({
      error: 'System under high load. Please try again in 5 minutes.'
    });
  }
}
```

### Option 3: Cached Responses
Return stale but fast data during spike

```javascript
// If Firestore slow, return from Redis cache
async function getStudents(schoolId) {
  // Try fresh from DB
  try {
    const students = await db.collection('students')
      .where('school_id', '==', schoolId)
      .get({ timeout: 2000 });  // 2 sec timeout
    
    // Update cache
    redis.setex(`students:${schoolId}`, 300, JSON.stringify(students));
    return students;
  } catch (timeoutError) {
    // Fall back to cache
    const cached = await redis.get(`students:${schoolId}`);
    return JSON.parse(cached);  // May be stale
  }
}
```

---

## Spike Monitoring Dashboard

**Real-time tracking during spike:**

```
┌──────────────────────────────────┐
│ LIVE METRICS - SPIKE RESPONSE    │
├──────────────────────────────────┤
│ Traffic:      1500 req/sec ▲     │
│ (Normal: 200)                   │
│                                  │
│ Cloud Run:    25/50 replicas    │
│ Scaling:      ACTIVE ▲          │
│                                  │
│ Error Rate:   0.08% ✅          │
│ (Threshold: 0.5%)               │
│                                  │
│ Latency P95:  520ms ℹ️           │
│ (Normal: 350ms)                 │
│                                  │
│ Firestore:    85% quota        │
│ (Alert at 90%)                  │
│                                  │
│ Response:     SCALING ACTIVE    │
│ - Add replicas                  │
│ - Enable caching                │
│ - Monitor quota                 │
└──────────────────────────────────┘
```

---

## Scaling-Out Checklist

When spike is sustained >15 minutes:

- [ ] Confirm spike is legitimate (not attack)
- [ ] Verify auto-scaling is working (replicas increasing)
- [ ] Check error rate remains <0.1%
- [ ] Check Firestore quota not at limit
- [ ] Enable aggressive caching (if not already)
- [ ] Disable non-essential features (batch jobs, heavy reports)
- [ ] Monitor memory usage (spikes can cause OOM kills)
- [ ] Increase max replicas if approaching limit (50 → 80)
- [ ] Notify team in #incidents Slack channel
- [ ] Prepare communication for schools if needed

---

## Scaling-Down Checklist

When spike subsides (traffic back to normal):

- [ ] Verify traffic sustained low for >10 minutes
- [ ] Let auto-scaler gradually reduce replicas
- [ ] Monitor error rate during scale-down
- [ ] Revert any temporary quota increases
- [ ] Revert aggressive caching settings
- [ ] Re-enable features that were disabled
- [ ] Revert max replicas back to 50
- [ ] Update status if had communicated delays

---

## Historical Spike Data

**Track unusual traffic patterns:**

```bash
# Export spike metrics for analysis
gcloud logging read \
  'resource.labels.service_name=school-erp-api' \
  --limit=10000 \
  --format=json > spike-log.json

# Analyze
python3 <<'EOF'
import json

with open('spike-log.json') as f:
  logs = json.load(f)

# Find timestamps with high request counts
for log in logs:
  if log['jsonPayload']['request_count'] > 1000:
    print(f"Spike at {log['timestamp']}: {log['jsonPayload']['request_count']} req/sec")
EOF
```

---

## Cost of Spikes

**Extra compute cost for handling spike:**

| Scenario | Duration | Extra Replicas | Cost |
|----------|----------|---|---|
| 5x spike, 1 hour | 1 hour | 2 → 15 (+13) | ₹200 |
| 10x spike, 30 min | 30 min | 2 → 25 (+23) | ₹300 |
| 25x spike, 1 day | 24 hours | 2 → 50 (+48) | ₹10,000 |

**Way to recover cost:**
- Most spikes are positive (high engagement, paid school events)
- Revenue spike often >10x cost of infrastructure
- Worth it to keep system responsive

---

## Related Runbooks

- [Zero-Downtime Deployment](./002-zero-downtime-deployment.md)
- [Production Incident Response](./001-production-incident-response.md)
- [Rate Limiting Strategy](../architecture/ADRs/004-rate-limiting-ddos-protection.md)

