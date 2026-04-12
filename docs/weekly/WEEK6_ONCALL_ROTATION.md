# WEEK 6 ON-CALL ROTATION & ESCALATION PROCEDURES
**Authority:** Lead Architect + Project Manager  
**Period:** April 7 - April 13, 2026  
**Objective:** 24/7 monitoring, <30 min MTTR, zero critical incidents unresolved

---

## 📅 WEEK 6 ON-CALL SCHEDULE

### Primary On-Call (Main Responder - 24/7)
| Day | Date | Primary | Start | End | Phone | Slack |
|-----|------|---------|-------|-----|-------|-------|
| Mon | Apr 14 | DevOps Engineer #1 | 12:00 AM | 11:59 PM | +91-XXXXXXXXXX | @devops1 |
| Tue | Apr 15 | DevOps Engineer #1 | 12:00 AM | 11:59 PM | +91-XXXXXXXXXX | @devops1 |
| Wed | Apr 16 | DevOps Engineer #2 | 12:00 AM | 11:59 PM | +91-XXXXXXXXXX | @devops2 |
| Thu | Apr 17 | DevOps Engineer #2 | 12:00 AM | 11:59 PM | +91-XXXXXXXXXX | @devops2 |
| Fri | Apr 18 | Lead DevOps Architect | 12:00 AM | 11:59 PM | +91-XXXXXXXXXX | @lead-devops |

### Secondary On-Call (Backup Responder)
| Day | Date | Secondary | Role | Contact |
|-----|------|-----------|------|---------|
| Mon-Fri | Apr 14-18 | Backend Lead | Escalation | @backend-lead |

### Escalation Authority
| Level | Name | Role | Contact | Response Time |
|-------|------|------|---------|----------------|
| L3 | Lead Arch | Strategic Decisions | @lead-arch | 10 min |
| L4 | Project Manager | Executive | @pm | 15 min |

---

## 🚨 ALERT RESPONSE PROCEDURES

### Level 1: On-Call Engineer
**Trigger:** Any alert  
**SLA:** 2 minute response  
**Actions:**
1. Acknowledge alert in PagerDuty within 30 seconds
2. Review alert details + dashboard
3. Execute appropriate runbook
4. Update Slack #incident with status

**Escalation criteria:**
- Cannot reproduce issue
- Needs database expertise
- Requires architectural decision
- >10 minute investigation with no progress

### Level 2: Secondary On-Call (Backend Lead)
**Trigger:** L1 unable to resolve  
**SLA:** 5 minute response  
**Actions:**
1. Join incident call with L1
2. Assist with backend troubleshooting
3. Check recent code deployments
4. Coordinate with backend team if needed

**Escalation criteria:**
- Issue requires infrastructure changes
- Suspected GCP service issue
- >30 minute outage with no progress

### Level 3: Lead Architect
**Trigger:** Critical outage >30 min  
**SLA:** 10 minute response  
**Actions:**
1. Take incident command
2. Make strategic decisions (rollback, failover, etc.)
3. Coordinate with GCP support if needed
4. Brief project manager

### Level 4: Project Manager
**Trigger:** Outage affecting customers >1 hour  
**SLA:** 15 minute response  
**Actions:**
1. Customer communication
2. Escalation authority
3. Executive briefing
4. Launch post-incident review

---

## 📋 ON-CALL CHECKLIST

### Start of Shift (On-Call Engineer)
- [ ] Phone charged, Slack notifications enabled
- [ ] VPN access verified
- [ ] Can access production dashboards
- [ ] PagerDuty app installed + configured
- [ ] Emergency runbooks nearby (printed or open in editor)
- [ ] GCP console access verified
- [ ] Cloud Run logs accessible
- [ ] Can SSH to bastion if needed

### During Shift
- [ ] Monitor #incident channel continuously
- [ ] Dashboard open at all times (tab in background)
- [ ] Respond to alerts within SLA
- [ ] Document all incidents in Slack thread
- [ ] Escalate when unsure
- [ ] Keep secondary on-call in loop

### End of Shift (Handoff)
- [ ] Brief incoming on-call on any open issues
- [ ] Update incident status board
- [ ] Document any ongoing problems
- [ ] Pass list of "watch items" to incoming
- [ ] Verify incoming can access all systems
- [ ] Confirm handoff in Slack

---

## 🎯 SUCCESS CRITERIA FOR ON-CALL

**Alert Response:**
- ✅ All alerts acknowledged within 2 minutes
- ✅ Runbook executed properly
- ✅ Incident resolved or escalated within 30 minutes
- ✅ Communication posted to #incident in real-time

**Incident Management:**
- ✅ MTTR averages <30 minutes for all incidents
- ✅ No critical incidents left unresolved >1 hour
- ✅ Root cause documented for all P0s
- ✅ Post-incident review completed within 24 hours

**Team Support:**
- ✅ Secondary never paged for preventable issues
- ✅ Lead architect paged only for >= P1 incidents
- ✅ All communication clear and timely
- ✅ On-call handoff smooth every shift

---

## 📞 CRITICAL PHONE NUMBERS

| Role | Name | Phone | Email | Slack |
|------|------|-------|-------|-------|
| On-Call Primary | [Name] | +91-XXXXX | name@schoolerp.com | @name |
| Backend Lead | [Name] | +91-XXXXX | name@schoolerp.com | @backend |
| Lead Arch | [Name] | +91-XXXXX | name@schoolerp.com | @lead |
| Project Manager | [Name] | +91-XXXXX | name@schoolerp.com | @pm |
| GCP Support Hotline | | 1-855-4-GOOGLE | support@google.com | N/A |

