# Day 1 Vertical Slice Plan

## Validated Baseline

The workspace now passes the root checks:

1. `npm run typecheck`
2. `npm run test`
3. `npm run build`
4. `npm run lint`

This is the stable starting point for the next slice.

## Firebase Local Baseline

The repository now includes a practical Firebase emulator scaffold for local development:

1. Root `firebase.json` defines Auth and Firestore emulators plus the Emulator UI.
2. Root `.env.example` documents the current `dev` auth mode and emulator-backed runtime flags.
3. Firestore rules and index placeholders live at the repository root for the first Firestore-backed slice.

## Current Slice

The first runnable path end to end is already in place:

1. `GET /api/health`
2. `GET /api/schools/me`
3. `GET /api/students`
4. `POST /api/students`
5. Web shell with dashboard navigation and a students page that can call the API

## Delivery Order

1. Keep the root workspace healthy and rerun the baseline after each slice.
2. Implement the next domain slice: attendance.
3. Add shared contracts before code if the API shape changes.
4. Add or update tests for every route and UI flow touched.
5. Keep founder-only functionality out of the public app.

## Acceptance Criteria

1. The root workspace validation commands pass.
2. Student list and create endpoints work against the current Firestore-backed contract.
3. The web app loads a dashboard shell and can render student data from the API.
4. The first pass stays within the documented school ERP scope, with founder-only features excluded from the public app.

## Next Slice: Attendance

The next practical slice is daily attendance.

1. Add attendance repository and service support in the API.
2. Expose daily attendance list and mark endpoints.
3. Add the Attendance page in the web app with a day/class filter and submit flow.
4. Add tests for the attendance API and the UI data path.
