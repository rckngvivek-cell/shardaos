# ADR 003: Multi-Region Firestore Replication Strategy

**Status:** ACCEPTED (April 9, 2026)  
**Decision Maker:** Lead Architect  
**Date:** April 9, 2026  
**Affected Layers:** Database, Disaster Recovery, Compliance  

---

## Problem Statement

Achieve 99.95% uptime SLA while maintaining data consistency and compliance for India-first deployment.

**Constraints:**
- 90% of users in India (need local low-latency access)
- 10% parent/staff in diaspora (US/EU access)
- Cannot exceed 100ms latency p95 globally
- Data localization laws (India data must stay in-country for primary storage)
- Recovery Time Objective (RTO): 5 minutes
- Recovery Point Objective (RPO): <1 minute

---

## Decision

**Single-region primary (asia-south1) + multi-region read replicas + automated failover to backup region.**

### Architecture Diagram

```
Primary Region (asia-south1, Mumbai)
┌──────────────────────────────────┐
│  Firestore Database              │
│  - All reads & writes            │
│  - RPO: 0 (strong consistency)   │
│  - RTO: N/A (primary)           │
│  - Compliance: India data law ✓  │
└──────────────────────────────────┘
         ↓
    Change Stream (Replication)
    ↓        ↓        ↓
    
Secondary Read Replicas:
- us-central1 (North America access)
- europe-west1 (EU access)
- asia-northeast1 (Backup failover)

Read-only, ~30 sec consistency lag
```

### Configuration Details

**Primary Region: asia-south1 (Mumbai)**
- Multi-availability zones (automatic)
- Hourly automatic backups (30-day retention)
- Change stream enabled (for replication)

**Read Replicas (Projected 2026 Q2):**

| Region | Purpose | Consistency | Read Latency | Cost Impact |
|--------|---------|-------------|---|---|
| us-central1 | US diaspora/support | Eventually (30-60s) | 80-100ms | +50% storage |
| europe-west1 | EU compliance | Eventually (30-60s) | 60-80ms | +50% storage |
| asia-northeast1 | Failover backup | Eventually (30-60s) | 40-50ms | +50% storage |

**Total Cost:** 4x primary storage = $100/month for 200 schools

---

## Rationale

### Why Multi-Region (vs. Single-Region)?

**Option A: Single-Region (Current - asia-south1 only)**
- Pros: Lowest cost, simplest ops, India compliance ✓
- Cons: asia-south1 outage = total outage
- Baseline uptime: 99.97% (acceptable, but risky)
- Decision: CURRENT STRATEGY through Week 8

**Option B: Multi-Region (Firestore backups + manual failover)**
- Pros: Faster recovery (RTO 5-15 min), compliance maintained
- Cons: Manual failover (1-2 min lag), stale data possible
- Achieves: 99.98% uptime (incremental gain)
- Timeline: Implement Week 8-9
- Decision: PLANNED FOR WEEK 8+

**Option C: Active-Active Multi-Region (Spanner, not Firestore)**
- Pros: Zero recovery time, instant failover
- Cons: Requires Google Cloud Spanner (expensive, more complex), overkill for current scale
- Cost: 3x premium over Firestore
- Decision: DEFER TO WEEK 15+ (100+ schools, ₹100L+ ARR)

### Selected Strategy: asia-south1 Primary + Backup Regions

**Why this approach?**

1. **India-First Compliance:**
   - Primary data stays in india-region (data localization compliant)
   - Only backups replicated outside
   - Avoids data sovereignty concerns

2. **Cost-Effective:**
   - Primary region fully utilized (minimal waste)
   - Replicas read-only (no replication write overhead)
   - Automatic sync via Firestore's native replication

3. **Incremental Adoption:**
   - Phase 1 (now): asia-south1 only, cost $10
   - Phase 2 (W8): Add us-central1 read replica, cost $15
   - Phase 3 (W10): Full multi-region + failover automation, cost $20

4. **Operational Simplicity:**
   - No custom sync logic (Firestore handles sharding)
   - Automated backups
   - One Click failover in GCP console

---

## Replication Strategy

### Real-Time Sync (Change Stream)

**How it works:**
1. Write to asia-south1 primary
2. Firestore Change Stream publishes event to Pub/Sub
3. Cloud Functions in each region read event
4. Write to regional read-replica (if exists)
5. ~30-60 second eventual consistency

**Code Example:**
```javascript
// Primary write
const schoolRef = db.collection('schools').doc(schoolId);
await schoolRef.update({ attendance_today: 450 });

// Change stream (automatic)
const stream = db.collection('schools')
  .onSnapshot((snapshot) => {
    // Publish to us-central1 replica
    pubsub.topic('replicate-school').publish(snapshot.docs[0]);
  });

// Replica updated within ~30 seconds
```

**Consistency Guarantees:**
- Primary (asia-south1): Strong consistency (< 100ms)
- Replicas: Eventual consistency (~30-60s)
- Acceptable for: Dashboards, read-heavy reports
- NOT acceptable for: Authorization checks (use primary always)

### Failover Procedure (Automated)

