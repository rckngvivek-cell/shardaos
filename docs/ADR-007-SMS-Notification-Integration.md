# ADR-007: SMS Notification Integration

**Status:** ACCEPTED  
**Date:** April 14, 2026  
**Deciders:** Backend Agent, Product Agent, Lead Architect  
**Consulted:** DevOps Agent, QA Agent, Data Agent  
**Informed:** All agents

## Context

Week 5 requires SMS notification capability to notify parents of attendance, grades, and announcements. Pilot schools rank SMS notifications as #3 priority (8/10 importance) for parent engagement.

**Requirements:**
- Send SMS to parent phones (India-focused: +91 numbers)
- 4 message templates: attendance, grades, announcements, fee reminders
- Delivery tracking and audit logging
- Rate limiting (5 SMS/hour per phone to prevent spam)
- Cost tracking (budget monitoring)
- Fallback to email if SMS fails
- SMS logs stored for compliance

**Constraints:**
- Budget: ₹0.50-₹1.00 per SMS
- Delivery SLA: 95%+ within 30 seconds
- Compliance: TRAI regulations (Do Not Call registry)

## Decision

**We adopt Twilio** for SMS delivery, with Firebase Cloud Tasks for reliable delivery and Redis for rate limiting.

### Rationale

#### 1. Twilio Advantages

| Criteria | Twilio | AWS SNS | Firebase |
|----------|--------|---------|----------|
| **India Support** | ✅ Full | ✅ Full | ✅ Full |
| **Pricing** | ₹0.50/SMS | ₹1.25/SMS | ₹0.80/SMS |
| **Reliability** | 99.95% | 99.9% | 99.5% |
| **Tracking** | Detailed webhooks | Basic | Basic |
| **Documentation** | Excellent | Good | Good |
| **SDKs** | All langs | All langs | Limited |
| **Support** | 24/7 | AWS support | Firebase support |
| **Learning curve** | Low | Medium | Low |

**Cost Advantage:** Twilio ₹0.50/SMS vs AWS SNS ₹1.25/SMS = **60% savings**  
**Expected Volume:** 2,500 users × 5 SMS/week = ~12,500 SMS/week = ₹6,250/week = **₹26K/month**

#### 2. Firebase Cloud Tasks Ensures Delivery

Unlike direct API calls, Cloud Tasks provide:
- Automatic retry with exponential backoff
- Dead-letter queue for failed messages
- Delivery tracking and monitoring
- At-least-once delivery guarantee

```
Schema:
┌─ Event (student marked present) ──┐
│                                   │
▼                                   ▼
├─ Check rate limit (Redis)    Send email (Firebase)
├ ─ Compose message (template)
├─ Enqueue task (Cloud Tasks)
└─ Log event (Firestore)
                 │
                 ▼
         ┌─ Retry queue (24h)
         ├─ Webhook callback (Twilio)
         ├─ Deliver status (Firestore)
         └─ De-duplicate sending
```

#### 3. Rate Limiting Prevents Abuse

Redis-backed rate limiter per phone number:

```typescript
// Rate limit: 5 SMS per hour per phone
const rateLimiter = new RateLimiter(redis);
const key = `sms:${phoneNumber}`;
const count = await rateLimiter.increment(key, 3600); // 1 hour window

if (count > 5) {
  // Queue for next hour or fall back to email
}
```

Prevents parent complaint spam, reduces costs.

## Implementation Details

### Technology Stack

```json
{
  "dependencies": {
    "twilio": "^4.x",
    "@google-cloud/tasks": "^4.x",
    "redis": "^4.x",
    "ioredis": "^5.x",
    "node-cache": "^5.x"
  }
}
```

### API Integration

