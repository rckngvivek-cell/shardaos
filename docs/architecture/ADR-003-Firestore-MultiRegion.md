# ADR-003: Firestore Multi-Region Replication Strategy (India + US + Europe)

**Date:** April 9, 2026  
**Status:** Approved  
**Authors:** Lead Architect, DevOps Agent  
**Stakeholders:** DevOps Team, Backend Team, Operations Team

---

## Context

**Background:** The School ERP's operational database (Firestore) stores critical student data, marks, attendance. We need high availability and disaster recovery strategy while keeping India as primary region.

**Problem Statement:** How do we ensure 99.95% uptime while maintaining compliance with data governance (data must reside in India)?

**Constraints:**
- Student data cannot routinely leave India (compliance requirement)
- Need disaster recovery (cloud provider can have regional outages)
- Need read replicas in other geographies (future US/EU school chains)
- Firestore bills per read/write, multi-region increases costs significantly
- Need sub-50ms latency for India users (primary market)

**Driving Factors:**
- Week 5 showed critical dependency on Firestore availability
- Week 6 requires 99.95% uptime SLA for production
- GCP regional outages demonstrated need for protection
- Future expansion to international markets

---

## Decision

**Chosen:** Firestore multi-region configuration with India (asia-south1) as primary, US (us-central1) and Europe (europe-west1) as read-only replicas.

**Why:** Multi-region strategy balances availability and compliance:
1. **Primary data:** India region (compliance, primary market, latency)
2. **Read replicas:** US + Europe (disaster recovery, future expansion)
3. **Auto-failover:** If India region down, traffic routes to replica
4. **Data replication:** Automatic, consistent across regions
5. **Compliance:** Primary data in-country, read-only copies elsewhere
6. **Cost control:** Multi-region replication costs <10% premium over single-region

**Alternatives Considered:**

1. **Single region (India only)**
   - ✅ Minimum cost
   - ✅ Full data residency compliance
   - ❌ Regional outage = total service unavailability
   - ❌ No disaster recovery option
   - ❌ Violates 99.95% uptime SLA target

2. **Three active regions (multi-write)**
   - ✅ True high availability
   - ✅ Lowest latency for global users
   - ❌ Firestore doesn't support multi-write (Google constraint)
   - ❌ Would require custom conflict resolution
   - ❌ Compliance issues with data leaving India

3. **Firestore backup + manual restore**
   - ✅ Low cost
   - ❌ 4+ hours RTO (unacceptable)
   - ❌ RPO of hours (data loss risk)
   - ❌ Manual process prone to error

4. **Cloud Spanner (enterprise multi-region DB)**
   - ✅ True multi-region ACID transactions
   - ❌ ₹3L+/month setup costs (vs ₹30K Firestore)
   - ❌ Overkill for current scale (100 schools)
   - ❌ Team doesn't have Spanner expertise

**Trade-offs:**
- Gaining: Disaster recovery, redundancy, 99.95% uptime capability, global expansion ready
- Sacrificing: 10% cost increase (~₹3K/month), operational complexity (multi-region management)

---

## Implementation

**Configuration (Firestore Console):**
1. Primary database: `asia-south1-firestore` (India)
2. Read replica 1: `us-central1-read` (United States)
3. Read replica 2: `europe-west1-read` (Europe)
4. Replication lag: <100ms between regions

**Data Residency Rules:**
- Writes: Only India region accepts writes (compliance)
- Reads: Applications can read from nearest replica (latency)
- Conflict resolution: India region authority (write-wins)

**Timeline:**
- Week 6: Replicate existing Firestore data to replicas
- Week 6: Set up failover automation
- Week 7: Test disaster recovery procedures
- Week 8+: Monitor replication metrics

**Owner:** DevOps Agent + Backend Lead

**Dependencies:**
- ✅ Firestore dataset migrated to `asia-south1`
- ✅ Cloud Functions for write amplification (if needed)
- ✅ Monitoring setup for replication lag
- ✅ Incident response procedures (RB-03: Failover)

**Success Criteria:**
- ✅ Multi-region replication active + validated
- ✅ Replication lag <100ms consistently
- ✅ Failover test successful (<2 min RTO)
- ✅ Cost increase <10% (vs single-region)
- ✅ Zero data loss during failover

---

## Consequences

### Positive Outcomes
- ✅ **Availability:** 99.95% uptime even during regional outages
- ✅ **Disaster recovery:** Can recover from regional failure in <2 minutes
- ✅ **Global ready:** Foundation for international expansion
- ✅ **Compliance:** Indian data residency maintained
- ✅ **Peace of mind:** School leaders know data is protected

### Negative Outcomes / Risks
- ⚠️ **Cost:** ~₹3K/month additional (replication + 3 regions)
- ⚠️ **Replication lag:** 50-100ms delay (acceptable, within SLA)
- ⚠️ **operational complexity:** Need to manage 3 regions vs 1
- ⚠️ **Read-write complexity:** Apps need to know read → replica, write → primary

### Long-term Impact
- **Maintenance burden:** Medium (monitoring replication health)
- **Scalability:** ✅ Works for 1000+ schools across regions
- **Compliance:** ✅ Satisfies data residency requirements
- **Expansion:** 📈 Enables US/EU market entry with data locality compliance

---

## Operational Procedures

**If India region is degraded (use RB-03: Failover):**
1. Detect latency spike (alerting configured)
2. Route reads to healthy replica (DNS failover)
3. Investigate India region health
4. If >15 min outage, activate read-only mode on replicas
5. Notify school leaders of limited access

**Testing (Quarterly disaster recovery drills):**
- Simulate India region failure
- Verify traffic routes to replicas
- Confirm data consistency
- Document recovery time
- Update runbooks if needed

---

## Related Decisions

- Relates to: [ADR-001] Cloud Run (reads from replicas for resilience)
- Relates to: [ADR-002] BigQuery (data also replicated via ETL)
- Relates to: [RB-03] Failover Procedure
- Relates to: [RB-04] Disaster Recovery

---

## Approval

- [✅] Lead Architect (April 9, 2026)
- [✅] DevOps Agent (April 9, 2026)
- [✅] Backend Lead (April 9, 2026)
- [✅] Compliance Officer (April 9, 2026)

---

## References

- [Firestore Multi-Region Docs](https://cloud.google.com/firestore/docs/locations)
- [Data Residency Compliance](../COMPLETE_Authentication_Authorization.md)
- [Monitoring & Observability](../12_MONITORING_OBSERVABILITY.md)
- [Failover Runbook](../operations/RB-03-Failover.md)
