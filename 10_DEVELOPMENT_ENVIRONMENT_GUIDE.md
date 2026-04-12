# DEVELOPMENT ENVIRONMENT SETUP GUIDE
## Complete Onboarding for New Engineers

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Ready for Day 1  

---

# TABLE OF CONTENTS
1. Prerequisites & Install
2. Project Structure Overview
3. Development Workflow
4. Common Commands
5. Troubleshooting
6. IDE Configuration
7. Git Workflow

---

# PART 1: PREREQUISITES & INSTALLATION

## System Requirements

```
Minimum:
├─ Node.js 18+ (download from nodejs.org)
├─ npm 9+ (comes with Node.js)
├─ Git 2.30+
├─ 4GB RAM (for Docker containers)
└─ 10GB disk space

Recommended:
├─ Node.js 18 LTS
├─ Visual Studio Code with extensions
├─ Docker Desktop 4.10+
├─ 8GB+ RAM
└─ SSD for faster builds
```

## Installation Steps (Mac/Linux)

```bash
# Step 1: Install Node.js
curl -fsSL https://fnm.io/install | bash
# or use Homebrew on Mac:
brew install node@18

# Step 2: Verify installation
node --version    # Should be v18.x.x
npm --version     # Should be 9.x.x
git --version     # Should be 2.30+

# Step 3: Clone repository
git clone https://github.com/schoolerp/api.git
cd api

# Step 4: Install dependencies
npm install

# Step 5: Setup environment
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Step 6: Start development
npm run dev:setup
```

## Installation Steps (Windows)

```powershell
# Step 1: Install Node.js (use installer from nodejs.org)
# Step 2: Install Docker Desktop
# Step 3: Open PowerShell and clone
git clone https://github.com/schoolerp/api.git
cd api

# Step 4: Install dependencies
npm install

# Step 5: Setup environment
Copy-Item .env.example .env.local
# Edit .env.local in VS Code

# Step 6: Start development (requires Docker running)
npm run dev:setup
```

---

# PART 2: PROJECT STRUCTURE OVERVIEW

```
school-erp-api/
├── src/
│   ├── index.ts              ← Entry point
│   ├── middleware/
│   │   ├── auth.ts           ← Authentication middleware
│   │   ├── errorHandler.ts   ← Global error handler
│   │   └── logging.ts        ← Request logging
│   │
│   ├── routes/
│   │   ├── schools.ts        ← School endpoints
│   │   ├── students.ts       ← Student endpoints
│   │   ├── attendance.ts     ← Attendance endpoints
│   │   ├── grades.ts         ← Grades endpoints
│   │   └── exams.ts          ← Exam endpoints
│   │
│   ├── services/
│   │   ├── students.service.ts
│   │   ├── attendance.service.ts
│   │   ├── firestore.service.ts
│   │   └── notifications.service.ts
│   │
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── logger.ts
│   │
│   ├── dtos/
│   │   ├── student.dto.ts
│   │   └── attendance.dto.ts
│   │
│   └── __tests__/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│
├── scripts/
│   ├── seed.ts              ← Seed mock data
│   └── migrate.ts           ← Database migrations
│
├── docs/
│   ├── API.md               ← API documentation
│   └── DEPLOYMENT.md        ← Deployment guide
│
├── .github/
│   └── workflows/           ← GitHub Actions
│
├── .eslintrc.json           ← Linting rules
├── .prettierrc.json         ← Formatting rules
├── tsconfig.json            ← TypeScript config
├── jest.config.js           ← Testing config
├── docker-compose.yml       ← Docker setup
├── Dockerfile               ← Production build
├── .env.example             ← Environment template
├── package.json             ← Dependencies
└── README.md                ← Project overview
```

---

# PART 3: DEVELOPMENT WORKFLOW

## Daily Development Cycle

```
1. START OF DAY
   │
   ├─ Pull latest from main: git pull origin main
   ├─ Install new dependencies: npm install
   ├─ Start dev environment: npm run dev:setup
   └─ Check running status: curl http://localhost:8080/api/v1/health

2. DEVELOPMENT
   │
   ├─ Create feature branch: git checkout -b feature/student-search
   ├─ Make code changes
   ├─ Run tests: npm run test:unit
   ├─ Fix any linting: npm run lint:fix
   └─ Commit changes: git commit -m "feat: add student search"

3. BEFORE PUSHING
   │
   ├─ Pull latest: git pull origin main (resolve conflicts)
   ├─ Run full test suite: npm run test:all
   ├─ Run linter: npm run lint
   ├─ Build TypeScript: npm run build
   └─ Check no console errors (run in dev)

4. PUSH & CREATE PR
   │
   ├─ Push changes: git push origin feature/student-search
   ├─ Open GitHub PR (describe changes)
   ├─ Address review comments
   └─ Merge to main once approved

5. END OF DAY
   │
   ├─ Stop dev environment: docker-compose down
   ├─ Commit any WIP: git commit -m "WIP: still working"
   └─ Pull latest main: git pull origin main
```

---

# PART 4: COMMON COMMANDS

## Development

```bash
# Start development environment
npm run dev:setup

# Start just the API server (containers already running)
npm run dev

# Stop dev environment
docker-compose down

# View logs from specific service
docker-compose logs api -f
docker-compose logs firestore -f
```

