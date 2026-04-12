# ADR-009: Parent Portal Authentication

**Status:** ACCEPTED  
**Date:** April 14, 2026  
**Deciders:** Lead Architect, Backend Agent  
**Consulted:** Frontend Agent, QA Agent, Security Specialist  
**Informed:** All agents

## Context

Week 5 requires a Parent Portal (MVP) to allow parents to view their children's attendance, grades, and announcements. Authentication must be simple, secure, and accessible to non-technical parents (many not smartphone savvy).

**Requirements:**
- Single sign-on for all children
- No password to remember (reduces support burden)
- Works on basic/feature phones (SMS fallback)
- Secure against common attacks (phishing, brute force)
- GDPR/COPPA compliant (parent-child data protection)
- <30 second login flow

**Parent Demographics:**
- India-based, diverse tech comfort level
- Primarily access via messaging apps + basic browsers
- Often share phones (family device)
- High password fatigue (forget credentials frequently)

**Technical Context:**
- Student portal uses Firebase Auth with Google/Microsoft OAuth
- Parent context different (no existing enterprise accounts)
- SMS is preferred communication channel (cheaper than email for India)

## Decision

**We adopt Email OTP (One-Time Password)** for parent portal authentication, with SMS as fallback.

### Rationale

#### 1. User Experience for Non-Technical Parents

| Method | Setup | Recovery | Accessibility | Tech Barrier |
|--------|-------|----------|----------------|-------------|
| **Email OTP** | Email on file | Click email reset | Universal | Very Low |
| **SMS OTP** | Phone on file | Relog to phone | Phone needed | Low |
| **Password** | Create & remember | Complex reset flow | Universal | Medium |
| **Social OAuth** | Link account | Account recovery | Requires account | High |
| **Biometric** | Device dependent | Phone data recovery | Phone needed | Medium |

Email OTP best balance: **No password to remember** + **Universal email access**.

#### 2. Cost Analysis

```
Monthly costs (1,000 parents):
- Email OTP: ₹0/month (email is free to send)
- SMS OTP: ₹500/month (1,000 logins × ₹0.50/SMS)
- Password reset emails: Included in email service
- Push notifications: ₹2,000/month alternative

Savings: ₹500/month vs SMS-only = ₹6,000/year
```

#### 3. Parent Privacy & Control

Parents prefer:
1. **Email OTP** - Secure, not sharing kids' data with SMS carriers
2. **SMS OTP** - Fast, doesn't require email
3. **Password** - Last resort, high forgetting risk

Email OTP respects privacy (no SMS logs shared with carriers).

#### 4. Security Posture

```
Attack Vector | Email OTP | SMS OTP | Password |
|---|---|---|---|
| Phishing | Moderate | High | High |
| Brute force | Low (6-min reset) | Low (rate limit) | High |
| Account takeover | Medium | Medium | High |
| SIM swap | N/A | High | N/A |
| Interception | Medium | High | High |
```

Email OTP + SMS fallback provides defense-in-depth without SMS-only weaknesses.

## Implementation Details

### Authentication Flow

```
┌─────────────────────────────────────┐
│ Parent opens portal                 │
│ (No login session)                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Enter email address                 │
│ "where@example.com"                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ System checks:                      │
│ ├─ Valid email format               │
│ ├─ Associated with school           │
│ └─ Not rate-limited                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Generate 6-digit OTP (valid 10 min) │
│ Send via Email: "Your code: 123456" │
│ Store in Redis with expiry          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Parent enters OTP                   │
│  [1][2][3][4][5][6]                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Verify OTP:                         │
│ ├─ Match against Redis              │
│ ├─ Check expiry                     │
│ ├─ Check rate limit (3 attempts)    │
│ └─ Delete OTP (one-time use)        │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
  Valid             Invalid
    │                 │
    ▼                 ▼
[Dashboard]    [Show error + resend]
```

### API Implementation

