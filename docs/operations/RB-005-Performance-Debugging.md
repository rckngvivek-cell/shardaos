# Runbook: Performance Debugging - Identify Slow Queries & Optimize

**Last Updated:** April 9, 2026  
**Runbook ID:** RB-005  
**Severity Level:** High  
**Owner:** Backend Agent + Data Agent  
**Escalation Contact:** Lead Architect

---

## 📋 Purpose

Diagnose and fix performance issues: slow queries, high latency, resource exhaustion. Goal: Identify bottleneck in <10 minutes, deploy fix in <30 minutes.

**When to use this:**
- Alert: "P99 latency >2 seconds"
- Alert: "Database query timeout"
- Alert: "CPU usage >80%"
- User report: "Dashboard taking 30 seconds to load"
- Planned optimization work

**When NOT to use this:**
- Deployment issues (use RB-001)
- Incident response (use RB-002)
- General maintenance (use RB-001)

**Estimated Duration:** 10 minutes (diagnosis) + 15 minutes (fix + deploy)  
**Risk Level:** Medium (read-only, non-destructive diagnosis)

---

## ✅ Prerequisites

Before performance debugging:

- [ ] Access to production logs (gcloud CLI)
- [ ] Access to monitoring dashboard
- [ ] SQL query profiling tools available
- [ ] Database connection access
- [ ] Code repository access (to review queries)
- [ ] Performance testing environment (to reproduce)

---

## 🔧 Step-by-Step Performance Diagnosis

### Phase 1: Identify Bottleneck (5 minutes)

**Step 1.1: Check Monitoring Dashboard**
- Open: https://console.cloud.google.com/monitoring/dashboards
- Select: "School ERP Production"
- Look for red/orange indicators:
  - 🔴 CPU spike
  - 🔴 Memory spike
  - 🟠 Query latency spike
  - 🟠 Firestore throughput exceeded

Example symptoms to look for:
```
API Latency: ↑↑↑ (was 200ms, now 2000ms)
CPU Usage: ↑↑↑ (was 30%, now 85%)
Firestore reads: ↑↑↑ (was 100/sec, now 1000/sec)
```

**Step 1.2: Get Application Logs**
```bash
# Get recent error/slow logs:
gcloud run logs read --service school-erp-api-production \
  --limit 100 \
  --format json > logs.json

# Look for patterns:
# - "Query timeout" → Database query issue
# - "DEADLINE_EXCEEDED" → Firestore timeout
# - Messages with duration >1000ms → identify slow operation
```

**Step 1.3: Categorize the Issue**
Run through the decision tree:

| Bottleneck | Symptoms | Next Step |
|-----------|----------|-----------|
| **Slow query** | "SELECT * FROM students" taking 5s | Go to 2.1 |
| **High CPU** | CPU at 85%, all cores busy | Go to 2.2 |
| **Memory leak** | Memory 95%, growing every minute | Go to 2.3 |
| **Firestore quota** | "Resource exhausted" error | Go to 2.4 |
| **Network latency** | Requests fast, responses slow | Go to 2.5 |

---

### Phase 2: Diagnosis by Bottleneck Type

#### 2.1: Slow Database Query

**Symptom:** Log shows queries taking >500ms
```
[SLOW] Query took 2340ms: SELECT * FROM fees WHERE school_id = 'SC001'
```

**Step 2.1.1: Identify the Query**
```bash
# Extract slow queries from logs:
grep "SLOW" logs.json | grep -oP "Query: \K.*" > slow_queries.txt

# Most common query:
sort slow_queries.txt | uniq -c | sort -rn | head -5
```

**Step 2.1.2: Analyze Query Plan**
```bash
# Use EXPLAIN to see execution plan:
EXPLAIN SELECT * FROM fees WHERE school_id = 'SC001' ORDER BY created DESC;

# Look for:
# - ⚠️ Full table scan (no index used)
# - ⚠️ Nested loops (expensive joins)
# - ✅ Index scan (good)
```

**Step 2.1.3: Check for Missing Index**
```bash
# Query using school_id but no index?
# Create index:
CREATE INDEX idx_fees_school_id ON fees(school_id);

# Or if different database:
gcloud sql instances patch school-erp-prod-db \
  --add-index="fees_school_idx" \
  --field="school_id"
```

**Step 2.1.4: Test Fix**
```bash
# Rerun query with index:
EXPLAIN SELECT * FROM fees WHERE school_id = 'SC001';
# Should show: "Index scan" now (not table scan)

# Performance test:
SELECT * FROM fees WHERE school_id = 'SC001' LIMIT 1000;
# Should return in <100ms (vs 2340ms before)
```

---

