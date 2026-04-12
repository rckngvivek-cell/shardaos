# Work In Progress

## Active Goal

Convert the spec bundle into a runnable foundation.

## Current Plan

- [x] Extract stack, workflow, and module assumptions from the markdown specs.
- [x] Deploy discoverable Codex role skills for the ERP project.
- [ ] Implement API foundation: health, students, auth mode abstraction, tests.
- [ ] Implement web foundation: login context, dashboard shell, students module.
- [ ] Install dependencies and verify build/test.
- [ ] Add CI/CD and deployment scaffolds next.

## Known Spec Tensions

- The docs alternate between separate repos and a shared system; this repo uses a monorepo.
- Some docs assume Firebase-only auth, others assume a backend-issued enriched token; this build supports Firebase in production and dev claims locally.
- The UI docs mix web and React Native examples; the first implementation is the web app only.
