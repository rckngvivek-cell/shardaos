# Agent Operating Model

This repository encodes the multi-agent workflow from the planning documents in a form that is usable on day 1.

## Active roles

- `Lead Architect`: owns scope, reviews plans, enforces PRI, approves architecture changes.
- `Backend Agent`: owns API, document persistence, auth, validation, and service boundaries.
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

Every working to-do list must explicitly include:

- [ ] `Plan`
- [ ] `Review`
- [ ] `Replan if scope changes`

Use the templates in [docs/process/PRI_TEMPLATE.md](/c:/Users/vivek/OneDrive/Scans/files/docs/process/PRI_TEMPLATE.md) and [docs/process/WEEKLY_SUMMARY_TEMPLATE.md](/c:/Users/vivek/OneDrive/Scans/files/docs/process/WEEKLY_SUMMARY_TEMPLATE.md).

## Coding standards

All code written for this repository must be production-grade.

- Write high-quality implementation only. Do not ship placeholder logic, fake success paths, dead stubs, or TODO-driven behavior in active code paths unless explicitly approved and documented in the current PRI slice.
- Prefer explicit contracts at boundaries: validate inputs, use typed request and response shapes, preserve multi-tenant and platform-plane boundaries, and fail with deliberate error handling.
- Keep code cohesive and reviewable. Choose the simplest design that is correct for the current slice, and avoid speculative abstractions that are not yet needed.
- Preserve architectural consistency. New code must follow the established module boundaries, naming, response envelope shape, and route conventions selected for the repo.
- Treat security, correctness, and operability as first-class concerns. Handle authorization, validation, logging, request IDs, health behavior, and configuration deliberately instead of as follow-up cleanup.
- Add tests for behavior changes or bug fixes. If a test is intentionally deferred, record the reason and the follow-up in the PRI artifact.
- Keep documentation in sync with behavior whenever setup, workflow, routes, ports, deployment steps, or contracts change.
- Comments must explain intent, business rule, invariant, or why the code exists. Do not add comments that merely narrate obvious syntax.
- For non-trivial modules, functions, or branches, add concise intent comments where they reduce ambiguity for the next maintainer.
- Replan immediately when new facts invalidate the current slice, and do not continue implementation on stale assumptions.

## Canonical repo shape

- Current runnable workspaces are `apps/api`, `apps/owner`, `apps/employee`, `apps/school`, `apps/mobile`, and `packages/shared`.
- There is no dedicated `apps/founder` workspace in the current baseline.
- Founder-only capabilities currently live in the owner plane under `/api/owner` and `apps/owner` until a separate workspace is explicitly introduced.
- Canonical naming is `School ERP` for tenant-facing product surfaces, `ShardaOS` for the internal owner plane, and `@school-erp/*` for workspace packages.
- Legacy `deerflow` names in Terraform and older deployment assets are draft infrastructure references only and are not the runtime source of truth.

## Domain boundary rules

- `Company employees` means internal company staff managed by the owner plane. These are platform employees, not school staff.
- Company employee setup and management belongs under the internal ShardaOS owner plane, including `/api/owner/employees` and `/owner/employees`.
- `School staff` is a separate tenant-school module with separate workflows, permissions, and dashboards. It must not be modeled as the company employee module.
- When planning, naming, or implementing features, do not use the word `employee` for school staff without an explicit qualifier such as `platform employee`, `company employee`, or `school staff`.
- The current active work on employee setup and management is for company employees only unless a future PRI slice explicitly introduces the separate school-staff module.

## Ownership for this scaffold

- API and student module: Backend Agent
- Owner, employee, and school portals: Frontend Agent
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