#### 2.2: High CPU Usage

**Symptom:** CPU at 85%, all cores working hard
```
Instance: school-erp-api-prod-1
CPU: 85% (6 cores used)
RAM: 4 GB / 8 GB (50% used)
```

**Step 2.2.1: Identify CPU-Consuming Process**
```bash
# Check which Cloud Run revision consuming CPU:
gcloud run revisions list --service school-erp-api-production \
  --limit 5 \
  --format="value(name, cpu_throttled_count)"

# If CPU throttled count high → Revision consuming too much
```

**Step 2.2.2: Profile Application**
```bash
# Use Node.js profiler if available:
// Add to code:
import profiler from 'node-profiler';

// Get CPU profile:
profiler.startProfiling();
// ... wait 10 seconds with load ...
profiler.stopProfiling();

// Analyze: Which functions consuming CPU?
// Look for loops, complex calculations, encryption
```

**Step 2.2.3: Common CPU Issues**
```
Issue 1: N+1 query problem (fetching 1000 students, then loading marks for each)
Fix: Use batch query or JOIN

Issue 2: Unnecessary encryption on every request
Fix: Move encryption to initialization,  reuse result

Issue 3: Large data processing without pagination
Fix: Batch processing, stream data instead of load-all

Issue 4: Regex matching on large datasets
Fix: Use database query instead of application code
```

**Step 2.2.4: Deploy Fix**
```bash
# After fixing code:
git commit -m "Fix: N+1 query in marks endpoint"
git push origin main

# GitHub Actions triggers deployment automatically
# Monitor: CPU should drop once deployed
```

---

#### 2.3: Memory Leak

**Symptom:** Memory grows every minute, never freed
```
Timestamp: 12:00 - Memory: 1.2 GB
Timestamp: 12:05 - Memory: 2.3 GB
Timestamp: 12:10 - Memory: 3.5 GB
Eventually: OOMKilled (crashes)
```

**Step 2.3.1: Identify Memory Accumulation**
```bash
# Take memory snapshot:
# Node.js: heapdump
import heapdump from 'heapdump';

// Manually trigger:
heapdump.writeSnapshot();

// Analyze which objects accumulating:
# Use Chrome DevTools heap snapshot analysis
```

**Step 2.3.2: Common Memory Leaks**
```
Leak 1: Cache never cleared (Redis connection leaks)
Fix: Add TTL to cache, implement max-size limit

Leak 2: Event listeners not removed
Fix: On socket close → removeAllListeners()

Leak 3: Large array accumulating in closure
Fix: Clear array after processing, don't hold references

Leak 4: Database cursor not closed
Fix: Ensure connection pool returns connections
```

**Step 2.3.3: Deploy Fix**
```bash
# Example fix for Redis leak:
// BEFORE (leaking):
const client = redis.createClient();
client.get('key', callback);  // Connection never returned

// AFTER (fixed):
const client = redis.createClient();
client.get('key', (err, val) => {
  client.quit();  // Release connection
  callback(err, val);
});
```

---

#### 2.4: Firestore Quota Exceeded

**Symptom:** "Resource exhausted" errors
```
Error: Resource exhausted (429)
Quota: Firestore write operations: 50,000/day
Currently used: 50,001
```

**Step 2.4.1: Check Quota Usage**
```bash
# View quota metrics:
gcloud compute project-info describe --project school-erp-prod

# Or from console:
# APIs & Services → Quotas → Firestore
```

**Step 2.4.2: Identify Excessive Operations**
```bash
# Query BigQuery for operation counts:
SELECT 
  collection,
  COUNT(*) as operation_count,
  SUM(bytes_written) as data_written
FROM `school_erp_prod.firestore_stats`
WHERE DATE = CURRENT_DATE()
GROUP BY collection
ORDER BY operation_count DESC
LIMIT 10;
```

**Step 2.4.3: Reduce Operations**
```
Issue 1: Reading same data multiple times
Fix: Cache in Redis, batch reads

Issue 2: Updating field on every request (even no change)
Fix: Check if changed, only write if different

Issue 3: Unnecessary syncs to BigQuery
Fix: Batch writes, debounce updates

Issue 4: Real-time listeners on large collections
Fix: Paginate listeners, only listen to needed subset
```

**Step 2.4.4: Optimize and Monitor**
```bash
# After optimization, redeploy and check:
gcloud run logs read --service school-erp-api-production \
  --grep="firestore" --limit 50

# Should see: Fewer "Resource exhausted" errors
# Quota usage: Stable or decreasing
```

---

#### 2.5: Network Latency

