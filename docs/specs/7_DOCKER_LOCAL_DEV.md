# DOCKER & LOCAL DEVELOPMENT ENVIRONMENT
## One-Command Setup for New Developers

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Ready to Use  

---

# File 1: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Firestore Emulator
  firestore:
    image: google/cloud-sdk:emulators
    ports:
      - "8080:8080"  # Firestore Emulator
      - "5000:5000"  # Firebase Emulator UI
    environment:
      - FIRESTORE_EMULATOR_HOST=0.0.0.0:8080
    command: 'gcloud beta emulators firestore start --host-port=0.0.0.0:8080'
    volumes:
      - firestore_data:/workspace

  # PostgreSQL for analytics cache (optional)
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: schoolerp
      POSTGRES_PASSWORD: dev_password_123
      POSTGRES_DB: schoolerp_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Node.js API Server (optional, for docker-based development)
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8081:8080"
    environment:
      NODE_ENV: development
      FIRESTORE_EMULATOR_HOST: firestore:8080
      GOOGLE_APPLICATION_CREDENTIALS: /app/serviceAccount.json
      REDIS_URL: redis://redis:6379
    depends_on:
      - firestore
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

volumes:
  firestore_data:
  postgres_data:
  redis_data:
```

---

# File 2: `Dockerfile.dev` (Development Build)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm (faster than npm)
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Start development server
CMD ["npm", "run", "dev"]
```

---

# File 3: `Dockerfile` (Production Build)

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
RUN npm install -g pnpm

# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN pnpm install --production --frozen-lockfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

---

# File 4: `.env.example`

```bash
# Copy to .env.local for local development

# Firebase
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=school-erp-dev.firebaseapp.com
FIREBASE_PROJECT_ID=school-erp-dev
FIREBASE_DATABASE_URL=https://school-erp-dev.firebaseio.com
FIREBASE_STORAGE_BUCKET=school-erp-dev.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef...

# GCP
GCP_PROJECT_ID=school-erp-dev
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json

# Firestore
FIRESTORE_EMULATOR_HOST=localhost:8080

# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://schoolerp:dev_password_123@localhost:5432/schoolerp_dev

# App
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
```

---

# File 5: Development Setup Guide

## `DEVELOPMENT.md`

```markdown
# Local Development Setup

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- Visual Studio Code (recommended)

## Quick Start (1 command)

```bash
npm run dev:setup
```

This runs:
1. Install dependencies
2. Start Docker containers (Firestore, Redis, PostgreSQL)
3. Initialize databases
4. Seed mock data
5. Start dev server

## Manual Setup

### Step 1: Clone & Install

```bash
git clone https://github.com/schoolerp/api.git
cd api
npm install
cp .env.example .env.local
```

### Step 2: Start Services

```bash
# Terminal 1: Start Docker containers
docker-compose up

# Terminal 2: Start Node.js server
npm run dev
```

### Step 3: Verify Setup

```bash
# Check if API is running
curl http://localhost:8080/api/v1/health

# Check Firestore emulator
# Open browser: http://localhost:5000 (Emulator UI)
```

## Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests with coverage
npm run test:coverage
```

## Linting & Formatting

```bash
# Check code quality
npm run lint

# Fix linting errors
npm run lint:fix

# Format code
npm run format
```

## Debugging

### VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Server",
      "program": "${workspaceFolder}/dist/index.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

Then press `F5` to start debugging.

### Logging

Set `LOG_LEVEL` in `.env.local`:
- `debug`: Verbose logs (development)
- `info`: Important messages (testing)
- `warn`: Warnings and errors (staging)
- `error`: Errors only (production)

## Common Issues

### Firestore Emulator Won't Start

```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill process using port 8080
kill -9 <PID>

# Restart containers
docker-compose down
docker-compose up
```

### Node Modules Cache Issue

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart container
docker-compose restart postgres
```

```

---

# File 6: `package.json` Scripts

```json
{
  "scripts": {
    "dev:setup": "npm install && docker-compose up -d && npm run db:init && npm run dev",
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "db:init": "npm run db:migrate && npm run db:seed",
    "db:migrate": "ts-node scripts/migrate.ts",
    "db:seed": "ts-node scripts/seed.ts",
    "docker:build": "docker build -t schoolerp-api:latest .",
    "docker:run": "docker run -p 8080:8080 schoolerp-api:latest"
  }
}
```

---

# File 7: Database Seeding

## `scripts/seed.ts`

```typescript
import admin from 'firebase-admin';
import fs from 'fs';

admin.initializeApp({
  projectId: 'school-erp-dev',
});

const db = admin.firestore();

async function seedData(): Promise<void> {
  console.log('🌱 Seeding development data...');

  // Add test schools
  const schools = [
    {
      id: 'test_school_001',
      name: 'Test School DPS',
      email: 'principal@testschool.edu.in',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  ];

  for (const school of schools) {
    await db.collection('schools').doc(school.id).set(school);
    console.log(`✓ Created school: ${school.name}`);
  }

  // Add test students
  const students = [
    {
      firstName: 'Aarav',
      lastName: 'Sharma',
      dob: new Date('2012-05-15'),
      class: 5,
      section: 'A',
      status: 'active',
    },
  ];

  for (const student of students) {
    await db
      .collection('schools/test_school_001/students')
      .add(student);
    console.log(`✓ Created student: ${student.firstName}`);
  }

  console.log('✅ Seeding complete!');
}

seedData().catch(console.error);
```

---

**This setup allows new developers to get started with a single command: `npm run dev:setup`**