## Testing

```bash
# Run all tests
npm run test

# Run only unit tests
npm run test:unit

# Run tests in watch mode (re-run on file change)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/services/__tests__/students.service.spec.ts

# Run tests matching pattern
npm test -- attendance

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Code Quality

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

## Building & Deployment

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server (requires build)
npm start

# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval)
npm run deploy:prod
```

## Database

```bash
# Seed development data
npm run db:seed

# Run migrations
npm run db:migrate

# Reset database (⚠️ deletes all data)
npm run db:reset
```

---

# PART 5: TROUBLESHOOTING

## Issue: "EADDRINUSE: address already in use :::8080"

```bash
# Port 8080 is already being used

# Find what's using port 8080
lsof -i :8080

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use different port
PORT=8081 npm run dev
```

## Issue: "Cannot find module '@/services/students.service'"

```bash
# TypeScript path alias not resolving

# Solution: Restart TypeScript server in IDE
# In VS Code: CMD+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

## Issue: Docker containers won't start

```bash
# Docker not running or port conflicts

# Verify Docker is running
docker ps

# Stop all containers
docker-compose down

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d

# Check container logs
docker-compose logs
```

## Issue: Firestore emulator won't connect

```bash
# Make sure emulator is running
docker-compose logs firestore

# Check that FIRESTORE_EMULATOR_HOST is set
echo $FIRESTORE_EMULATOR_HOST
# Should output: localhost:8080

# If not set, add to .env.local
FIRESTORE_EMULATOR_HOST=localhost:8080
```

## Issue: "Jest: Cannot find module"

```bash
# Jest module resolution issue

# Clear Jest cache
npm run test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

---

# PART 6: IDE CONFIGURATION

## VS Code Setup

### Recommended Extensions
```
1. ESLint (dbaeumer.vscode-eslint)
2. Prettier (esbenp.prettier-vscode)
3. Thunder Client (rangav.vscode-thunder-client) - API testing
4. Firebase Explorer (tonybaloney.vscode-firebase-explorer)
5. Peacock (johnpapa.peacock) - Color workspaces
6. Todo Tree (Gruntfug.todo-tree)
7. GitLens (eamodio.gitlens)
8. REST Client (humao.rest-client)
```

### Install Extensions
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension rangav.vscode-thunder-client
code --install-extension tonybaloney.vscode-firebase-explorer
```

### Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["typescript"],
  "eslint.autoFixOnSave": true
}
```

### Debugging

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "program": "${workspaceFolder}/src/index.ts",
      "restart": true,
      "console": "integratedTerminal",
      "preLaunchTask": "tsc: build"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

# PART 7: GIT WORKFLOW

## Branch Naming
```
feature/add-student-search      ← New feature
fix/student-dob-validation      ← Bug fix
refactor/attendance-service     ← Code cleanup
docs/api-specification          ← Documentation
tests/attendance-integration    ← Tests
chore/update-dependencies       ← Maintenance
```

## Commit Messages
```
Format: <type>(<scope>): <subject>

Examples:
feat(students): add search by name
fix(attendance): correct sync logic
docs(api): update endpoint specs
refactor(db): optimize student queries
test(grades): add grade calculation tests
chore: bump package versions
```

## Pull Request Template

```markdown
## Description
What does this PR do?

## Changes
- [ ] Feature 1
- [ ] Feature 2

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing done

## Screenshots
[If UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] No console errors
- [ ] Documentation updated
```

## Merging to Main
```bash
# Only authorized users can merge to main
# Approval required from: @lead-engineer, @tech-lead, or @founder

# Process:
# 1. Create PR with clear description
# 2. GitHub Actions runs tests automatically
# 3. Get code review approved
# 4. Resolve any conflicts with main
# 5. Merge using "Squash and merge" (keeps history clean)
# 6. Delete feature branch after merge
```

---

# PART 8: COMMUNICATION & HELP

## Getting Help
```
Quick questions:  Slack #development
Code review:      GitHub PR comments
Architecture:     Weekly team sync
Blocked/urgent:   @slack-ping team-lead
```

## Resources
```
API Docs:         docs/API_SPECIFICATION.md
Database Schema:  docs/FIRESTORE_SCHEMA.md
Setup Guide:      README.md (this file!)
Tech Stack:       docs/TECHNICAL_ARCHITECTURE.md
Architecture:     docs/ARCHITECTURE.md
```

## First Week Checklist
```
Day 1:
  ✓ Clone repo & npm install
  ✓ Setup .env.local
  ✓ Run npm run dev:setup
  ✓ Confirm API is running (curl localhost:8080/health)
  ✓ Meet with tech lead

Day 2-3:
  ✓ Understand codebase structure
  ✓ Review Firebase schema
  ✓ Run test suite
  ✓ Make first code change (small task)
  ✓ Create first PR

Day 4-5:
  ✓ Fix first bug or implement small feature
  ✓ Get code review approved
  ✓ Merge PR to main
  ✓ Deploy to staging
  ✓ Celebrate! 🎉
```

---

**Welcome to the School ERP team! You're now ready to start coding. Ask questions, review code carefully, and have fun building!**
