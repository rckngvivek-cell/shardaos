# School ERP Monorepo

This repository is the first runnable build derived from the spec set in this folder. It converts the documentation bundle into a working day-1/day-7 scaffold:

- `apps/api`: Node.js + Express + TypeScript API
- `apps/web`: React + TypeScript + Redux Toolkit web shell
- `apps/mobile`: React Native + Expo mobile shell
- `packages/shared`: shared types and schemas used across apps
- `docs/process`: PRI workflow, weekly summaries, and automation backlog
- `.github/pull_request_template.md`: PR template aligned to the Plan -> Review -> Implement process

## Scope of this first slice

This initial build normalizes the specs into a practical starting point:

- Firestore remains the target data store
- The default local runtime uses `AUTH_MODE=dev` so tenant routes are callable without Firebase credentials
- The current public API contract lives under `/api/*`
- Local development uses API `3000` and web `5173`
- The current implemented slices are students, attendance, grades, school lookup, and the owner plane

## Canonical naming and repo shape

- `School ERP` is the tenant-facing product name.
- `ShardaOS` is reserved for internal owner-plane surfaces such as `/owner` and `/api/owner`.
- The package and workspace scope remains `@school-erp/*`.
- The current runnable baseline does not include `apps/founder`; owner-plane functionality lives inside the existing API and web apps.
- Legacy `deerflow` names in Terraform and older deployment assets are draft infrastructure references and should not be treated as the runtime source of truth.

## Why this shape

The source documents are strong on architecture but not yet an executable codebase. This scaffold follows the consistent parts of the docs and deliberately defers a few later-phase concerns:

- Firestore is the canonical store across the spec set, even though one older architecture note mentions Firebase Realtime
- React + TypeScript stays in place, but this scaffold uses a lightweight Vite setup instead of older `create-react-app` steps from planning docs
- CI, PRI workflow, and operational templates are included from day 1

## Quick start

```bash
npm install
npm run dev
```

This starts:

- API at `http://localhost:3000`
- Web app at `http://localhost:5173`

## Current deployment baseline

The current supported deployment path is API-only:

- Build with `cloudbuild.yaml`
- Deploy `school-erp-api` to single-region Cloud Run
- Build image from `apps/api/Dockerfile`

Canonical command:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE_NAME=school-erp-api,_REGION=asia-south1 .
```

Manual fallback:

```bash
PROJECT_ID=your-gcp-project-id REGION=asia-south1 IMAGE_TAG=latest sh infrastructure/cloud-run/deploy-autoscaling.sh
```

Reference: [CURRENT_DEPLOYMENT_BASELINE.md](/c:/Users/vivek/OneDrive/Scans/files/shardaos/docs/deployment/CURRENT_DEPLOYMENT_BASELINE.md:1)

## Firebase Local Development

Create a local env file from the example:

```bash
cp .env.example .env
```

The current default local path stays simple:

- `AUTH_MODE=dev`

To run the Firebase emulator baseline, install the Firebase CLI and start the emulators:

```bash
npx firebase emulators:start --only auth,firestore --project school-erp-dev
```

The root `firebase.json` keeps the emulator ports separate from the API:

- Auth emulator: `127.0.0.1:9099`
- Firestore emulator: `127.0.0.1:8081`
- Emulator UI: `127.0.0.1:4000`

When you want the API to use the emulators, set:

- `AUTH_MODE=firebase`

Firestore rules and composite indexes live in `firestore.rules` and `firestore.indexes.json`.

The current Firestore rules are intentionally conservative: tenant-scoped reads only and no client writes. The API uses the Firebase Admin SDK and is not subject to Firestore rules.

## Useful commands

```bash
npm run test
npm run build
npm run lint
```

These root validation commands now cover the shared package plus the `api`, `web`, and `mobile` apps.

## Implemented endpoints

- Health:
  - `GET /api/health`
  - `GET /health/live`
  - `GET /health/ready`
- Auth:
  - `POST /api/auth/owner/bootstrap`
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

## Next recommended build steps

1. Stabilize Firestore-backed local development with emulator fixtures and seeded test data.
2. Replace `AUTH_MODE=dev` local bypass with end-to-end Firebase Auth verification in the default local path.
3. Add attendance module and batch attendance workflows.
4. Add Firestore security rules, Docker-based local services, and Cloud Run deployment.
5. Move shared schemas into a dedicated workspace package once API contracts stabilize.