```typescript
// apps/api/src/services/smsService.ts

import twilio from 'twilio';
import { CloudTasksClient } from '@google-cloud/tasks';

interface SendSMSRequest {
  templateType: 'attendance' | 'grade' | 'announcement' | 'fee';
  recipient: {
    phoneNumber: string; // +91XXXXXXXXXX
    parentName: string;
  };
  data: {
    studentName: string;
    [key: string]: any;
  };
  schoolId: string;
  priority?: 'high' | 'normal' | 'low';
}

class SMSService {
  private twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  private cloudTasksClient = new CloudTasksClient();
  private rateLimiter = new RateLimiter(redis);

  async sendSMS(request: SendSMSRequest): Promise<void> {
    // 1. Check rate limit
    const rateLimitKey = `sms:${request.recipient.phoneNumber}`;
    const count = await this.rateLimiter.increment(rateLimitKey, 3600);
    
    if (count > 5) {
      // Fall back to email
      await emailService.send({
        to: request.recipient.email,
        template: request.templateType,
        data: request.data
      });
      return;
    }

    // 2. Render message from template
    const message = this.renderTemplate(
      request.templateType,
      request.data
    );

    // 3. Enqueue delivery task
    const task = this.buildTask({
      phoneNumber: request.recipient.phoneNumber,
      message,
      scheduledTime: new Date(),
      schoolId: request.schoolId,
      priority: request.priority || 'normal'
    });

    const queuePath = this.cloudTasksClient.queuePath(
      process.env.GCP_PROJECT_ID,
      'us-central1',
      'sms-delivery'
    );

    await this.cloudTasksClient.createTask({ parent: queuePath, task });

    // 4. Log attempt
    await firestoreDB.collection('sms_logs').add({
      phoneNumber: request.recipient.phoneNumber,
      template: request.templateType,
      status: 'queued',
      createdAt: new Date(),
      schoolId: request.schoolId
    });
  }

  // Cloud Task worker processes messages
  async processSMSTask(request: ProcessSMSTaskRequest): Promise<void> {
    try {
      const response = await this.twilioClient.messages.create({
        body: request.message,
        from: process.env.TWILIO_PHONE_NUMBER, // +1234567890 (international)
        to: request.phoneNumber
      });

      // 5. Log delivery success
      await firestoreDB.collection('sms_logs').doc(response.sid).set({
        twilioMessageSid: response.sid,
        status: 'sent',
        deliveredAt: new Date(),
        cost: 0.50 // ₹ per SMS
      }, { merge: true });

    } catch (error) {
      // Log failure, Cloud Tasks handles retry
      await firestoreDB.collection('sms_logs').updateOne(
        { status: 'failed', error: error.message }
      );
      throw error; // Triggers Cloud Tasks retry
    }
  }

  private renderTemplate(
    type: string,
    data: Record<string, any>
  ): string {
    const templates: Record<string, string> = {
      attendance: `Hello {parentName}, {studentName} was marked {status} today.`,
      grade: `Hello {parentName}, {studentName} scored {marks} in {subject}.`,
      announcement: `School announcement: {message}`,
      fee: `Hello {parentName}, school fee of ₹{amount} is due on {dueDate}.`
    };

    let message = templates[type] || '';
    Object.entries(data).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
    return message;
  }
}
```

### Message Templates (4 Types)

```yaml
templates:
  attendance:
    en: "Hi {parentName}, {studentName} was marked {status} today. Attendance: {percentage}%"
    hi: "नमस्ते {parentName}, {studentName} को आज {status} चिह्नित किया गया था। उपस्थिति: {percentage}%"
    
  grade:
    en: "Hi {parentName}, {studentName} scored {marks}/{totalMarks} in {subject}. Grade: {grade}"
    hi: "नमस्ते {parentName}, {studentName} ने {subject} में {marks}/{totalMarks} अंक प्राप्त किए। ग्रेड: {grade}"
    
  announcement:
    en: "{schoolName}: {message}"
    hi: "{schoolName}: {message}"
    
  fee:
    en: "Hi {parentName}, school fee ₹{amount} is due on {dueDate}. {paymentLink}"
    hi: "नमस्ते {parentName}, स्कूल शुल्क ₹{amount} {dueDate} को देय है। {paymentLink}"
```

### Firestore Schema (Audit & Compliance)

