# Day-1 Automation Backlog

This file distills the large automation plan into what exists now versus what should be added next.

## Implemented now

- GitHub CI for install, typecheck, test, and build
- PR template for PRI enforcement
- structured API envelope and request IDs
- validated root workspace baseline

## Manual for now

- Firestore to BigQuery sync
- scheduled backups to Cloud Storage
- payment gateway sync
- SMS and email notification queues
- payroll and fee automation
- cost-monitoring and cleanup jobs

## Next automation milestones

1. Add Firestore emulator-backed repository and fixture seeding.
2. Add Firebase Auth verification in non-mock environments.
3. Add scheduled backup workflow and restore drill checklist.
4. Add queue-backed notification service for attendance and billing.
5. Add analytics export pipeline for dashboards and founder reporting.

## Next slice automation target

- attendance data entry and day/class filtering
- roster persistence in the API
- UI submit flow for a teacher or admin user
