# Admission CRM Module

## Scope

Admission CRM is an Advanced school-plan service. Schools create admission sessions, request owner approval before launch, capture applicants, record offers and payment readiness, and convert ready applicants into Student Records.

## Tenant API Surface

All routes are mounted under `/api/admissions` and require a tenant school session with the Admission CRM service enabled.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/analytics` | Return read-only admission dashboard analytics for sessions, applicants, follow-ups, offers, payments, conversion readiness, and capacity. |
| `GET` | `/work-queue` | Return actionable applicant buckets for overdue follow-ups, document review, offers, payments, checklist completion, and student conversion. |
| `GET` | `/sessions` | List admission sessions for the current school. |
| `POST` | `/sessions` | Create a draft admission session. |
| `PUT` | `/sessions/:id` | Update a draft or denied admission session before owner-approved launch. |
| `GET` | `/sessions/:id/capacity` | Return class and section seat capacity for one session. |
| `POST` | `/sessions/:id/request-launch-approval` | Send a draft session to owner approval before launch. |
| `POST` | `/sessions/:id/reopen` | Reopen a denied launch request back to draft before requesting approval again. |
| `POST` | `/sessions/:id/close` | Close an active admission session and block new applicant intake. |
| `GET` | `/applicants` | List applicants, optionally filtered by `sessionId`. |
| `POST` | `/applicants` | Capture an applicant in an active session. |
| `PATCH` | `/applicants/:id/stage` | Move an applicant through the pipeline and record admission decisions. |
| `PATCH` | `/applicants/:id/documents/:documentKey` | Update one applicant document status. |
| `PATCH` | `/applicants/:id/follow-up` | Assign or update applicant follow-up work. |
| `POST` | `/applicants/:id/offer` | Issue a fee quote and admission offer letter. |
| `POST` | `/applicants/:id/offer/accept` | Record guardian acceptance of an issued offer. |
| `POST` | `/applicants/:id/communications` | Log guardian communication. |
| `POST` | `/applicants/:id/payment` | Record the admission payment receipt after offer acceptance. |
| `PATCH` | `/applicants/:id/enrollment-checklist` | Update enrollment readiness checklist items. |
| `POST` | `/applicants/:id/convert-to-student` | Convert an admitted, paid, checklist-ready applicant into Student Records. |

## Analytics Contract

`GET /api/admissions/analytics` returns an `AdmissionAnalyticsSummary` with:

- `totals`: session counts, applicant counts, offers, accepted offers, payments, checklist readiness, ready-to-convert count, converted count, open and due follow-ups, occupied seats, available seats, and total seats.
- `stages`: applicant counts for every admission stage.
- `sessions`: the same operational metrics per session, including the capacity summary for that session.

The analytics route is read-only and is computed from the document store. It does not change applicant state or session state.

## Session Lifecycle Rules

Admission sessions move through `draft -> pending_owner_approval -> active -> closed`. Owner denial moves a pending session to `denied`; the school admissions desk must review the owner decision note, reopen it to `draft`, and request approval again after fixing the issue.

- Draft and denied sessions can be edited by the tenant admissions desk.
- Denied sessions retain `launchDenialReason` so the school can see why the owner blocked launch.
- Pending, active, and closed sessions are locked against tenant edits.
- Applicant capture is allowed only while a session is active.
- Closing a session blocks new applicant capture without deleting existing applicant pipeline work.

## Work Queue Contract

`GET /api/admissions/work-queue` returns an `AdmissionWorkQueueSummary` grouped into:

- `due_follow_up`
- `document_review`
- `offer_pending`
- `payment_pending`
- `checklist_pending`
- `ready_to_convert`

Each item includes the applicant identity, session, grade, stage, priority, optional due time, detail text, and the next action label. The queue is read-only; the school UI uses it to focus operators on the next applicant to work.
