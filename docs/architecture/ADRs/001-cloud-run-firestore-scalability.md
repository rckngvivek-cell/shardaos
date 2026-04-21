# ADR 001: Cloud Run + Firestore Scalability Architecture

**Status:** ACCEPTED (April 9, 2026)  
**Decision Maker:** Lead Architect  
**Date:** April 9, 2026  
**Affected Layers:** Compute, Database, API Gateway  

---

## Problem Statement

Scale school ERP SaaS from 8 pilot schools (2,000 users) to 100+ schools (50,000+ users) while maintaining:
- <400ms API response times (p95)
- 99.95%+ uptime SLA
- Linear cost scaling (no performance cliffs)
- Sub-second report generation

**Constraints:**
- India-first deployment (latency, regulatory compliance)
- Limited DevOps expertise (need managed services)
- Budget conscious (shared infrastructure cost-effective)

---

## Decision

**Use Cloud Run + Firestore + Redis as primary scalability strategy through Week 10.**

### Architecture Components

```
┌─────────────────┐
│  Client Apps    │   React Web, React Native
├─────────────────┤
│  Cloud Armor    │   DDoS + rate limiting
├─────────────────┤
│  Cloud Load     │   Auto-scale + health checks
│  Balancer       │
├─────────────────┤
│  Cloud Run      │   0-10,000 concurrent requests
│  (0-50 replicas)│   Auto-scales both ways
├─────────────────┤
│  Firestore      │   Single region + backups
│  (asia-south1)  │   Multi-region read replicas (future)
├─────────────────┤
│  Cloud Memstore │   Redis cluster for:
│  (Redis 6.0)    │   - Report caching
│                 │   - Session tokens
│                 │   - Rate limit counters
├─────────────────┤
│  Cloud Tasks    │   Async jobs (report gen, emails)
│  Cloud Scheduler│   Periodic sync jobs
└─────────────────┘
```

### Scaling Tiers

| Schools | Users | Cloud Run | Firestore | Redis | Cost/Month |
|---------|-------|-----------|-----------|-------|-----------|
| 8-15 | 2-5k | 2-5 replicas | On-demand | 1GB | ₹40-50k |
| 15-50 | 5-15k | 5-15 replicas | On-demand → Reserved | 5GB | ₹80-120k |
| 50-200 | 15-50k | 15-50 replicas | Reserved capacity | 10GB | ₹200-300k |
| 200+ | 50k+ | MIGRATE TO GKE | Shard by school | 25GB+ | $5k+/mo |

---

## Rationale

### Why Cloud Run (vs. App Engine / GKE)?

**Cloud Run Advantages:**
- ✅ **Zero-to-full in 2 seconds** (faster cold start than App Engine)
- ✅ **Pay-per-request** ($0.00001667 per request + CPU/memory)
- ✅ **Automatic scaling** (0→50 replicas, triggers within 30 seconds)
- ✅ **No server management** (managed by Google)
- ✅ **Container-based** (Docker compatible for future GKE migration)

**Trade-offs:**
- ⚠️ Cold starts 1-3 seconds (acceptable for mobile apps)
- ⚠️ Max timeout 60 minutes (reports completed async)
- ⚠️ Limited to 32 GB RAM per instance (use Cloud Tasks for heavy jobs)

**Decision:** Cloud Run adequate until 200+ schools. GKE migration triggers Week 9.

### Why Firestore (vs. PostgreSQL / Datastore)?

**Firestore Advantages:**
- ✅ **Zero-operational database** (no backups, replication, or patching)
- ✅ **Multi-region read replicas** (Asia-south1 primary + secondary in us-central1)
- ✅ **Real-time listeners** (WebSocket sync for family tree updates)
- ✅ **Atomic transactions** (prevents enrollment double-entries)
- ✅ **Offline-first SDKs** (mobile app works without network)

**Trade-offs:**
- ⚠️ Query limitations (no arbitrary joins, must denormalize)
- ⚠️ Sharding required at scale (500k+ documents per collection)
- ⚠️ Pricing per read/write (not per CPU hour)

**Decision:** Firestore optimal for India-first SaaS. Denormalization strategy documented in [ADR-005].

---

## Scaling Decision Points

### 🟢 Green (Current): Cloud Run + Firestore adequate

**Metrics:**
- <50 concurrent users per school
- Reports generate <400ms
- Firestore queries <100ms p95
- Cloud Run CPU <60%, memory <70%

**Action:** Continue current architecture. Monitor weekly.

### 🟡 Yellow (Week 7-8): Approaching limits

**Metrics:**
- >100 concurrent users system-wide
- Firestore reads >5M/day
- Cloud Run memory >75% consistently
- Report generation >500ms p95

**Action:** Start GKE planning, increase Redis tier, implement query result caching.

### 🔴 Red (Week 9+): Migrate to GKE

**Metrics:**
- > 100 schools, 50k+ users
- Firestore at capacity tier limit
- Cloud Run hitting <30 replica overhead
- Revenue >₹100L ARR (business justifies complexity)

**Action:** Execute GKE migration (planned Week 9-10).

---

## Failure Modes & Mitigations

| Failure Mode | Probability | Impact | Mitigation |
|---|---|---|---|
| Cloud Run cold starts >3s | MEDIUM | Users see slow load | Keep 2 warm replicas always |
| Firestore quota exceeded | LOW | Unable to write data | Pre-sized capacity + alerts at 80% |
| Redis eviction during spike | LOW | Cache misses, slower reports | Over-provision to 2x peak need |
| asia-south1 region outage | LOW | 15 min downtime | Failover to us-central1 (manual) |
| DDoS attack (10k req/sec) | LOW | API unavailable | Cloud Armor rate limit + block |

---

## Implementation Phases

### Phase 1 (Week 5 - COMPLETE):
- Deploy Cloud Run + Firestore
- Basic auto-scaling (0-10 replicas)
- Performance monitoring

### Phase 2 (Week 6 - IN PROGRESS):
- Redis cluster for report caching
- Advanced load testing (100 concurrent users)
- Failover procedure tested

### Phase 3 (Week 7-8 - PLANNED):
- Capacity planning for 50-200 schools
- Shard strategy documented (defer implementation)
- GKE pilot environment setup

### Phase 4 (Week 9-10 - PLANNED):
- Execute GKE migration
- Firestore sharding implementation
- Multi-region read replicas enabled

---

## Success Criteria

✅ **Week 6:** p95 API latency <400ms, 99.95% uptime  
✅ **Week 8:** 50 schools, 15k users, cost <₹300k/month  
✅ **Week 10:** 200+ schools ready without architecture rewrite  

---

## Review Date

**Next Review:** May 15, 2026 (Week 6 metrics + GKE planning approval)

---

## Related Decisions

- [ADR-002](./002-bigquery-analytics.md): Analytics database selection
- [ADR-003](./003-firestore-replication.md): Multi-region replication strategy
- [ADR-004](./004-rate-limiting-ddos-protection.md): DDoS + rate limiting
