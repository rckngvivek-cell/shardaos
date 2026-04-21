# ADR-004: SMS + Push Notification Dual-Channel Strategy

**Date:** April 9, 2026  
**Status:** Approved  
**Authors:** Backend Agent, Product Agent  
**Stakeholders:** Backend Team, Product Team, School Leaders

---

## Context

**Background:** School ERP needs to notify parents about exam results, attendance alerts, fee reminders, and emergency notifications. India has diverse internet penetration: 60% urban (smartphone), 40% semi-urban/rural (feature phones, SMS).

**Problem Statement:** How do we reach 100% of parents with critical notifications despite diverse digital literacy and device access?

**Constraints:**
- 60% of parent users on smartphones (can receive push)
- 40% on basic phones or no smartphone (SMS only)
- Budget conscious: Can't afford expensive third-party services per notification
- Need 99% delivery rate for critical notifications (exam results, fees)
- Need instant delivery (real-time alerts for safety)

**Driving Factors:**
- Week 5 parent feedback: "Missed important alerts"
- Week 6 product goal: Increase parent engagement to 2,000+ users
- School leaders want guaranteed notification delivery
- Regulatory requirement: Fee reminders must reach parent

---

## Decision

**Chosen:** Dual-channel notification strategy:
- **Primary:** Push notifications via Firebase Cloud Messaging (FCM) for app users
- **Secondary:** SMS via Twilio for feature phone users
- **Fallback:** Email for users with neither channel

**Why:** Dual-channel ensures no one is left behind:
1. **Push (primary):** Fast (instant), rich (with images/actions), cheap (free after Firebase setup)
2. **SMS (secondary):** Reaches feature phones, higher open rates (80% vs 20% for email)
3. **Fallback chain:** Email if both fail (ensures delivery)
4. **Cost efficient:** ~₹2 per SMS (bulk) + free push
5. **User choice:** Let parents disable channels they don't want
6. **Analytics:** Track delivery/open rates per channel

**Alternatives Considered:**

1. **Push only (app-based)**
   - ✅ Cheapest (free)
   - ✅ Fastest (real-time)
   - ❌ Doesn't reach feature phone users (40% of base)
   - ❌ Misses rural schools entirely
   - ❌ Violates equity principle

2. **SMS only**
   - ✅ Universal reach (100%)
   - ❌ Cost: ~₹2 per notification = ₹2K/day for 1,000 notifications
   - ❌ Slow (5-10 second delay)
   - ❌ Limited formatting (text only)
   - ❌ Over-budget at scale (higher end of ₹20K+/month)

3. **Email only**
   - ✅ Cheapest (<₹0.01 per email)
   - ❌ Low open rate (20% vs 80% SMS, 60% push)
   - ❌ Critical alerts delayed (email filters)
   - ❌ Requires internet connection
   - ❌ Spam folder issues

4. **WhatsApp messaging (emerging alternative)**
   - ✅ High engagement (60%+ open rate)
   - ✅ Rich formatting available
   - ❌ WhatsApp Business API expensive (₹100+ per message)
   - ❌ Limited automation capability
   - ❌ WhatsApp can disable business accounts
   - ❌ Not available in all states yet

**Trade-offs:**
- Gaining: Universal reach (100% of parents), guaranteed delivery, high engagement
- Sacrificing: Operational complexity (3 channels), routing logic, cost (~₹5K/month for SMS)

---

## Implementation

**Architecture:**
```
Event (exam result, attendance, fee due)
  ↓
Cloud Function detects event
  ↓
Decision logic:
  - Has smartphone + app installed? → Push via FCM
  - No smartphone? → SMS via Twilio
  - Notification disabled? → Skip
  ↓
Send notification
  ↓
Log delivery status (retry if failed)
```

**Preferences (user-configurable):**
- Parents can choose: "Push only", "SMS only", "Both", "Disable all"
- Admins can force SMS for critical notifications (fees, safety)
- Default: Push + SMS (maximum reach)

**Cost Structure:**
- Push (FCM): Free (after Cloud Run setup)
- SMS (Twilio): ₹2 per message (bulk rate with credits)
- Email: <₹0.05 per message
- Total estimate: ₹5K/month at 1000 parent base

**Timeline:**
- Week 6: Implement dual-channel routing
- Week 6: User preferences UI
- Week 7: SMS provider contract + integration
- Week 7: Multi-language support (notifications in regional languages)

**Owner:** Backend Agent (with Product Agent requirement input)

**Dependencies:**
- ✅ Firebase Cloud Messaging setup (Week 3)
- ✅ Twilio account + API integration
- ✅ Notification content database
- ✅ User preference management (database schema)

**Success Criteria:**
- ✅ 95%+ delivery rate for all channels
- ✅ <5 second delivery for push notifications
- ✅ <30 second delivery for SMS (Twilio SLA)
- ✅ Cost <₹10K/month even at 5,000 parents
- ✅ User satisfaction: 80%+ prefer dual-channel

---

## Consequences

### Positive Outcomes
- ✅ **Universal reach:** 100% of parents informed (vs 60% push-only)
- ✅ **Higher engagement:** SMS open rates 80% vs email 20%
- ✅ **Guaranteed delivery:** Redundancy ensures critical alerts get through
- ✅ **Equity principle:** Rural users not excluded
- ✅ **Parent satisfaction:** "I get my alerts" is key NPS driver
- ✅ **Regulatory compliance:** Meets fee reminder requirements
- ✅ **Revenue impact:** Higher parent engagement = better school outcomes = customer stickiness

### Negative Outcomes / Risks
- ⚠️ **Cost:** ~₹5K/month for SMS at 1000 parents (manageable)
- ⚠️ **Spam risk:** Poor notification frequency could annoy parents
- ⚠️ **Routing complexity:** Needs careful logic to avoid duplicate notifications
- ⚠️ **Twilio reliability:** Dependent on third-party delivery SLA
- ⚠️ **Message duplication:** Risk if system retries without deduplication

### Long-term Impact
- **Maintenance burden:** Medium (monitoring dual channels)
- **Scalability:** ✅ Scales to 100,000 parents
- **Compliance:** ✅ Meets all regulatory notification requirements
- **Parent trust:** 📈 Critical for K-12 market (parents = decision makers)

---

## Governance

**Notification frequency limits (prevent spam):**
- Max 3 notifications per day per parent
- Batch non-urgent notifications into digest
- Parent can set quiet hours (no notifications 8 PM - 7 AM)

**Content guidelines:**
- Keep messages <160 characters (standard SMS)
- Use regional languages (auto-translate)
- Clear call-to-action (link to portal, reply format)

**Approval process:**
- School admin must approve notification templates
- Logs all notifications sent (audit trail)
- Parents can opt-out per notification type

---

## Related Decisions

- Relates to: [ADR-002] BigQuery (tracks notification engagement)
- Relates to: [ADR-005] Redis caching (notification template caching)
- Relates to: [RB-05] Incident Response (notification system failure)

---

## Approval

- [✅] Lead Architect (April 9, 2026)
- [✅] Backend Agent (April 9, 2026)
- [✅] Product Agent (April 9, 2026)
- [✅] School Partner (Pilot feedback) (April 9, 2026)

---

## References

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Notification System Design](../43_STAFF_PORTAL_TECHNICAL_SPECS.md)
- [Parent Portal Architecture](../21_FRONTEND_IMPLEMENTATION.md)