**Scenario: asia-south1 region becomes unavailable**

**Automatic Failover (RTO = 2 minutes):**
1. Health check detects asia-south1 down (Cloud Monitoring)
2. Traffic automatically routed to us-central1 replica
3. Cloud Functions redirects writes to temporary write-through cache
4. App continues reading from replica (slightly stale data)
5. Manual: Promote replica to primary (GCP one-click)

**Manual Recovery:**
1. Restore asia-south1 from automated backup (< 15 min)
2. Resync replica from restored primary
3. Failover back to primary

**Rollback:** 5 minutes (minimal downtime during failback)

---

## Data Consistency Model

### Write Path (Always to Primary)

```
Client (Mumbai) → Cloud Run (asia-south1) 
  → Firestore Write (primary) 
  → Immediate ACK to client

(async) Change Stream 
  → Pub/Sub 
  → Replicate to us-central1, europe-west1 (~30-60s)
```

**Guarantees:**
- Transaction atomicity (school enrollment doesn't double-count)
- No lost writes (durability to primary)
- Consistency to replicas within partition tolerance window

### Read Path (Preferential)

```
Client (Mumbai) → Priority: asia-south1 primary (0 lag)
                → Fallback: Nearest region replica (30-60s lag)
                → Last resort: Cache layer (up to 1 hour old)
```

**Configuration:**
```
// Smart routing rules
if (userLocation === 'india') {
  readFrom = 'asia-south1-primary'; // 0 ms lag
} else if (userLocation === 'us') {
  readFrom = 'us-central1-replica'; // 30-60s lag acceptable
} else {
  readFrom = 'nearest-replica'; // Auto-select
}
```

---

## Implementation Timeline

### Phase 1 (Current - Week 5-6):
- ✅ Primary: asia-south1 (Mumbai) in production
- ✅ Automated hourly backups (30-day retention)
- ✅ Baseline monitoring (uptime 99.97%)

### Phase 2 (Week 8-9):
- 🚧 Add read replicas (us-central1, europe-west1)
- 🚧 Configure Firestore replication
- 🚧 Test failover procedures
- 🚧 Deploy replica health monitoring

### Phase 3 (Week 10-11):
- ⏳ Automated failover triggers (alert at 50s, failover 2m)
- ⏳ Active-active failback
- ⏳ Compliance validation (data residency maintained)

### Phase 4 (Week 15+) - Optional:
- ⏳ Evaluate Spanner if revenue > ₹100L/month
- ⏳ Zero-downtime migration plan (if needed)

---

## Failure Modes & Mitigations

| Scenario | Probability | Impact | RTO | Mitigation |
|----------|---|---|---|---|
| asia-south1 down (region unavailable) | VERY LOW | API reads fail, high latency | 1-2 min | Read replicas active |
| asia-south1 Firestore service degraded | LOW | p95 latency >1s | 5-15 min | Auto-retry + replica failover |
| Replication pipeline broken (Change Stream) | LOW | Replicas stale >1 hour | 10 min to fix | Batch sync jobs as fallback |
| Data corruption in primary | MEDIUM | Silent data loss | 15 min restore | Point-in-time recovery from backups |
| Compliance violation (data leaves India) | CRITICAL | Legal/regulatory | Immediate | Read replicas read-only (no write) |

**Preventive Actions:**
- Week 6: Enable Cloud Audit Logs (track data access)
- Week 7: Test failover procedure (monthly drills)
- Week 8: Automated backup verification (restore test daily)

---

## Cost Analysis

### Phase 1 (asia-south1 only):
- Firestore storage: $25/month
- Automated backups: Built-in (no extra cost)
- **Total:** $25/month

### Phase 2 (Add 3 read replicas):
- Primary storage: $25/month
- 3 replicas × storage: $75/month
- Replication bandwidth: $20/month (Pub/Sub + functions)
- **Total:** $120/month
- **Cost increase:** 4.8x (offset by availability gain)

### For 200 schools by Week 8:
- Phase 1 cost: $0.13/school/month
- Phase 2 cost: $0.60/school/month
- Revenue per school: ₹50k/month (~$600)
- **Cost as % of revenue: 0.1%** ✅

---

## Success Criteria

✅ **Week 6:** asia-south1 primary production-ready, 99.97% uptime  
✅ **Week 8:** Read replicas deployed, <30-60s sync lag confirmed  
✅ **Week 10:** Automated failover tested monthly, RTO < 2 minutes  
✅ **Week 15:** Zero unplanned outages on replication layer  

---

## Related Decisions

- [ADR-001](./001-cloud-run-firestore-scalability.md): Primary infrastructure
- [ADR-004](./004-rate-limiting-ddos-protection.md): DDoS protection during failover
- [ADR-005](./005-staged-rollout-deployment.md): Canary deployment during failover

---

## Compliance Checklist

- ✅ India data localization (primary stays in asia-south1)
- ✅ GDPR-ready (replicas encrypted, audit logs)
- ✅ Cross-border data transfer documented (replicas for DR only)
- ✅ Recovery procedures SLA-compliant (RTO 5 min, RPO 1 min)
