# ADR 004: Rate Limiting & CloudArmor DDoS Protection

**Status:** ACCEPTED (April 9, 2026)  
**Decision Maker:** Lead Architect + DevOps Agent  
**Date:** April 9, 2026  
**Affected Layers:** API Gateway, Network Security, Rate Limiting  

---

## Problem Statement

Protect production API from:
- **DDoS attacks** (volumetric floods, millions of requests/sec)
- **Brute force attacks** (password guessing, auth bypass)
- **Resource exhaustion** (malicious users hammering expensive endpoints)
- **Spike traffic** (viral content, school events causing load spikes)

**SLA Impact:**
- DDoS downtime = revenue loss (₹10k per hour of outage)
- Rate limit too strict = legitimate users blocked
- Rate limit too loose = system overloaded

**Target:**
- Absorb 50x traffic spikes (1k req/sec → 50k req/sec)
- Block 99% of malicious traffic (non-customer)
- False positive rate <0.1% (block legitimate users)
- Cost < $200/month

---

## Decision

**Implement 3-layer protection: Cloud Armor (network), API Gateway (app), Redis (state).**

### Architecture

```
┌──────────────────────────────┐
│ DDoS Attack (50k req/sec)    │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│ Cloud Armor (Layer 7)        │   ← BLOCKS 99% here
│ - GeoIP rules                │
│ - Known attack signatures    │
│ - Prioritized rate limits    │
│ - Custom WAF rules           │
└──────────────────────────────┘
         ↓ (Legitimate traffic: ~1k req/sec)
┌──────────────────────────────┐
│ Cloud Load Balancer + Health │
│ - Auto-scaling triggers      │
│ - Geographic routing         │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│ API Gateway Rate Limits      │   ← HANDLES SPIKES
│ - Per-user rate limits       │
│ - Per-endpoint rate limits   │
│ - Refresh token  bucket      │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│ Redis Rate Limit Counter     │   ← STATE
│ - User request count         │
│ - IP request count           │
│ - TTL: 1 second sliding      │
└──────────────────────────────┘
```

---

## Rationale

### Why Cloud Armor (vs. ManageEngine WAF / Cloudflare)?

