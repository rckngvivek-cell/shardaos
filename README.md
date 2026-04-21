# School ERP Monorepo

This repository is the current runnable baseline for the School ERP platform.

## Workspaces

- `apps/api`: Node.js + Express + TypeScript API
- `apps/owner`: dedicated ShardaOS owner portal
- `apps/employee`: dedicated internal operations employee portal
- `apps/school`: dedicated school workspace portal
- `apps/mobile`: React Native + Expo mobile shell
- `packages/shared`: shared types and schemas used across apps

The only browser apps in the active baseline are `owner`, `employee`, and `school`.

## Quick start

```bash
npm install
npm run dev
```

This starts:

- API at `http://localhost:3000`
- Owner app at `http://localhost:5174/login`
- Employee app at `http://localhost:5175/login`
- School app at `http://localhost:5176/login`

You can also run the portals individually:

```bash
npm run dev:owner
npm run dev:employee
npm run dev:school
```

Or start all three portals together:

```bash
npm run dev:portals
```

## Local auth and Firestore development

Create a local env file from the example:

```bash
cp .env.example .env
```

The repo-root `.env` is the canonical local env file for:

- `apps/api`
- `apps/owner`
- `apps/employee`
- `apps/school`

The current default local path stays simple:

- `AUTH_MODE=dev`

When you want the API to enforce bearer tokens end to end, switch to:

- `AUTH_MODE=jwt`
- configure OTP email delivery through either:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS_FILE`, `SMTP_FROM_EMAIL`
  - or local file fallback in development, which writes OTP emails into `.tools/email-outbox`

To run the Firestore emulator baseline:

```bash
npx firebase emulators:start --only firestore --project school-erp-dev
```

The current emulator ports are:

- Firestore emulator: `127.0.0.1:8081`
- Emulator UI: `127.0.0.1:4000`

Firestore rules and indexes live in `firestore.rules` and `firestore.indexes.json`.

## Owner account bootstrap

For emulator-backed local owner setup, start the Firestore emulator first and then run the bootstrap CLI.

To create or rotate a JWT-backed owner account against a non-emulated environment, configure:

- `AUTH_MODE=jwt`
- `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json`
- `OWNER_BOOTSTRAP_KEY` in the process environment, `OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET` in Windows Credential Manager, or `OWNER_BOOTSTRAP_KEY_FILE=/absolute/path/to/owner-bootstrap.key`

Then run:

```bash
OWNER_BOOTSTRAP_KEY_FILE=/secure/owner-bootstrap.key \
npm run owner:bootstrap -- --email owner@example.com --display-name "Platform Owner"
```

PowerShell example:

```powershell
$env:OWNER_BOOTSTRAP_KEY_FILE='C:\secure\owner-bootstrap.key'
npm run owner:bootstrap -- --email owner@example.com --display-name "Platform Owner"
```

Default local owner sign-in now happens through the dedicated owner app at `http://localhost:5174/login`.

## Email OTP login

All portal logins now use a two-step flow:

1. submit email and password
2. verify the emailed OTP

The API routes are:

- `POST /api/auth/platform/login`
- `POST /api/auth/tenant/login`
- `POST /api/auth/login/verify`
- `POST /api/auth/login/resend`

In development, if SMTP is not configured, the OTP email is written to `.tools/email-outbox` and the portal UI shows the outbox file hint.

## Useful commands

```bash
npm run test
npm run build
npm run lint
npm run typecheck
npm run dev:portals
npm run owner:bootstrap -- --help
```

These root validation commands now cover `shared`, `api`, `owner`, `employee`, `school`, and `mobile`.

## Current deployment baseline

The current supported deployment path is API-only:

- build with `cloudbuild.yaml`
- deploy `school-erp-api` to single-region Cloud Run
- build the image from `apps/api/Dockerfile`

Canonical command:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE_NAME=school-erp-api,_REGION=asia-south1 .
```

Manual fallback:

```bash
PROJECT_ID=your-gcp-project-id REGION=asia-south1 IMAGE_TAG=latest sh infrastructure/cloud-run/deploy-autoscaling.sh
```

## Implemented endpoints

- Health:
  - `GET /api/health`
  - `GET /health/live`
  - `GET /health/ready`
- Auth:
  - `POST /api/auth/owner/bootstrap`
  - `POST /api/auth/platform/login`
  - `POST /api/auth/tenant/login`
  - `POST /api/auth/login/verify`
  - `POST /api/auth/login/resend`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `POST /api/auth/password-reset/request`
  - `GET /api/auth/session`
  - `GET /api/auth/owner/session`
- Tenant:
  - `GET /api/schools/me`
  - `GET /api/students`
  - `GET /api/students/:id`
  - `POST /api/students`
  - `PUT /api/students/:id`
  - `DELETE /api/students/:id`
  - `GET /api/attendance`
  - `POST /api/attendance`
  - `POST /api/attendance/bulk`
  - `GET /api/grades`
  - `GET /api/grades/student/:studentId`
  - `POST /api/grades`
- Owner plane:
  - `GET /api/owner/owner/me`
  - `GET /api/owner/owner/summary`
  - `GET /api/owner/employees`
  - `POST /api/owner/employees`
  - `DELETE /api/owner/employees/:id`
  - `GET /api/owner/approvals`
  - `POST /api/owner/approvals/:id/approve`
  - `POST /api/owner/approvals/:id/deny`
