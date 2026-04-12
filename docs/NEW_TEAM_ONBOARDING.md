# NEW TEAM ONBOARDING GUIDE

**Version:** 1.0  
**Date:** May 9, 2026  
**Last Updated:** May 9, 2026  
**Owner:** Documentation Agent

## Welcome to School ERP! 👋

This guide will get you up and running in **30 minutes**. Whether you're a backend engineer, frontend developer, DevOps engineer, or QA specialist, this guide covers everything you need.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Repository Setup](#repository-setup)
3. [Local Development Environment](#local-development-environment)
4. [Running Tests](#running-tests)
5. [Deploying Changes](#deploying-changes)
6. [Common Error Fixes](#common-error-fixes)
7. [Accessing Resources](#accessing-resources)
8. [Getting Help](#getting-help)

---

## System Requirements

**Minimum Setup:**
- **OS:** macOS 12+, Linux (Ubuntu 20.04+), or Windows 10+ (with WSL2)
- **Node.js:** 18.x LTS or higher
- **npm:** 9.x or higher
- **Git:** 2.30+
- **Docker:** 20.10+ (for Firestore emulator)
- **RAM:** 8GB minimum (16GB recommended)
- **Disk Space:** 5GB for repo + dependencies

**Verify installed versions:**

```bash
node --version      # Should be v18.x.x or higher
npm --version       # Should be 9.x.x or higher
git --version       # Should be 2.30+
docker --version    # Should be 20.10+
```

**Create SSH key for Git** (if haven't already):

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub  # Copy this to GitHub SSH keys
```

---

## Repository Setup

### Step 1: Clone the Repository

```bash
# Create workspace directory
mkdir -p ~/workspace
cd ~/workspace

# Clone repo (use SSH if you added key, otherwise HTTPS)
git clone git@github.com:school-erp/school-erp.git
# OR
git clone https://github.com/school-erp/school-erp.git

# Navigate to repo
cd school-erp

# Verify you're on main branch
git status
# Expected: "On branch main, Your branch is up to date with 'origin/main'."
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install monorepo workspace dependencies
npm install --workspaces

# Verify installation successful
npm list

# Expected: Should show workspace structure with no errors
```

### Step 3: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit file with your values
nano .env.local  # or vim, or open in editor

# Required values to set:
#  - FIREBASE_PROJECT_ID (get from team lead)
#  - FIREBASE_PRIVATE_KEY (request from secret manager)
#  - DATABASE_URL (Firestore emulator default: http://localhost:8081)
#  - GOOGLE_APPLICATION_CREDENTIALS (download service account key)

# Verify file created
test -f .env.local && echo "✅ .env.local created"
```

**Get secrets from team:**

```bash
# If you have gcloud CLI configured:
gcloud secrets versions access latest --secret="firebase-config" > firebase-config.json

# Ask team lead to share (don't commit secrets!):
# - Firebase service account key
# - Database credentials
# - API keys
```

---

## Local Development Environment

### Quick Start (5 minutes)

```bash
# Start all services locally:
npm run dev

# This starts:
# 1. API server (port 3000)
# 2. Frontend dev server (port 5173)

# Expected output:
# ✓ API server ready at http://localhost:3000
# ✓ Frontend ready at http://localhost:5173

# Open http://localhost:5173 in browser
```

### Manual Service Setup (if above doesn't work)

**Terminal 1: Firestore Emulator**

```bash
# Navigate to workspace
cd ~/workspace/school-erp

# Start Firestore + Auth emulators when you need Firebase integration testing
npx firebase emulators:start --only auth,firestore --project school-erp-dev

# Expected output:
# Firestore listening on localhost:8081
# Firestore UI available at http://localhost:4000
```

**Terminal 2: Backend API**

```bash
cd ~/workspace/school-erp/apps/api

# Install API dependencies (if not done)
npm install

# Set environment
export FIRESTORE_EMULATOR_HOST=localhost:8081
export NODE_ENV=development
export PORT=3000

# Start API server
npm run dev

# Expected output:
# ✓ Server running on port 3000
# ✓ Connected to Firestore emulator
```

**Terminal 3: Frontend**

```bash
cd ~/workspace/school-erp/apps/web

# Install web dependencies (if not done)
npm install

# Start React dev server
npm run dev

# Expected output:
# Local: http://localhost:5173
# Press 'h' for help, 'q' to quit
```

### Verify Everything Works

```bash
# In a 4th terminal, run smoke tests:
curl http://localhost:3000/api/health

# Expected: {"status":"ok"}

curl http://localhost:5173

# Expected: HTML response (homepage)
```

---

## Running Tests

### Test Structure

```
apps/
├── api/
│   └── tests/
│       ├── api.test.ts              (API endpoint tests)
│       ├── firestore.test.ts        (Database tests)
│       ├── security.test.ts         (Authorization tests)
│       └── integration.test.ts      (End-to-end tests)
│
└── web/
    └── __tests__/
        ├── components/              (React component tests)
        ├── pages/                   (Page integration tests)
        └── hooks/                   (Custom hook tests)
```

### Run All Tests

```bash
# From root directory
npm run test

# Expected: 47 tests should pass
# ✓ 47 passing
# Coverage: 82%+ across all files
```

### Run Tests by Type

```bash
# Backend API tests only
npm run test --workspace=api

# Frontend tests only
npm run test --workspace=web

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run coverage

# Generates coverage/index.html - open in browser to see detailed report
```

### Run Specific Test File

```bash
# Run one test file
npm test -- apps/api/tests/api.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="POST /students"

# Run single test case
npm test -- --testNamePattern="should create student with valid data"
```

### Debugging Tests

```bash
# Run tests with debugging enabled
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Opens debugger at chrome://inspect
# Set breakpoints, step through code

# Or use Jest's test.only() for single test:
test.only('should create student with valid data', () => {
  // This test runs in isolation
});
```

---

## Deploying Changes

### Local Deployment Workflow

**Step 1: Create Feature Branch**

```bash
git checkout -b feature/student-enrollment-ui
# or bug fix: git checkout -b fix/attendance-off-by-one
```

**Step 2: Make Changes & Commit**

```bash
# Edit files...

# Check what changed
git status

# Stage specific files
git add apps/web/src/pages/StudentEnrollment.tsx
git add apps/api/src/routes/students.ts

# Or stage all: git add .

# Commit with clear message
git commit -m "feat: Add student enrollment portal

- New form component for student signup
- API endpoint for enrollment submission
- Email confirmation flow
- Integration tests for happy path and edge cases

Fixes #42"

# Follow convention: type(scope): message
# Types: feat, fix, refactor, test, docs, style, perf
```

**Step 3: Run Full Test Suite**

```bash
# Before pushing, ensure all tests pass locally
npm run test && npm run lint && npm run build

# Expected:
# ✓ 47 tests passing
# ✓ 0 lint errors
# ✓ Build successful (3.2MB)
```

**Step 4: Push & Create Pull Request**

```bash
git push origin feature/student-enrollment-ui

# GitHub will show "Create Pull Request" button
# Click it and fill in:
# - Title: Concise description of change
# - Description: Why, what, how (reference issue #42)
# - Checklist: Mark completed items
```

**PR Checklist Template:**

```markdown
## What does this PR do?
Brief summary of changes

## Why are we doing this?
Business justification and issue reference (#42)

## How to test?
Step-by-step testing instructions

## Checklist
- [ ] Tests added/updated and passing
- [ ] Code reviewed (no major issues)
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Deployment runbook reviewed
```

### Staging Deployment

```bash
# Current supported deployment path:
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=school-erp-api,_REGION=asia-south1 \
  .

# This path:
# 1. Builds the API image from apps/api/Dockerfile
# 2. Pushes the tagged image to gcr.io/$PROJECT_ID/school-erp-api
# 3. Deploys school-erp-api to Cloud Run

# Monitor deployment:
gcloud builds list --limit 10
gcloud builds log <BUILD_ID> --stream
```

### Production Deployment

```bash
# Manual operator-driven fallback:
PROJECT_ID=your-gcp-project-id \
REGION=asia-south1 \
IMAGE_TAG=latest \
sh infrastructure/cloud-run/deploy-autoscaling.sh

# Verify the deployed service:
gcloud run services describe school-erp-api --region=asia-south1
curl https://YOUR_CLOUD_RUN_URL/api/health
```

The legacy GitHub staging and production deploy workflows are draft placeholders right now. Do not treat them as the supported production path until they are rebuilt around the `school-erp-api` Cloud Build baseline.

---

## Common Error Fixes

### Error: "Cannot find module 'express'"

**Cause:** Dependencies not installed  
**Fix:**

```bash
# Root directory
npm install

# Specific workspace
npm install --workspace=api
npm install --workspace=web

# Clear cache if still broken
rm -rf node_modules package-lock.json
npm install
```

### Error: "EADDRINUSE: address already in use :::3000"

**Cause:** Port 3000 already in use (another instance running)  
**Fix:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or specify different port
PORT=3001 npm run dev
```

### Error: "Firestore emulator not connected"

**Cause:** Emulator not running or FIRESTORE_EMULATOR_HOST not set  
**Fix:**

```bash
# Ensure emulator running in separate terminal
npx firebase emulators:start --only auth,firestore --project school-erp-dev

# Set environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8081

# Verify it's set
echo $FIRESTORE_EMULATOR_HOST  # Should print: localhost:8081

# Restart API server
npm run dev
```

### Error: "FIREBASE_PRIVATE_KEY is missing"

**Cause:** .env.local not configured  
**Fix:**

```bash
# Copy example
cp .env.example .env.local

# Edit and add values
nano .env.local

# Add these lines:
FIREBASE_PROJECT_ID=school-erp-prod
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json

# Save and restart:
npm run dev
```

### Error: "Tests failing with 'document.querySelector is not a function'"

**Cause:** DOM not available in test environment  
**Fix:**

```bash
# Add to test file:
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Or use: npm install --save-dev @testing-library/react
// which handles DOM setup automatically
```

### Error: "401 Unauthorized when calling API"

**Cause:** Auth token invalid or expired  
**Fix:**

```bash
# Get valid token from Firebase console or CLI:
firebase auth:export users.json

# Use in header:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/students

# For testing, bypass auth in development:
# Edit apps/api/src/middleware/auth.ts:
// if (process.env.NODE_ENV === 'development') return next();
```

### Error: "npm ERR! code EACCES permission denied"

**Cause:** npm installed globally without permissions  
**Fix:**

```bash
# Option 1: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 2: Use nvm (Node Version Manager) - recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

---

## Accessing Resources

### Internal Tools & Services

| Resource | URL | Setup Required |
|----------|-----|-----------------|
| **GitHub** | https://github.com/school-erp | SSH key configured |
| **Figma** | https://figma.com/school-erp | Request access from Product Agent |
| **Firebase Console** | https://console.firebase.google.com | Google account + project access |
| **Google Cloud Console** | https://console.cloud.google.com | gcloud CLI installed |
| **Monitoring Dashboard** | [Link provided by DevOps] | Cloud access |
| **Incident Tracking** | Slack #incidents | Slack workspace |

### CLI Tools Setup

**Google Cloud CLI (gcloud)**

```bash
# Install
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize
gcloud init

# Authenticate
gcloud auth login

# Set project
gcloud config set project school-erp-prod

# Verify
gcloud auth list
```

**Firebase CLI**

```bash
# Install globally
npm install -g firebase-tools

# Login
firebase login

# Verify
firebase --version
```

**Cloud Build Log Access**

```bash
# View recent builds
gcloud builds list --limit 10

# View build log
gcloud builds log <BUILD_ID>

# Stream live build
gcloud builds log <BUILD_ID> --stream
```

---

## Getting Help

### Resource Hierarchy

1. **First:** Check documentation
   - README.md (root)
   - docs/ADR-*.md (architecture decisions)
   - docs/DEPLOYMENT_RUNBOOK.md (deployment issues)
   - This guide (setup issues)

2. **Second:** Search codebase
   ```bash
   grep -r "error message" apps/
   # Or use VS Code Cmd+Shift+F
   ```

3. **Third:** Check GitHub Issues
   - Open issues: https://github.com/school-erp/school-erp/issues
   - Search existing issues for similar problem

4. **Fourth:** Ask on Slack
   - #engineering - General technical questions
   - #api - Backend API questions
   - #frontend - React/UI questions
   - #devops - Deployment & infrastructure
   - #incidents - Production issues

5. **Fifth:** Contact team leads
   - Backend Lead: @backend-lead
   - Frontend Lead: @frontend-lead
   - DevOps Lead: @devops-lead
   - QA Lead: @qa-lead

### Slack Channels

```
#general           - Company announcements
#engineering       - Technical discussions
#api               - Backend API discussion
#frontend          - React/UI discussion
#devops            - Infrastructure & deployment
#data              - Analytics & BI
#incidents         - Production issues (page on-call)
#standup           - Daily standups
#random            - Off-topic
```

### Code Review Tips

When submitting PR:
- ✅ Link related issue (#42)
- ✅ Write clear commit messages
- ✅ Include test cases
- ✅ Request specific reviewer
- ✅ Be responsive to feedback

Expected response time:
- Simple changes (< 100 LOC): 2-4 hours
- Medium changes (100-500 LOC): 4-8 hours
- Large changes (> 500 LOC): Next business day

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev                 # Start all services
npm run dev -- --api       # Start only API

# Testing
npm run test               # Run all tests
npm run test:watch        # Watch mode
npm run coverage           # Coverage report

# Code Quality
npm run lint               # ESLint check
npm run format             # Prettier auto-fix
npm run typecheck          # TypeScript check

# Build
npm run build              # Production build

# Deployment
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE_NAME=school-erp-api,_REGION=asia-south1 .  # Supported deploy path
PROJECT_ID=your-gcp-project-id REGION=asia-south1 IMAGE_TAG=latest sh infrastructure/cloud-run/deploy-autoscaling.sh # Manual fallback

# Database
npx firebase emulators:start --only auth,firestore --project school-erp-dev # Start Firestore emulator
npm run db:seed            # Seed test data
npm run db:backup          # Backup Firestore

# Utilities
npm run clean              # Remove build artifacts
npm run docs:generate      # Generate API docs
```

### Important Files

| File | Purpose |
|------|---------|
| `package.json` | Workspace dependencies & scripts |
| `apps/api/package.json` | API-specific setup |
| `apps/web/package.json` | Frontend-specific setup |
| `.env.example` | Environment variable template |
| `jest.config.js` | Test runner configuration |
| `.eslintrc.json` | Linting rules |
| `cloudbuild.yaml` | CI/CD pipeline definition |
| `apps/api/Dockerfile` | Production API container image definition |

---

## Architecture Overview

```
school-erp/                    (Monorepo root)
├── apps/
│   ├── api/                   (Express API)
│   │   ├── src/
│   │   │   ├── routes/        (API endpoints)
│   │   │   ├── services/      (Business logic)
│   │   │   ├── middleware/    (Auth, validation, logging)
│   │   │   └── models/        (Zod schemas)
│   │   └── tests/            (API test suite)
│   │
│   └── web/                   (React frontend)
│       ├── src/
│       │   ├── pages/        (Route pages)
│       │   ├── components/   (React components)
│       │   ├── hooks/        (Custom hooks)
│       │   ├── store/        (Redux state)
│       │   └── services/     (API clients)
│       └── __tests__/        (Component tests)
│
├── docs/                      (Documentation)
│   ├── ADR-*.md              (Architecture decisions)
│   ├── DEPLOYMENT_RUNBOOK.md
│   └── NEW_TEAM_ONBOARDING.md
│
├── .github/workflows/         (CI/CD pipelines)
├── cloudbuild.yaml            (Current supported API deployment path)
├── infrastructure/
│   └── cloud-run/
│       ├── service.yaml       (Reference Cloud Run manifest)
│       └── deploy-autoscaling.sh (Manual deploy fallback)
├── docker-compose.yml         (Local services)
├── jest.config.js            (Test config)
├── .env.example              (Environment template)
└── package.json              (Root dependencies)
```

---

**Still stuck? Slack [@backend-lead, @frontend-lead, @devops-lead] or open a GitHub issue with "🆘 Onboarding Help" in title.**

**Last Updated:** May 9, 2026  
**Next Review:** May 23, 2026

