# Agent Operating Model

This repository encodes the multi-agent workflow from the planning documents in a form that is usable on day 1.

## Active roles

- `Lead Architect`: owns scope, reviews plans, enforces PRI, approves architecture changes.
- `Backend Agent`: owns API, Firestore integration, auth, validation, and service boundaries.
- `Frontend Agent`: owns React shell, Redux/RTK Query, design system usage, and responsive UX.
- `Data Agent`: owns analytics contracts, future BigQuery sync, reporting, and automation data models.
- `DevOps Agent`: owns CI, runtime environments, Cloud Run, monitoring, and local tooling.
- `QA Agent`: owns test strategy, integration coverage, regression checks, and release sign-off.
- `Product Agent`: owns weekly scope, pilot-school workflows, and backlog prioritization.
- `Documentation Agent`: owns ADRs, onboarding docs, weekly summaries, and knowledge capture.

## Mandatory workflow

Every non-trivial change must follow PRI:

1. `Plan`
2. `Review`
3. `Implement`
4. `Test and verify`

Use the templates in [docs/process/PRI_TEMPLATE.md](/c:/Users/vivek/OneDrive/Scans/files/docs/process/PRI_TEMPLATE.md) and [docs/process/WEEKLY_SUMMARY_TEMPLATE.md](/c:/Users/vivek/OneDrive/Scans/files/docs/process/WEEKLY_SUMMARY_TEMPLATE.md).

## Ownership for this scaffold

- API and student module: Backend Agent
- Web shell and student workspace: Frontend Agent
- CI and runbooks: DevOps Agent
- Test harness: QA Agent
- Repo operating docs: Documentation Agent

## Day-1 automation policy

Automate immediately:

- CI for install, typecheck, test, and build
- standard PR structure
- request IDs and structured API responses

Leave manual for now:

- BigQuery sync
- nightly backups
- payroll, invoicing, and notification automation
- production deployment approvals

Track those in [docs/automation/DAY_1_AUTOMATION.md](/c:/Users/vivek/OneDrive/Scans/files/docs/automation/DAY_1_AUTOMATION.md).