---

## 🔧 TOOLS & ACCESS REQUIRED

### Essential Access
- [ ] GCP Console (Project: school-erp-prod)
- [ ] Cloud Run services (all 3 regions)
- [ ] Cloud Monitoring dashboards
- [ ] Cloud Logging
- [ ] Firestore database
- [ ] BigQuery (for analytics)

### Communication Tools
- [ ] Slack (notifications enabled)
- [ ] PagerDuty (mobile + desktop)
- [ ] Email (GitHub notifications, alerts)
- [ ] Phone (SMS, calls)

### Runbooks & Documentation
- [ ] All 8 incident response runbooks memorized
- [ ] Cloud Run deployment commands memorized
- [ ] Failover procedure steps
- [ ] Escalation decision tree

---

## 📊 INCIDENT TRACKING TEMPLATE

Every incident should be logged in Slack thread #incident:

```
┌─ INCIDENT START ─────────────────────────┐
│ 
│ 🚨 INCIDENT #123
│ Start: 2026-04-15 14:32 IST
│ Duration: [To be updated]
│ Severity: 🔴 CRITICAL / 🟡 WARNING
│ 
│ 📋 Details:
│ - Issue: [Brief description]
│ - Alert: [Which alert fired]
│ - Runbook: [Which runbook executed]
│ - Status: [Current status]
│ 
│ 👤 Responders:
│ - On-Call: @devops1
│ - Escalated to: @backend-lead at 14:35
│ 
│ ✅ Resolution:
│ - Root cause: [Identified or TBD]
│ - Fix: [What did we do]
│ - Testing: [How was it verified]
│ - End: 2026-04-15 14:58 IST
│ - MTTR: 26 minutes ✅
│ 
│ 📝 Post-Incident:
│ - Review scheduled: [Date/Time]
│ - Action items: [List]
│ 
└──────────────────────────────────────────┘
```

---

## 🎓 ON-CALL TRAINING

### Required Before Going On-Call
- [ ] All 8 runbooks read and understood
- [ ] Dry run of failover procedure
- [ ] GCP console navigation practiced
- [ ] PagerDuty workflow reviewed
- [ ] Escalation decision tree memorized
- [ ] Slack notification channels identified
- [ ] Previous incident reviews studied
- [ ] Shadowed current on-call for 1 shift

### Monthly Review
- [ ] Runbooks updated with new procedures
- [ ] Lessons learned from previous month
- [ ] Tool access audited
- [ ] New team members introduced

---

## 🚑 EMERGENCY ESCALATION

### Scenario: Multiple Simultaneous Failures

**If 2 alerts triggered simultaneously:**
```
1. On-call responds to first (most critical)
2. Immediately escalate to backend lead
3. Backend lead handles second alert
4. Keep communication in #incident channel
5. Lead architect alerted at 5-minute mark
```

**If 3+ alerts triggered:**
```
1. Page all L2 resources immediately
2. Declare "INCIDENT MODE" in #incident
3. Lead architect takes incident command
4. Pause normal operations
5. All hands on deck for recovery
```

### Cascading Failure (Complete Service Down)
```
1. On-call: Page primary, secondary, lead, PM
2. Update status page to "Major Outage"
3. Execute REGION FAILOVER runbook
4. All 3 regions offline? Contact GCP support
5. Customer support posts in all channels
6. Communication every 5 minutes minimum
7. Keep press monitor active
```

---

## 📊 WEEK 6 SUCCESS METRICS

**Expected on-call metrics:**
- 0-5 incidents total (low number expected for stable week)
- Average MTTR: <20 minutes (aiming for <30)
- Alert response time: 100% within 2 minutes
- Escalation overrides: 0 (all runbooks sufficient)
- Customer impact: 0 (maintain 99.95% uptime)

**Weekly Report (Friday 5 PM):**
- Total incidents: X
- Critical (P0): X
- Mean Time To Resolution: Y minutes
- Mean Time To Acknowledgement: Z minutes
- Most common issue: [Root cause analysis]
- Improvements for next week: [Actionable items]

---

## 🔐 SECURITY & COMPLIANCE

### On-Call Access
- All access logs reviewed weekly
- VPN usage audited
- Database queries logged
- Code access tracked

### Communication Security
- Slack conversations retained per policy
- PagerDuty audit trail preserved
- Incident documentation in tickets
- No sensitive data in public channels

### Post-Incident Privacy
- Customer details removed before sharing
- Internal discussion details retained
- RCA findings documented
- Corrective actions tracked

---

## 🎖️ ON-CALL RECOGNITION

**Performance Bonuses (April 18):**
- Zero critical incidents: 5,000₹ bonus
- MTTR <30 minutes for all incidents: 3,000₹ bonus
- All alerts acknowledged within 2 min: 2,000₹ bonus
- Runbook improvements identified: 1,000₹ bonus

**Recognition:**
- Fastest incident resolution highlighted
- Best documentation nominated
- Excellent escalation decisions commended
- Model on-call engineer of the month

---

**Document Created:** April 9, 2026  
**Effective Date:** April 14, 2026  
**Review Date:** April 25, 2026 (Post-Week 6)  
**Version:** 1.0