```typescript
// apps/api/src/routes/parentAuth.ts

import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const RequestOTPSchema = z.object({
  email: z.string().email(),
  schoolId: z.string().uuid()
});

const VerifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/)
});

const redis = getRedisClient();
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Step 1: Request OTP endpoint
app.post('/api/v1/parent/auth/request-otp', async (req, res) => {
  try {
    const { email, schoolId } = RequestOTPSchema.parse(req.body);

    // 1. Rate limiting: max 3 requests per hour
    const rateLimitKey = `parent:otp:request:${email}`;
    const requestCount = await redis.incr(rateLimitKey);
    
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 3600); // 1 hour expiry
    }
    
    if (requestCount > 3) {
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many OTP requests. Try again later.',
        retryAfter: 3600
      });
    }

    // 2. Verify parent exists in school
    const parentDoc = await db
      .collection(`schools/${schoolId}/parents`)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (parentDoc.empty) {
      // Don't reveal if email exists (security)
      return res.status(200).json({
        message: 'If email exists, OTP sent. Check your inbox.'
      });
    }

    // 3. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpKey = `parent:otp:${email}`;

    // Store in Redis with 10-minute expiry
    await redis.setex(otpKey, 600, otp);

    // 4. Send via Email
    await emailTransporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'School Portal - Login Code',
      html: `
        <h2>School Portal Login</h2>
        <p>Your one-time login code is:</p>
        <h1 style="letter-spacing: 2px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    // Log attempt
    await db.collection(`schools/${schoolId}/auth_logs`).add({
      type: 'otp_requested',
      email,
      timestamp: new Date(),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'OTP sent to email',
      expiresIn: 600 // seconds
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Verify OTP endpoint
app.post('/api/v1/parent/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = VerifyOTPSchema.parse(req.body);

    // 1. Check attempt rate limiting: max 3 attempts per OTP
    const attemptKey = `parent:otp:attempts:${email}`;
    const attempts = await redis.incr(attemptKey);

    if (attempts === 1) {
      await redis.expire(attemptKey, 600); // 10 minutes (same as OTP)
    }

    if (attempts > 3) {
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many failed attempts. Request a new code.'
      });
    }

    // 2. Retrieve stored OTP
    const storedOTP = await redis.get(`parent:otp:${email}`);

    if (!storedOTP) {
      return res.status(400).json({
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Request a new one.'
      });
    }

    // 3. Verify OTP matches
    if (storedOTP !== otp) {
      return res.status(401).json({
        error: 'INVALID_OTP',
        message: 'Incorrect code. Please try again.',
        attemptsRemaining: 3 - attempts
      });
    }

    // 4. Success: Delete OTP and create session
    await redis.del(`parent:otp:${email}`);
    await redis.del(attemptKey);

    // Fetch parent details
    const parentDoc = await db
      .collection('parents')
      .where('email', '==', email)
      .limit(1)
      .get();

    const parentData = parentDoc.docs[0].data();

    // Create JWT token
    const token = jwt.sign(
      {
        parentId: parentDoc.docs[0].id,
        email,
        schoolId: parentData.schoolId,
        role: 'parent'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Log successful login
    await db.collection(`schools/${parentData.schoolId}/auth_logs`).add({
      type: 'parent_login',
      parentId: parentDoc.docs[0].id,
      email,
      timestamp: new Date(),
      ipAddress: req.ip
    });

    res.cookie('parentToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      parent: {
        id: parentDoc.docs[0].id,
        email: parentData.email,
        name: parentData.name,
        childrenIds: parentData.childrenIds // Array of child IDs
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Step 3: SMS OTP Fallback (if email delivery fails)
app.post('/api/v1/parent/auth/request-otp-sms', async (req, res) => {
  try {
    const { email, schoolId, phone } = z.object({
      email: z.string().email(),
      schoolId: z.string().uuid(),
      phone: z.string().regex(/^\+91\d{10}$/) // Indian format
    }).parse(req.body);

    // Similar flow as email, but sends SMS
    const otp = crypto.randomInt(100000, 999999).toString();
    await redis.setex(`parent:otp:${phone}`, 600, otp);

    // Send SMS via Twilio
    await smsService.send({
      to: phone,
      body: `Your school portal login code is: ${otp}. Valid for 10 minutes.`
    });

    res.json({
      success: true,
      message: 'SMS OTP sent',
      expiresIn: 600
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Session Management

```typescript
// JWT token structure
{
  parentId: "parent-123",
  email: "parent@example.com",
  schoolId: "school-456",
  childrenIds: ["child-1", "child-2"],
  role: "parent",
  exp: 1650000000
}

// Middleware to verify parent token
async function verifyParentToken(req, res, next) {
  const token = req.cookies.parentToken || 
                req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.parent = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}
```

### Security Measures

```typescript
// Rate limiting per IP
const loginIpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  keyGenerator: (req) => req.ip,
  message: 'Too many login attempts from this IP'
});

// Password-less (so no password attacks)
// CSRF token on forms
app.use(csrf());
```

## Firestore Schema

```typescript
// Collection: schools/{schoolId}/parents
{
  docId: "parent-123",
  email: string,
  name: string,
  phone: string, // "+91XXXXXXXXXX"
  schoolId: string,
  childrenIds: string[], // Links to student documents
  status: "active" | "suspended",
  consentGiven: boolean,
  createdAt: Date,
  lastLogin: Date,
  preferences: {
    notificationChannel: "email" | "sms" | "both",
    language: "en" | "hi"
  }
}

// Collection: schools/{schoolId}/auth_logs
{
  type: "otp_requested" | "otp_verified" | "parent_login" | "logout",
  parentId?: string,
  email: string,
  timestamp: Date,
  ipAddress: string,
  userAgent: string
}
```

## Consequences

### Positive
- ✅ No password to remember/reset (reduced support burden)
- ✅ Accessible to non-technical parents
- ✅ Lower cost than SMS-only (free emails)
- ✅ Good security with rate limiting
- ✅ GDPR compliant (no unnecessary data storage)
- ✅ Audit trail via auth_logs
- ✅ Fast login process (<30s)

### Negative
- ⚠️ Relies on email delivery (sometimes goes to spam)
- ⚠️ No biometric factor (shared family devices vulnerable)
- ⚠️ OTP can be seen if email is shared
- ⚠️ Email interception risk (if ISP compromised)
- ⚠️ Parent must have email access

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Email delivery failure | SMS fallback, request resend after 5 min |
| Email spam folder | Use recognizable sender name, monitor deliverability |
| Shared email risks | Educate parents, offer SMS alternative, suggest child-specific email |
| OTP interception | HTTPS only, short expiry (10 min), pin display in email |
| Brute force | Rate limit per IP + per email, progressive delays |

## Alternatives Considered

### 1. SMS OTP Only (Rejected)
- **Pros:** Fast delivery, works on feature phones
- **Cons:** Higher cost (₹0.50 per OTP × 1000 parents = ₹500/month)
- **Decision:** Email OTP cheaper, same security with fallback

### 2. Password (Rejected)
- **Pros:** Standard, familiar to users
- **Cons:** Password fatigue, reset flow expensive, not suitable for non-technical parents
- **Decision:** OTP better for this demographic

### 3. Social Login (OAuth) (Rejected)
- **Pros:** One-click login, widely understood
- **Cons:** Requires social account (not all parents have), depends on external services
- **Decision:** Email OTP more inclusive

### 4. Biometric (Rejected)
- **Pros:** Very convenient, secure
- **Cons:** Requires smartphone, not accessible on shared devices
- **Decision:** Locked out poorer families on feature phones

## Success Metrics

- 95%+ email delivery success rate
- <30 second average login time
- <0.1% fraud attempts
- 10+ tests covering OTP generation, rate limiting, token verification
- SMS fallback working for failed emails

## References

- **PR #10:** Parent Portal MVP - WEEK5_PR_DETAILED_PLANS.md
- **Security Model:** Authentication & authorization - COMPLETE_Authentication_Authorization.md
- **Pilot Schools:** Parent feedback - WEEK5_MASTER_PLAN.md
- **Privacy:** GDPR compliance - 4_FIRESTORE_SECURITY_RULES.md

## Future Revisions

- **Week 6:** Biometric option for smartphone-capable parents
- **Week 7:** Parent account linking (multiple parents per student)
- **Week 8+:** Two-factor authentication (SMS alert on login from new device)

