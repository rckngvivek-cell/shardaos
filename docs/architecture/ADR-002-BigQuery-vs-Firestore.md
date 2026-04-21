# ADR-002: BigQuery for Analytics Instead of Firestore Datastore Queries

**Date:** April 9, 2026  
**Status:** Approved  
**Authors:** Data Agent, Lead Architect  
**Stakeholders:** Data Team, Backend Team, Product Team, School Leaders

---

## Context

**Background:** The School ERP generates significant analytics data: student attendance, exam marks, fee collections, teacher workload, etc. We needed a data warehouse decision for business reporting, insights, and KPIs.

**Problem Statement:** How do we provide fast, scalable analytics for 100+ schools while maintaining operational agility?

**Constraints:**
- Must generate reports for 50+ school leaders simultaneously (morning peak)
- Report queries must return <5 seconds (admin dashboard usability)
- Need historical data for trend analysis (year-on-year comparisons)
- Budget constraints on data infrastructure
- Small data team (1 person initially)

**Driving Factors:**
- Week 5 showed complex queries timing out on Firestore
- Need <2 second dashboard load (competition requirement)
- School admins want ad-hoc reporting capability
- Week 7 needs real-time dashboards for school success tracking

---

## Decision

**Chosen:** Google BigQuery as primary data warehouse + Firestore as operational database.

**Why:** BigQuery solves reporting problems while keeping operational data in Firestore:
1. **Speed:** Complex queries return in <2 seconds (vs 20-30s on Firestore)
2. **Scalability:** Analyzes terabytes instantly (doesn't degrade with data size)
3. **Cost:** ~₹500/month for school analytics queries (vs ₹5000+/month for Firestore at scale)
4. **SQL standard:** Familiar to all team members, easy migrations
5. **Real-time sync:** Cloud Functions stream data from Firestore → BigQuery (milliseconds)
6. **Built-in machine learning:** Can forecast retention, identify at-risk students
7. **Compliance:** Data warehouse model helps with regulatory requirements (audit logs)

**Alternatives Considered:**

1. **Firestore native queries (current approach)**
   - ✅ Zero additional infrastructure
   - ✅ Same codebase (Firebase SDK)
   - ❌ P99 latency: 20-30 seconds for complex queries
   - ❌ Doesn't scale past 100K records efficiently
   - ❌ Ad-hoc queries very costly (compound queries)

2. **Firebase Realtime Database with manual sync**
   - ❌ Less flexible than Firestore
   - ❌ Still can't handle analytics at scale
   - ❌ Manual sync is error-prone

3. **PostgreSQL data warehouse (self-managed)**
   - ✅ Full control
   - ❌ Requires database administration skills
   - ❌ Hidden cost: backup, scaling, monitoring (~₹30K/month effort)
   - ❌ Team doesn't have PostgreSQL expertise (Firebase-first team)

4. **Amazon Redshift or Snowflake**
   - ✅ Powerful analytics
   - ❌ Higher cost than BigQuery
   - ❌ Increases GCP → AWS complexity
   - ❌ Overkill for K-12 market

5. **Continue with Firestore only**
   - ✅ Simplest - no new tools
   - ❌ Performance cliffs at 500K records
   - ❌ Kills dashboard competitive advantage
   - ❌ Expensive after 1000+ schools

**Trade-offs:**
- Gaining: Lightning-fast analytics, compliance-ready, scalable insights, competitive dashboards
- Sacrificing: Operational simplicity (adds 1 new tool), requires ETL pipeline from Firestore

---

## Implementation

**Implementation approach:**
1. Create BigQuery dataset: `school_analytics`
2. Auto-sync Firestore → BigQuery via Cloud Functions on write
3. Create materialized views for common report queries
4. Build dashboard SQL queries (cached results)
5. Audit logging: all data access logged for compliance

**Timeline:**
- Week 6 (Current): Analytics schema + sync pipelines deployed
- Week 7: School leader dashboards powered by BigQuery
- Week 8+: ML models for student success prediction

**Owner:** Data Agent

**Dependencies:**
- ✅ BigQuery dataset created
- ✅ Cloud Functions for Firestore → BigQuery sync
- ✅ Data pipeline configuration
- ✅ Teacher training data available (per PR #12)

**Success Criteria:**
- ✅ Dashboard loads in <2 seconds (vs current 10-15s)
- ✅ Complex reports return <5 seconds
- ✅ Cost <₹750/month (including storage + queries)
- ✅ 99% query success rate
- ✅ Real-time sync with <5 second latency

---

## Consequences

### Positive Outcomes
- ✅ **Dashboard speed:** <2 second loads (vs 15s on Firestore)
- ✅ **Admin happiness:** Ad-hoc reporting possible (drag-drop)
- ✅ **Compliance ready:** Full audit trail of data access
- ✅ **Cost predictable:** ₹500/month base vs unpredictable Firestore costs
- ✅ **Competitive advantage:** Real-time insights no competitor has
- ✅ **School success:** Data-driven insights drive student outcomes
- ✅ **ML ready:** Can build predictive models without migration

### Negative Outcomes / Risks
- ⚠️ **ETL reliability:** Firestore → BigQuery sync can lag (mitigated by Cloud Functions)
- ⚠️ **Data freshness:** 5-10 second delay from event to analytics (acceptable for K-12)
- ⚠️ **Additional tool:** Team learns new tool (offset by speed/cost benefits)
- ⚠️ **Schema evolution:** Structural changes require pipeline updates

### Long-term Impact
- **Maintenance burden:** Low (managed service, auto-scaling)
- **Scalability:** ✅ Scales to 1000+ schools without query slowdown
- **Team learning curve:** Medium (SQL familiar, BigQuery-specific patterns new)
- **Data insights:** 📈 Exponential (enables new use cases impossible with Firestore)

---

## Related Decisions

- Relates to: [ADR-001] Cloud Run for compute
- Relates to: [ADR-003] Firestore replication for operational database
- Relates to: [ADR-004] SMS + Push notifications dual-channel
- Supersedes: [ADR-XX] Previous Firestore-only analytics approach

---

## Approval

- [✅] Lead Architect (April 9, 2026)
- [✅] Data Agent (April 9, 2026)
- [✅] Backend Lead (April 9, 2026)
- [✅] Product Manager (April 9, 2026)

---

## References

- [BigQuery Docs](https://cloud.google.com/bigquery/docs)
- [Firestore → BigQuery Sync](../24_DATA_PLATFORM.md)
- [Cost Analysis](../40_DATA_ANALYTICS_STRATEGY_PART3.md)
- [Dashboard Architecture](../Complete_Multi_Level_Dashboard_System.md)