```typescript
// Collection: sms_logs
{
  docId: "twilio_message_id",
  schoolId: string,
  parentPhone: string,
  parentName: string,
  studentId: string,
  templateType: 'attendance' | 'grade' | 'announcement' | 'fee',
  messageBody: string,
  messageMetadata: {
    length: number,
    language: string,
  },
  status: 'queued' | 'sent' | 'failed' | 'blocked',
  twilioResponse: {
    messageId: string,
    status: 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed',
    cost: number
  },
  timestamps: {
    queued: Date,
    sent: Date,
    delivered: Date
  },
  errorDetails?: {
    code: string,
    message: string
  },
  costTracking: {
    costInRupees: number,
    schoolId: string,
    month: string
  },
  compliance: {
    doNotCallCheck: boolean,
    consentRecord: string,
    retryCount: number
  }
}
```

## Consequences

### Positive
- ✅ 60% cheaper than AWS SNS (₹0.50 vs ₹1.25/SMS)
- ✅ Reliable delivery (99.95% + Cloud Tasks retry)
- ✅ Rate limiting prevents abuse
- ✅ Webhooks for delivery tracking
- ✅ Good documentation, community support
- ✅ Easy to add new message templates
- ✅ Audit trail for compliance

### Negative
- ⚠️ Twilio account dependency
- ⚠️ Must track SMS costs per school
- ⚠️ India-specific compliance (TRAI, DND registry)
- ⚠️ SMS delivery not guaranteed (carrier dependent)
- ⚠️ Twilert rate limits apply

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Vendor lock-in | Implement adapter pattern, easy to swap providers |
| Delivery failures | Cloud Tasks retry + fallback to email |
| Compliance violations | Validate against DND registry, audit all sends |
| Cost overruns | Set budget alerts, rate limiting, cost dashboard |
| Spam complaints | Template approval, unsubscribe mechanism, rate limiting |

## Cost Analysis

```
Monthly SMS Budget:
- Users: 2,500
- Schools: 13
- SMS/user/week: 5 (avg: attendance + grade + announcement)

Volume:
- 2,500 users × 5 SMS/week = 12,500 SMS/week
- 12,500 × 4 weeks = 50,000 SMS/month

Cost:
- 50,000 SMS × ₹0.50 = ₹25,000/month (~$300/month)
- Twilio account: Free tier up to ₹2,000/month
- Additional: ₹23,000/month (acceptable)
```

## Alternatives Considered

### 1. AWS SNS (Rejected)
- **Pros:** AWS ecosystem integration, reliable
- **Cons:** 2.5x more expensive, requires AWS SDK integration
- **Decision:** Cost is prohibitive for Indian startup, Twilio sufficient

### 2. Firebase Cloud Messaging (Rejected)
- **Pros:** Integrated with Firebase, free tier
- **Cons:** No SMS support (push only), not suitable for parent notifications
- **Decision:** Doesn't meet SMS requirement

### 3. Local SMS Gateway (Rejected)
- **Pros:** Potential cost savings, full control
- **Cons:** Requires SMPP protocol knowledge, carrier relationships, compliance complexity
- **Decision:** Too much operational overhead for MVP

## Success Metrics

- All 4 message templates working by Day 3
- 95%+ delivery success rate
- <5 second send latency (p99)
- SMS logs stored for all messages
- Cost tracking dashboard showing ₹0.50/SMS average
- 10+ tests covering rate limiting and templates

## References

- **PR #8:** SMS Notifications - WEEK5_PR_DETAILED_PLANS.md
- **Product Feedback:** Week 5 master plan - WEEK5_MASTER_PLAN.md
- **Error Handling:** SMS failure patterns - 8_ERROR_HANDLING.md
- **Monitoring:** SMS delivery metrics - 12_MONITORING_OBSERVABILITY.md

## Future Revisions

- **Week 6:** WhatsApp integration (similar provider)
- **Week 7:** SMS scheduling and batch campaigns
- **Week 8+:** Voice call notifications for critical alerts

