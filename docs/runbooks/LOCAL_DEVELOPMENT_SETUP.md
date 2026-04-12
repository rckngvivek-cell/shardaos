# Runbook: Local Development Setup

**Goal:** Get new developers running Phase 2 API locally in <10 minutes  
**Owner:** Documentation Agent  
**Last Updated:** April 10, 2026

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-10 | Documentation Agent | Initial setup guide for Phase 2 |

---

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org))
- **Git** ([download](https://git-scm.com))
- **VS Code** (recommended, [download](https://code.visualstudio.com))
- **No GCP credentials required** ✅

---

## Step 1: Clone Repository & Install Dependencies

**Time: ~2 minutes**

```bash
# Clone the repository
git clone https://github.com/school-erp/backend.git
cd backend

# Install dependencies
npm install

# Verify installation
npm run typecheck
```

**Expected output:**
```
✅ Typechecking passed
✅ 347 dependencies installed

Total: 2 major (typescript, express), 345 minor
```

---

## Step 2: Configure Development Environment

**Time: ~1 minute**

```bash
# Copy example environment file
cp .env.example .env.development

# Verify .env.development contains:
cat .env.development
```

**Expected `.env.development` contents:**
```bash
# Development configuration (no GCP required)
NODE_ENV=development
API_PORT=3000
STORAGE_DRIVER=memory          # In-memory data store (no Firestore)
PUBSUB_ENABLED=false           # Disable Pub/Sub
BIGQUERY_ENABLED=false         # Disable BigQuery
CLOUD_LOGGING_ENABLED=false    # Disable Cloud Logging
AUTH_MODE=mock                 # Mock authentication (no Firebase)
FIREBASE_PROJECT_ID=school-erp-dev
```

**What to do if `.env.example` is missing:**
```bash
# Create from template
cat > .env.development << 'EOF'
NODE_ENV=development
API_PORT=3000
STORAGE_DRIVER=memory
PUBSUB_ENABLED=false
BIGQUERY_ENABLED=false
CLOUD_LOGGING_ENABLED=false
AUTH_MODE=mock
FIREBASE_PROJECT_ID=school-erp-dev
EOF
```

---

## Step 3: Build & Start Development Server

**Time: ~2 minutes**

```bash
# Build the API
npm run build

# Expected output:
# ✅ Compiled successfully
# ✅ Output: ./dist
# ✅ 347 files generated

# Start development server with file watching
npm run dev

# OR start the compiled version directly
npm start
```

**Expected console output:**
```
🟢 API server started on http://localhost:3000
📋 Environment: development
🎭 Authentication: mock (development mode)
💾 Storage: in-memory (no Firestore)
📨 Pub/Sub: disabled (optional service)
📊 BigQuery: disabled (optional service)
🔔 Cloud Logging: disabled (optional service)

✅ Health check: http://localhost:3000/health/ready
```

---

## Step 4: Verify Health Check (200 OK)

**Time: ~1 minute**

**In a new terminal:**
```bash
# Health check endpoint
curl -i http://localhost:3000/health/ready

# OR in PowerShell (Windows)
Invoke-WebRequest http://localhost:3000/health/ready

# OR using VS Code REST Client
GET http://localhost:3000/health/ready
```

**Expected response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2026-04-10T09:30:45.123Z",
  "services": {
    "api": "✅ running",
    "firestore": "⚠️  disabled (development mode)",
    "pubsub": "⚠️  disabled (optional)",
    "bigquery": "⚠️  disabled (optional)",
    "cloud_logging": "⚠️  disabled (optional)"
  },
  "uptime_seconds": 12
}
```

**If you see 503 Unavailable:**
1. Check API is still running: `curl http://localhost:3000/health/live`
2. Wait 2-3 seconds and retry
3. Check logs in terminal for errors

---

## Step 5: Test Exam Endpoints (Optional)

**Time: ~2 minutes**

**Create an exam:**
```bash
curl -X POST http://localhost:3000/api/v1/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{
    "schoolId": "school-123",
    "title": "Biology Midterm",
    "subject": "Biology",
    "totalMarks": 100,
    "durationMinutes": 60,
    "classId": "class-10A",
    "startTime": "2026-04-10T10:00:00Z",
    "endTime": "2026-04-10T11:00:00Z"
  }'
```

**Expected response (201 Created):**
```json
{
  "id": "exam-550e8400-e29b-41d4-a716-446655440000",
  "schoolId": "school-123",
  "title": "Biology Midterm",
  "subject": "Biology",
  "totalMarks": 100,
  "durationMinutes": 60,
  "classId": "class-10A",
  "createdAt": "2026-04-10T09:30:45.123Z",
  "status": "draft"
}
```

**Get exam details:**
```bash
curl http://localhost:3000/api/v1/exams/exam-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer mock-token"
```

**List all exams:**
```bash
curl http://localhost:3000/api/v1/exams \
  -H "Authorization: Bearer mock-token"
```

---

## Testing with In-Memory Data

All exam endpoints work with in-memory data (no database required):

| Endpoint | Method | Purpose | Works? |
|----------|--------|---------|--------|
| `/api/v1/exams` | POST | Create exam | ✅ |
| `/api/v1/exams/{id}` | GET | Get exam details | ✅ |
| `/api/v1/exams` | GET | List exams | ✅ |
| `/api/v1/exams/{id}/submit` | POST | Submit exam | ✅ |
| `/api/v1/exams/{id}/results` | GET | View results | ✅ |

**Important notes:**
- Data is stored in RAM only (resets on restart)
- Perfect for testing and development
- Not suitable for multi-server scenarios
- Run unit tests with `npm test` for persistence concerns

---

## Running Tests Locally

```bash
# Run all tests
npm test

# Expected output:
# PASS  src/__tests__/exams.test.ts
# PASS  src/__tests__/health.test.ts
# PASS  src/__tests__/students.test.ts
# ✅ Tests: 92 passed in 4.2s
# ✅ Coverage: 94.3%

# Run specific test file
npm test -- src/__tests__/exams.test.ts

# Watch mode (re-run on file change)
npm test -- --watch
```

---

## Troubleshooting

### Issue: Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Kill process on port 3000 (macOS/Linux)
kill -9 $(lsof -ti :3000)

# Kill process on port 3000 (Windows PowerShell)
Get-Process -Name node | Stop-Process -Force

# OR use a different port
export API_PORT=3001
npm start
```

### Issue: TypeScript Errors on Build

**Error:**
```
error TS2322: Type 'string' is not assignable to type 'number'
```

**Solution:**
```bash
# Clear build artifacts
rm -rf dist node_modules

# Reinstall and rebuild
npm install
npm run build

# If problem persists, check TypeScript version:
npx tsc --version  # Should be 5.3.2 or higher
```

### Issue: Module Not Found Error

**Error:**
```
Error: Cannot find module '@school-erp/api/dist'
```

**Solution:**
```bash
# Ensure you ran build first
npm run build

# Check dist folder exists
ls -la dist/

# If dist is empty, try clean build:
rm -rf dist
npm run build
```

### Issue: Tests Failing Locally (Pass in CI)

**Cause:** Local environment not set to mock mode.

**Fix:**
```bash
# Ensure .env.development is loaded
export NODE_ENV=development
export STORAGE_DRIVER=memory

# Run tests again
npm test

# If still failing, check test setup
cat jest.config.js | grep setupFiles
```

### Issue: API Won't Start - "ENOENT" Error

**Error:**
```
Error: ENOENT: no such file or directory, open 'src/index.ts'
```

**Solution:**
```bash
# Verify you're in correct directory
pwd  # Should end with /backend or /apps/api

# List src folder
ls -la src/

# If src folder missing, clone failed
git status
git pull origin main
```

### Issue: npm install Hangs

**Error:**
```
npm http 304 https://registry.npmjs.org/express && then hangs...
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try install again with timeout
npm install --fetch-timeout=600000

# OR use yarn instead
yarn install
```

---

## Next Steps

1. **Review the code structure:**
   ```bash
   # Explore the project
   cat README.md
   tree src/ -L 2
   ```

2. **Set up VS Code extensions (recommended):**
   - REST Client: to test APIs from editor
   - Thunder Client: alternative API testing
   - Prettier: code formatting
   ```bash
   # Auto-format on save
   npm run lint
   ```

3. **Read related documentation:**
   - [API_SPECIFICATION.md](../../1_API_SPECIFICATION.md) - API contract
   - [TESTING_FRAMEWORK.md](../../5_TESTING_FRAMEWORK.md) - Test best practices
   - [ERROR_HANDLING.md](../../8_ERROR_HANDLING.md) - Error codes

4. **Understand the Phase 2 architecture:**
   - [ADR-GRACEFUL-DEGRADATION.md](../adr/ADR-GRACEFUL-DEGRADATION.md) - Why optional services are optional
   - [ADR-DATA-PIPELINE-STRATEGY.md](../adr/ADR-DATA-PIPELINE-STRATEGY.md) - Data pipeline design

---

## Common Environment Configurations

### Development (No GCP)
```bash
NODE_ENV=development
STORAGE_DRIVER=memory
PUBSUB_ENABLED=false
BIGQUERY_ENABLED=false
CLOUD_LOGGING_ENABLED=false
AUTH_MODE=mock
```

### Staging (Full GCP)
```bash
NODE_ENV=staging
STORAGE_DRIVER=firestore
PUBSUB_ENABLED=true
BIGQUERY_ENABLED=true
CLOUD_LOGGING_ENABLED=true
AUTH_MODE=firebase
GCP_PROJECT_ID=school-erp-staging
```

### Production (Full GCP)
```bash
NODE_ENV=production
STORAGE_DRIVER=firestore
PUBSUB_ENABLED=true
BIGQUERY_ENABLED=true
CLOUD_LOGGING_ENABLED=true
AUTH_MODE=firebase
GCP_PROJECT_ID=school-erp-prod
```

---

## Quick Reference Commands

```bash
# Development workflow
npm run dev              # Start with auto-reload
npm test                 # Run tests
npm run lint             # TypeScript check
npm run build            # Build for production

# Testing
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report
npm test -- exams.test  # Single test file

# Debugging
NODE_DEBUG=express npm start  # Debug mode
node --inspect dist/index.js  # Chrome DevTools debugging
```

---

## Got Stuck?

1. **Check the logs:** Look at console output for warnings like `⚠️ PubSub disabled`
2. **Verify environment:** `cat .env.development`
3. **Run health check:** `curl http://localhost:3000/health/ready`
4. **Check port:** `lsof -i :3000` (macOS/Linux) or `netstat -ano | grep 3000` (Windows)
5. **Ask in Slack:** #dev-support channel - tag @backend-team

---

## Related Documentation

- **[STAGING_DEPLOYMENT_RUNBOOK.md](./STAGING_DEPLOYMENT_RUNBOOK.md)** - Deploy to Cloud Run
- **[DATA_PIPELINE_OPERATIONS.md](./DATA_PIPELINE_OPERATIONS.md)** - Monitor data pipeline
- **[INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)** - Handle P1 incidents
- **[ADR-GRACEFUL-DEGRADATION.md](../adr/ADR-GRACEFUL-DEGRADATION.md)** - Architecture pattern
