# Phase 01 Plan

## Context

The workspace contained specification documents but no executable project. This phase turns the spec bundle into a runnable starter repository that matches the Week 1 checklist and the PRI workflow.

## Implemented slice

1. Create a monorepo with `apps/api`, `apps/web`, and `apps/founder`.
2. Build a public API foundation for schools and students with a mock repository.
3. Build a web dashboard shell using React, Tailwind, Redux Toolkit, and RTK Query.
4. Build a localhost-only founder console as a separate service.
5. Add repo instructions and a reusable Codex skill for future School ERP work.

## Validated baseline

The current workspace is stable and verified:

1. `npm run typecheck`
2. `npm run test`
3. `npm run build`
4. `npm run lint`

Use this as the baseline for the next phase.

## Deferred work

1. Firebase Auth and permission middleware
2. Firestore adapters and indexes
3. attendance, exams, grades, billing, messaging, analytics
4. Docker, CI/CD, and Cloud Run deployment
5. Mobile application

## Next slice

Attendance is the next implementation target.

1. API: list and mark attendance by school, date, class, and section.
2. Web: attendance page with filters, roster, and submit flow.
3. Tests: API coverage plus one end-to-end UI path.

## Known spec conflicts resolved here

1. `npm` vs `pnpm`: npm workspaces chosen for the initial scaffold.
2. React 18 docs vs newer ecosystem releases: React 18 retained to match the specs.
3. Founder dashboard visibility: implemented as a separate local-only app, not a public route.
4. Data storage variants: mock in-memory repository used first, with Firestore-ready route shapes.