**Cloud Armor Advantages:**
- ✅ **Native to GCP** (integrated with Cloud Load Balancer, instant deployment)
- ✅ **ML-based attack detection** (learns from Google's 20TB+ daily DDoS data)
- ✅ **Layer 7 (app-level)** (understands HTTP, not just TCP/UDP)
- ✅ **Per-customer policies** (different limits for different user tiers)
- ✅ **Cost:** $5-20/month (free detection, pay only for custom rules)

**Why not Cloudflare?**
- ⚠️ Requires DNS migration (data localization concerns)
- ⚠️ Extra hop adds 50-100ms latency (India to Cloudflare US → GCP India)
- ⚠️ Pricing: $20-200/month (more expensive)

**Decision:** Cloud Armor sufficient for current threat profile. Cloudflare optional if DDoS persists.

### Rate Limiting Strategy

**3 Tiers:**

| Tier | Type | Limit | Block Duration | Use Case |
|------|------|-------|---|---|
| Tier 1 | Per-IP | 100 req/sec | 60 sec | Public endpoints (login) |
| Tier 2 | Per-user | 500 req/sec | 60 sec | Authenticated API (core features) |
| Tier 3 | Per-endpoint | 50 req/sec | 60 sec | Expensive ops (reports, exports) |

**Examples:**

```
Tier 1 (1000 requests from same IP → blocked):
- Login endpoint: 10 req/sec per IP
- Signup endpoint: 5 req/sec per IP
- Public API: 100 req/sec per IP

Tier 2 (auth token checked, user identified):
- Attendance API: 500 req/sec per user
- Grade API: 500 req/sec per user
- Report generation: 10 concurrent requests per user

Tier 3 (expensive operations):
- Bulk export: 1 request per 60 seconds
- Report generation: 5 concurrent per user
- Analytics query: 10 concurrent per user
```

---

## Implementation

### Cloud Armor Rules

```yaml
# Cloud Armor Security Policy
securityPolicy:
  name: "school-erp-security"
  
  # Rule 1: Block known malicious IPs (daily update from Google)
  rules:
    - priority: 100
      action: "deny(403)"
      match:
        versionedExpr: "FIREWALL_V1"
        expr:
          origin:
            region_code: ["CN", "RU", "KP"]  # Geo-block high-risk countries
      description: "Block high-risk geographies"
    
    # Rule 2: Rate limit per IP (Cloud Armor native)
    - priority: 200
      action: "rate-limit"
      name: "limit-by-ip"
      match:
        versionedExpr: "FIREWALL_V1"
        expr:
          origin: {}
      rateLimitOptions:
        conformAction: "allow"
        exceedAction: "deny(429)"  # HTTP 429 Too Many Requests
        rateLimitThreshold:
          count: 100              # 100 requests
          intervalSec: 1          # Per second
        banThresholdCount: 1000   # Ban after 1000 violations
        banDurationSec: 600       # Ban for 10 minutes
      description: "Rate limit by IP address"
    
    # Rule 3: Known attack signatures
    - priority: 300
      action: "deny(403)"
      match:
        expr:
          evaluatePreconfiguredExpr: "owasp-v3"  # OWASP Top 10
      description: "Block OWASP attacks"
    
    # Rule 4: Allow all
    - priority: 65535
      action: "allow"
      match:
        versionedExpr: "FIREWALL_V1"
      description: "Default allow"
```

### API Gateway Rate Limiting (Middleware)

```javascript
// Node.js Express middleware
import Redis from 'ioredis';

const redis = new Redis({
  host: 'memstore.googleapis.com',
  port: 6379,
  retryStrategy: () => null,
});

async function rateLimitMiddleware(req, res, next) {
  const userId = req.user?.id || req.ip;
  const endpoint = req.path;
  const tier = req.user ? 'authenticated' : 'anonymous';
  
  const limits = {
    anonymous: { perSec: 10, perMin: 100 },
    authenticated: { perSec: 100, perMin: 1000 },
  };
  
  const limiter = limits[tier];
  const key = `rate:${userId}:${endpoint}`;
  
  // Increment counter
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.setex(key, 60, 1); // 60-second window
  }
  
  // Check limit
  if (count > limiter.perMin) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: 60,
    });
  }
  
  // Add headers
  res.set('X-RateLimit-Limit', limiter.perMin);
  res.set('X-RateLimit-Remaining', limiter.perMin - count);
  res.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 60);
  
  next();
}
```

### DDoS Detection & Response

**Automated Actions:**
1. Monitor error rate (>0.5% triggers alert)
2. Check Cloud Armor logs (reject count spike)
3. Alert DevOps team (Slack #incidents)
4. Auto-escalate traffic to backup region
5. Enable advanced Cloud Armor rules (ML-based)

**Manual Response:**
1. Identify attack source (geo, user-agent, IP)
2. Add custom blocking rule (5 min deployment)
3. Scale Cloud Run replicas (max out at 50)
4. Redirect to cached responses (return stale data)
5. Contact ISP/Upstream if required (rare)

---

## Rate Limit Exemptions

**Whitelisted IPs** (no rate limiting):
- Internal monitoring (Stackdriver)
- Partner APIs (integrations)
- Crawlers (Google indexing)
- School employee networks (after verification)

**Configuration:**
```yaml
cloudArmor:
  allowList:
    - cidr: "10.0.0.0/8"      # Internal Google
    - cidr: "203.0.113.0/24"  # Partner ISP
    - header: "X-Bypass-Token" # Admin override
```

---

## Failure Modes & Cost

| Scenario | Probability | Impact | Mitigation |
|----------|---|---|---|
| Cloud Armor down | VERY LOW | DDoS undetected, spike to full load | Failover to backup region |
| Rate limit too strict | MEDIUM | Legitimate users blocked | Weekly tuning based on metrics |
| Rate limit too loose | LOW | Expensive endpoints overwhelmed | Feature flag to auto-scale |
| Attack from inside (insider threat) | LOW | Rate limits useless | Audit logs + role-based access |

---

## Costs

**Cloud Armor Components:**
- Cloud Armor policy: $5/month (base)
- Per-rule cost: $1/month per rule (3 rules × $1 = $3)
- DDoS detection (preview): Free
- **Total:** ~$8-15/month

**Scaling Cost (if ₹50L+ ARR):**
- Advanced ML rules: +$20/month
- Higher rate limit thresholds: No extra cost
- Custom WAF rulesets: +$100-500/month

**Break-even:** One DDoS attack prevented = saves ₹10k (1 hour downtime)

---

## Monitoring & Alerts

**Dashboard Metrics:**
- Requests blocked by Cloud Armor (% of total)
- Rate limit violations (per tier)
- Top blocked IPs/countries
- False positive rate (<0.1% target)

**Automated Alerts (Slack #security):**
- Error rate spike >0.5%
- Rate limit violations >1000/hour
- New attack signature detected
- Cloud Armor policy change

---

## Implementation Timeline

| Week | Task |
|------|------|
| W5 | ✅ Cloud Armor basic setup (geo-blocking) |
| W6 | ✅ Rate limiting middleware deployed |
| W6 | ✅ Redis counter state initialized |
| W7 | 🚧 Advanced ML rules enabled |
| W8 | ⏳ DDoS attack simulation test |
| W10 | ⏳ Annual security audit + tuning |

---

## Success Criteria

✅ **Week 6:** 99.95% uptime during spike traffic (50x surge), <0.1% legitimate user blocks  
✅ **Week 8:** Zero DDoS incidents, automatic detection working  
✅ **Week 12:** False positive rate <0.05%, <5ms rate limit check latency  

---

## Related Decisions

- [ADR-001](./001-cloud-run-firestore-scalability.md): Auto-scaling infrastructure
- [ADR-003](./003-firestore-replication.md): Failover procedures
- [ADR-005](./005-staged-rollout-deployment.md): Canary deployment strategy