**Symptom:** Requests fast, responses slow (50-100ms each)
```
Request time: 5ms (from client to server)
Processing: 10ms
Response time: 200ms ← SLOW HERE
```

**Step 2.5.1: Identify Response Bottleneck**
```bash
# Check response size:
curl -I https://api.school-erp.local/api/v1/reports/attendance

# Look for large response size:
# Content-Length: 50MB ← Will be slow!
```

**Step 2.5.2: Common Response Issues**
```
Issue 1: Returning all data instead of paginated
Fix: Implement pagination (limit, offset)

Issue 2: Including unnecessary fields
Fix: Implement data selection (?fields=id,name)

Issue 3: GZip compression disabled
Fix: Enable gzip compression in Cloud Run

Issue 4: Wrong region (request crosses continents)
Fix: Use regional endpoints
```

**Step 2.5.3: Compress Response**
```bash
# Enable gzip in Cloud Run:
gcloud run services update school-erp-api-production \
  --set-env-vars COMPRESSION=gzip

# Verify:
curl -H "Accept-Encoding: gzip" https://api.school-erp.local/api/v1/reports \
  -I | grep Content-Encoding
# Should see: Content-Encoding: gzip
```

---

### Phase 3: Validate Fix (5 minutes)

**Step 3.1: Deploy to Staging First**
```bash
# Push fix to staging branch:
git checkout -b fix/performance-optimization
git commit -m "Performance: Fix N+1 query, add index"
git push origin fix/performance-optimization

# Create PR, get approval, merge
```

**Step 3.2: Test Performance on Staging**
```bash
# Run load test:
npm run load-test:staging

# Expected output:
# P50 latency: 150ms (vs 500ms before)
# P99 latency: 400ms (vs 2000ms before)
# Success rate: 99.9%
```

**Step 3.3: Deploy to Production**
- Follow RB-001: Deployment runbook
- Monitor metrics for 5 minutes post-deploy

**Step 3.4: Verify Production Performance**
```bash
# Monitor dashboard:
# ✅ Latency dropped to <200ms
# ✅ CPU usage <50%
# ✅ Memory stable

# User testing:
# ✅ Dashboard loads fast
# ✅ Reports generate quickly
```

---

## 🐛 Additional Debugging Tools

**Node.js Profiling:**
```bash
# CPU profiling:
node --prof app.js
# Then analyze:
node --prof-process isolate-XXX.log > profile.txt
```

**Database Query Analysis:**
```bash
# CloudSQL slow query log:
gcloud sql operations list --instance school-erp-prod-db

# Or enable slow query logging:
gcloud sql instances patch school-erp-prod-db \
  --database-flags=slow_query_log=on,long_query_time=1
```

**Firestore Real-Time Monitoring:**
```bash
# Watch firestore operations live:
gcloud firestore operations list --database=production

# Stream logs with matching:
gcloud run logs read --service school-erp-api-production \
  --follow \
  --grep "latency"
```

---

## 📞 Escalation

**If bottleneck found but fix unclear (>15 min):**
- Tag Backend Lead in analysis
- Discuss potential fixes
- Get second opinion on optimization approach

**If performance still bad after fix (>20 min):**
- Escalate to Lead Architect
- Consider architectural change (not just optimization)
- May need data model redesign

---

## 📈 Performance Baseline

**Target metrics for School ERP:**
| Operation | Target | Alert |
|-----------|--------|-------|
| API response | <200ms p95 | >500ms |
| Report generation | <5 sec | >10 sec |
| Dashboard load | <2 sec | >5 sec |
| Firestore read | <50ms | >200ms |
| Database query | <100ms | >500ms |

---

## 📁 Performance Optimization Checklist

When optimizing, verify:
- [ ] Slow query identified (not guesswork)
- [ ] Fix tested on staging with metrics
- [ ] No regression in other operations
- [ ] Monitoring alerts updated if needed
- [ ] Documentation of change added
- [ ] Team notified of optimization

---

## 📝 Performance Debug Log

Log all performance issues and fixes:

| Date | Issue | Root Cause | Fix | Result | Deploy |
|------|-------|-----------|-----|--------|--------|
| 2026-04-09 | Slow reports | N+1 query | Added batch | 500ms→50ms | ✅ |

---

## 📚 Related Runbooks

- [RB-001: Deployment](RB-001-Deployment.md)
- [RB-002: Incident Response](RB-002-Incident-Response.md)
- [RB-005 v2: Advanced DB Optimization](../advanced/RB-Advanced-DB-Optimization.md)

---

## 👥 Ownership

**Process Owner:** Backend Agent + Data Agent  
**Last Updated:** April 9, 2026  
**Review Frequency:** Quarterly  
**Next Review:** July 9, 2026
