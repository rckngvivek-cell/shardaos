# School ERP Monorepo

This repository is the first runnable build derived from the spec set in this folder. It converts the documentation bundle into a working day-1/day-7 scaffold:

- `apps/api`: Node.js + Express + TypeScript API
- `apps/web`: React + TypeScript + Redux Toolkit web shell
- `apps/founder`: localhost-only founder control surface
- `docs/process`: PRI workflow, weekly summaries, and automation backlog
- `.github/pull_request_template.md`: PR template aligned to the Plan -> Review -> Implement process

## Scope of this first slice

This initial build normalizes the specs into a practical starting point:

- Firestore remains the target data store
- The default local runtime uses an in-memory repository so the app runs without cloud credentials
- API authentication follows the `Authorization: Bearer <token>` contract and uses `mock` mode locally
- The first implemented business module is Student Information System CRUD
- The web app includes a dashboard shell and student management workspace

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

- API at `http://localhost:8080/api/v1`
- Web app at `http://localhost:5173`

Founder app stays separate and can be started explicitly:

```bash
npm run dev:founder
```

It binds to `http://127.0.0.1:3001`.

The web shell talks to the API using:

- school id: `demo-school`
- bearer token: `demo-admin-token`

## Firebase Local Development

Create a local env file from the example:

```bash
cp .env.example .env
```

The current default local path stays simple:

- `AUTH_MODE=mock`
- `STORAGE_DRIVER=memory`

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
- `STORAGE_DRIVER=firestore`

Firestore rules and index placeholders live in `firestore.rules` and `firestore.indexes.json`.

## Useful commands

```bash
npm run test
npm run build
npm run lint
```

## Implemented endpoints

- `GET /api/v1/health`
- `GET /api/v1/schools/:schoolId`
- `GET /api/v1/schools/:schoolId/students`
- `GET /api/v1/schools/:schoolId/students/search`
- `GET /api/v1/schools/:schoolId/students/:studentId`
- `POST /api/v1/schools/:schoolId/students`
- `PATCH /api/v1/schools/:schoolId/students/:studentId`
- `DELETE /api/v1/schools/:schoolId/students/:studentId`

## Next recommended build steps

1. Switch API storage from `memory` to Firestore emulator and then managed Firestore.
2. Replace mock auth with Firebase Auth verification.
3. Add attendance module and batch attendance workflows.
4. Add Firestore security rules, Docker-based local services, and Cloud Run deployment.
5. Move shared schemas into a dedicated workspace package once API contracts stabilize.
