# API Conventions

The bootstrap follows the canonical platform API rules.

## Base Path

- `/api/v1/...`

## Success Envelope

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "correlation_id": "caller-123",
    "timestamp": "2026-03-12T10:45:00Z",
    "version": "v1"
  }
}
```

## Error Envelope

```json
{
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "Human-readable summary",
    "details": {},
    "retryable": false
  },
  "meta": {
    "request_id": "uuid",
    "correlation_id": "caller-123",
    "timestamp": "2026-03-12T10:45:00Z"
  }
}
```

## Headers

- `X-Correlation-Id`: propagated or generated per request
- `X-Request-Id`: generated per request and echoed on every response
- `Idempotency-Key`: required for duplicate-risk command endpoints
- `X-Tenant-Id`: required for tenant-scoped operations that do not carry tenant in path/body
- `X-School-Id`: optional active school scope for scoped operations and governance drilldown
- `X-Campus-Id`: optional active campus scope for campus-local operations and governance drilldown
- `X-Rate-Limit-Limit`: request cap for the matched route bucket
- `X-Rate-Limit-Remaining`: requests still available in the active rate-limit window
- `Retry-After`: returned on `429 RATE_LIMITED` and `503 MAINTENANCE_MODE`

## Security Headers

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Permissions-Policy`

## Scope Rules

- `tenant_id` remains the company or operator boundary
- `school_id` identifies the isolated school operating unit inside a tenant
- `campus_id` identifies the physical or managed campus inside a school
- school-owned create commands should carry `school_id` directly or resolve it from the active tenant default during compatibility mode
- campus-local commands should carry `campus_id` directly or resolve it from the active school default during compatibility mode

## Command Handling

- duplicate-risk POST operations persist idempotency records
- same idempotency key plus same request hash returns the original payload
- same idempotency key plus different request hash returns `409 RESOURCE_CONFLICT`
- request bodies are rejected with `413 PAYLOAD_TOO_LARGE` when they exceed the active runtime guardrail
- matched route buckets are rate limited and return `429 RATE_LIMITED` when exhausted
- maintenance mode returns `503 MAINTENANCE_MODE` for non-bypass routes while leaving runtime ops and health probes reachable
