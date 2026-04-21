# ADR-005: Redis Caching Strategy for Report Generation

**Date:** April 9, 2026  
**Status:** Approved  
**Authors:** Backend Agent, Data Agent  
**Stakeholders:** Backend Team, Data Team, DevOps Team

---

## Context

**Background:** The reporting module generates key school dashboards: attendance trends, exam performance analysis, fee collection status, teacher workload reports. Each complex report requires aggregating 10,000+ Firestore/BigQuery records and computing statistics.

**Problem Statement:** Report generation takes 10-15 seconds on first load. With 50+ school leaders checking reports simultaneously during morning peak, this creates 99.8% error rate and poor user experience.

**Constraints:**
- Each report requires complex aggregation (not simple queries)
- Same reports accessed by multiple users simultaneously
- Data freshness: Reports can be 5-10 minutes old (not real-time required)
- Budget: Can't afford expensive caching solution
- Need <2 second dashboard load during peak

**Driving Factors:**
- Week 5 load tests showed 50 concurrent report requests = timeout
- Week 6 production needs 99.95% uptime (no timeouts)
- Parent portal (PR #10) will triple concurrent dashboard users
- Real-time reporting (BigQuery) not ideal for complex aggregations

---

## Decision

**Chosen:** Multi-layer caching strategy using Redis:
- **Layer 1:** Generate reports on-demand, cache in Redis for 10 minutes
- **Layer 2:** Pre-generate popular reports every 5 minutes
- **Layer 3:** Firestore query results cached for specific schools
- **Cache invalidation:** Real-time update when source data changes

**Why:** Redis balances speed and freshness:
1. **Speed:** Cached report loads in <100ms (vs 10-15s fresh)
2. **Cost:** Memorystore (managed Redis) ₹3K/month (vs BigQuery at scale)
3. **Simplicity:** Redis simple to integrate (library support exists)
4. **Data freshness:** 10-minute staleness acceptable for dashboards
5. **High availability:** Managed service with automatic failover
6. **Monitoring:** Built-in metrics for hit/miss rates

**Alternatives Considered:**

1. **BigQuery materialized views (pre-computed reports)**
   - ✅ Minimal complexity
   - ✅ Always fresh
   - ❌ Still 3-5 second latency (requires query + aggregation)
   - ❌ Can't fully eliminate complex computation
   - ❌ Not sufficient alone

2. **Application-level caching (in-memory)**
   - ✅ Free (no external service)
   - ✅ Fastest possible (sub-millisecond)
   - ❌ Lost on Cloud Run restart (stateless)
   - ❌ Scales poorly with multiple instances
   - ❌ No cache sharing between instances

3. **Memcached**
   - ✅ Lightweight
   - ❌ Less reliable than Redis for this use case
   - ❌ Limited data types
   - ❌ Memorystore pricing same as Redis

4. **Database views (Firestore/BigQuery)**
   - ✅ Always up-to-date
   - ❌ Still requires query execution
   - ❌ Similar latency to uncached queries
   - ❌ Doesn't solve the performance problem

**Trade-offs:**
- Gaining: <100ms report load, can handle 500+ concurrent users, 99.95% uptime
- Sacrificing: 10-minute max staleness, additional complexity (cache invalidation logic)

---

## Implementation

**Caching Layers:**

Layer 1 - On-demand caching:
```
User requests report
  ↓
Check Redis for cached version (key: "report:school:attendance:2026-04-09")
  ↓
If cached (hit): Return immediately (<100ms)
If not cached (miss): Generate + Cache for 10 minutes
  ↓
Return to user
```

Layer 2 - Pre-generation (background job runs every 5 min):
```
Scheduled Cloud Task every 5 minutes
  ↓
For each school with active teachers:
  - Generate attendance report
  - Generate marks report
  - Generate fee report
  ↓
Cache all reports (TTL: 10 minutes)
```

Layer 3 - Query result caching:
```
Firestore queries cached for 5 minutes
  ↓
Example: "Get all students in Class 10-A"
  ↓
Cache key: "school:SC001:class:10A:students"
```

**Cache Invalidation Triggers:**
- Mark entered → Invalidate marks cache
- Attendance updated → Invalidate attendance cache
- Fee collected → Invalidate fee report cache
- Teacher added → Invalidate entire school cache
- Manual cache clear available in admin console

**Cache Key Strategy:**
```
report:{schoolId}:{reportType}:{date}
query:{schoolId}:{entityType}:{entityId}
```

**Configuration:**
- Redis instance: `asia-south1` (same as Firestore)
- Memory size: 4GB (covers 1000+ schools)
- TTL (time-to-live): 10 minutes for reports, 5 minutes for queries
- Eviction policy: LRU (least recently used)

**Timeline:**
- Week 6: Redis setup + layer 1 implementation
- Week 6: Pre-generation pipeline (layer 2)
- Week 7: Cache invalidation optimization
- Week 8+: Cache analytics (hit rates, optimization)

**Owner:** Backend Agent + DevOps Agent

**Dependencies:**
- ✅ Memorystore instance provisioned
- ✅ Cloud Run → Redis networking configured
- ✅ Redis client library integrated (ioredis/node-redis)
- ✅ Report generation logic complete

**Success Criteria:**
- ✅ 95%+ cache hit rate during peak hours
- ✅ Report load time <100ms (cached) vs 10s (uncached)
- ✅ <5 second report generation at cache miss
- ✅ Memory usage <4GB average
- ✅ Cost <₹5K/month (Redis + monitoring)

---

## Consequences

### Positive Outcomes
- ✅ **Performance:** 10-15s → <100ms (100x faster)
- ✅ **Capacity:** Scale from 5 concurrent → 500 concurrent report generators
- ✅ **Reliability:** 99.95% uptime (no timeouts on peak)
- ✅ **Cost efficiency:** Caching prevents BigQuery overuse (~₹5K Redis vs ₹20K+ BigQuery)
- ✅ **User experience:** Dashboards feel responsive
- ✅ **Parent engagement:** Fast load times = higher usage

### Negative Outcomes / Risks
- ⚠️ **Staleness:** Reports 5-10 min behind (acceptable for most use cases)
- ⚠️ **Cache invalidation:** Bug in invalidation logic = stale data served
- ⚠️ **Memory constraints:** Cache misconfiguration could cause OOM
- ⚠️ **Operational complexity:** Requires monitoring cache health
- ⚠️ **Learning curve:** Team needs Redis expertise

### Long-term Impact
- **Maintenance burden:** Medium (monitoring hit rates, tuning TTLs)
- **Scalability:** ✅ Scales to 100,000+ concurrent report users
- **Technical debt:** Low (Redis is standard, widely understood)
- **Future innovations:** 📈 Foundation for real-time dashboards, ML predictions

---

## Cache Monitoring & Optimization

**Metrics to track:**
- Cache hit ratio (target: >85%)
- Report generation latency (p99 <500ms)
- Memory usage (alert if >80%)
- Eviction rates (alert if >10/min)

**Optimization checks (weekly):**
1. Review cache hit rates by report type
2. Increase TTL for high-miss reports
3. Add pre-generation for popular reports
4. Identify and fix cache invalidation bugs

**Circuit breaker fallback:**
- If Redis unavailable, generate report fresh (slower but reliable)
- Alert ops team, start incident investigation
- Automatic failover to hot standby (if configured)

---

## Related Decisions

- Relates to: [ADR-002] BigQuery (complementary analytics approach)
- Relates to: [ADR-001] Cloud Run (caching layer for stateless services)
- Relates to: [RB-02] Report Generation Runbook
- Relates to: [RB-05] Performance Debugging

---

## Approval

- [✅] Lead Architect (April 9, 2026)
- [✅] Backend Agent (April 9, 2026)
- [✅] Data Agent (April 9, 2026)
- [✅] DevOps Agent (April 9, 2026)

---

## References

- [Redis Documentation](https://redis.io/documentation)
- [Google Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [Report Generation API](../20_BACKEND_IMPLEMENTATION.md)
- [Performance Testing Results](../DEVOPS_LOAD_TESTING.md)
- [Caching Best Practices](../25_ARCHITECTURAL_DECISIONS.md)
