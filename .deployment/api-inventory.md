# API Inventory

- Total occurrences: 1103
- Unique (method, path) pairs: 975

## Endpoints

### UNSPECIFIED /api-conventions.md
- Best context: `- API conventions: `docs/contracts/api-conventions.md`.`
- Reference: `README.md:66`
- Other refs: 2

### POST /api/admin/login
- Best context: `- `POST /api/admin/login``
- Reference: `docs\runbooks\owner-login-strict.md:54`

### POST /api/admin/verify-2fa
- Best context: `- `POST /api/admin/verify-2fa``
- Reference: `docs\runbooks\owner-login-strict.md:55`

### POST /api/admin/verify-device
- Best context: `- `POST /api/admin/verify-device``
- Reference: `docs\runbooks\owner-login-strict.md:56`

### UNSPECIFIED /api/v1/...
- Best context: `- External contract style: REST under `/api/v1/...``
- Reference: `docs\architecture\baseline.md:14`
- Other refs: 1

### POST /api/v1/academic-continuity/plans
- Best context: `| `academic-continuity` | `POST /api/v1/academic-continuity/plans`, `POST /api/v1/academic-continuity/plans/:continuityPlanId/drills`, `GET /api/v1/academic-continuity/summary` | `test/academic-continuity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:92`

### POST /api/v1/academic-continuity/plans/:continuityPlanId/drills
- Best context: `| `academic-continuity` | `POST /api/v1/academic-continuity/plans`, `POST /api/v1/academic-continuity/plans/:continuityPlanId/drills`, `GET /api/v1/academic-continuity/summary` | `test/academic-continuity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:92`

### GET /api/v1/academic-continuity/summary
- Best context: `| `academic-continuity` | `POST /api/v1/academic-continuity/plans`, `POST /api/v1/academic-continuity/plans/:continuityPlanId/drills`, `GET /api/v1/academic-continuity/summary` | `test/academic-continuity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:92`

### UNSPECIFIED /api/v1/academic-terms/:academicTermId
- Best context: `router.register('GET', '/api/v1/academic-terms/:academicTermId', async ({ params }) => ({`
- Reference: `README.md:178`

### POST /api/v1/academic-years
- Best context: `| `academics` | `POST /api/v1/academic-years`, `POST /api/v1/grade-levels` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:19`

### UNSPECIFIED /api/v1/academic-years/${academicYearId}/overview
- Best context: `+  const response = await requestJson(baseUrl, `/api/v1/academic-years/${academicYearId}/overview`, { method: 'GET' });`
- Reference: `README.md:191`

### UNSPECIFIED /api/v1/academic-years/:academicYearId/overview
- Best context: `+    router.register('GET', '/api/v1/academic-years/:academicYearId/overview', async ({ params }) => (`
- Reference: `README.md:181`

### POST /api/v1/adaptive-intervention-calibration/runs
- Best context: `| `adaptive-intervention-calibration` | `POST /api/v1/adaptive-intervention-calibration/runs`, `POST /api/v1/adaptive-intervention-calibration/runs/:interventionCalibrationRunId/actions`, `GET /api/v1/adaptive-intervention-calibration/summary` | `test/adaptive-intervention-calibration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:195`

### POST /api/v1/adaptive-intervention-calibration/runs/:interventionCalibrationRunId/actions
- Best context: `| `adaptive-intervention-calibration` | `POST /api/v1/adaptive-intervention-calibration/runs`, `POST /api/v1/adaptive-intervention-calibration/runs/:interventionCalibrationRunId/actions`, `GET /api/v1/adaptive-intervention-calibration/summary` | `test/adaptive-intervention-calibration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:195`

### GET /api/v1/adaptive-intervention-calibration/summary
- Best context: `| `adaptive-intervention-calibration` | `POST /api/v1/adaptive-intervention-calibration/runs`, `POST /api/v1/adaptive-intervention-calibration/runs/:interventionCalibrationRunId/actions`, `GET /api/v1/adaptive-intervention-calibration/summary` | `test/adaptive-intervention-calibration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:195`

### POST /api/v1/adaptive-intervention-causal-efficacy/runs
- Best context: `| `adaptive-intervention-causal-efficacy` | `POST /api/v1/adaptive-intervention-causal-efficacy/runs`, `POST /api/v1/adaptive-intervention-causal-efficacy/runs/:causalEfficacyRunId/actions`, `GET /api/v1/adaptive-intervention-causal-efficacy/summary` | `test/adaptive-intervention-causal-efficacy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:205`

### POST /api/v1/adaptive-intervention-causal-efficacy/runs/:causalEfficacyRunId/actions
- Best context: `| `adaptive-intervention-causal-efficacy` | `POST /api/v1/adaptive-intervention-causal-efficacy/runs`, `POST /api/v1/adaptive-intervention-causal-efficacy/runs/:causalEfficacyRunId/actions`, `GET /api/v1/adaptive-intervention-causal-efficacy/summary` | `test/adaptive-intervention-causal-efficacy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:205`

### GET /api/v1/adaptive-intervention-causal-efficacy/summary
- Best context: `| `adaptive-intervention-causal-efficacy` | `POST /api/v1/adaptive-intervention-causal-efficacy/runs`, `POST /api/v1/adaptive-intervention-causal-efficacy/runs/:causalEfficacyRunId/actions`, `GET /api/v1/adaptive-intervention-causal-efficacy/summary` | `test/adaptive-intervention-causal-efficacy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:205`

### POST /api/v1/adaptive-pacing-robustness/runs
- Best context: `| `adaptive-pacing-robustness` | `POST /api/v1/adaptive-pacing-robustness/runs`, `POST /api/v1/adaptive-pacing-robustness/runs/:pacingRobustnessRunId/actions`, `GET /api/v1/adaptive-pacing-robustness/summary` | `test/adaptive-pacing-robustness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:185`

### POST /api/v1/adaptive-pacing-robustness/runs/:pacingRobustnessRunId/actions
- Best context: `| `adaptive-pacing-robustness` | `POST /api/v1/adaptive-pacing-robustness/runs`, `POST /api/v1/adaptive-pacing-robustness/runs/:pacingRobustnessRunId/actions`, `GET /api/v1/adaptive-pacing-robustness/summary` | `test/adaptive-pacing-robustness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:185`

### GET /api/v1/adaptive-pacing-robustness/summary
- Best context: `| `adaptive-pacing-robustness` | `POST /api/v1/adaptive-pacing-robustness/runs`, `POST /api/v1/adaptive-pacing-robustness/runs/:pacingRobustnessRunId/actions`, `GET /api/v1/adaptive-pacing-robustness/summary` | `test/adaptive-pacing-robustness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:185`

### UNSPECIFIED /api/v1/admissions/crm/dashboard?${dashboardParams.toString()}
- Best context: `api(`/api/v1/admissions/crm/dashboard?${dashboardParams.toString()}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:7386`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/journeys
- Action: Create Admissions Journey
- Best context: `const data = await runAction('Create Admissions Journey', () => api('/api/v1/admissions/crm/journeys', {`
- Reference: `services\portal-service\assets\portal-owner.js:10119`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/advance
- Best context: ``/api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/advance`,`
- Reference: `services\portal-service\assets\portal-owner.js:10149`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/applications
- Best context: ``/api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/applications`,`
- Reference: `services\portal-service\assets\portal-owner.js:10221`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/tasks
- Best context: ``/api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/tasks`,`
- Reference: `services\portal-service\assets\portal-owner.js:10173`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/visits
- Best context: ``/api/v1/admissions/crm/journeys/${encodeURIComponent(journeyId)}/visits`,`
- Reference: `services\portal-service\assets\portal-owner.js:10197`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/journeys?${params.toString()}
- Best context: `api(`/api/v1/admissions/crm/journeys?${params.toString()}`)`
- Reference: `services\portal-service\assets\portal-owner.js:7387`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/run-due
- Best context: `'/api/v1/admissions/crm/run-due',`
- Reference: `services\portal-service\assets\portal-owner.js:10257`
- Other refs: 1

### UNSPECIFIED /api/v1/admissions/crm/tasks/${encodeURIComponent(crmTaskId)}/complete
- Best context: ``/api/v1/admissions/crm/tasks/${encodeURIComponent(crmTaskId)}/complete`,`
- Reference: `services\portal-service\assets\portal-owner.js:10240`
- Other refs: 1

### POST /api/v1/ai-safety/suites
- Best context: `| `ai-safety-lab` | `POST /api/v1/ai-safety/suites`, `POST /api/v1/ai-safety/suites/:suiteId/runs` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:13`

### POST /api/v1/ai-safety/suites/:suiteId/runs
- Best context: `| `ai-safety-lab` | `POST /api/v1/ai-safety/suites`, `POST /api/v1/ai-safety/suites/:suiteId/runs` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:13`

### GET /api/v1/ai-tutor/impact
- Best context: `| `ai-tutor-ops` | `POST /api/v1/ai-tutor/sessions`, `POST /api/v1/ai-tutor/sessions/:tutorSessionId/flag`, `GET /api/v1/ai-tutor/impact` | `test/ai-tutor-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:84`

### POST /api/v1/ai-tutor/sessions
- Best context: `| `ai-tutor-ops` | `POST /api/v1/ai-tutor/sessions`, `POST /api/v1/ai-tutor/sessions/:tutorSessionId/flag`, `GET /api/v1/ai-tutor/impact` | `test/ai-tutor-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:84`

### POST /api/v1/ai-tutor/sessions/:tutorSessionId/flag
- Best context: `| `ai-tutor-ops` | `POST /api/v1/ai-tutor/sessions`, `POST /api/v1/ai-tutor/sessions/:tutorSessionId/flag`, `GET /api/v1/ai-tutor/impact` | `test/ai-tutor-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:84`

### GET /api/v1/ai/consents
- Best context: `### 31.5 GET /api/v1/ai/consents`
- Reference: `docs\architecture\llm-architecture-spec.md:655`

### POST /api/v1/ai/consents
- Best context: `### 31.4 POST /api/v1/ai/consents`
- Reference: `docs\architecture\llm-architecture-spec.md:644`

### POST /api/v1/ai/models
- Best context: `| `ai-governance` | `POST /api/v1/ai/runs`, `POST /api/v1/ai/models`, `POST /api/v1/ai/routing-policies`, `POST /api/v1/ai/routing/resolve`, `POST /api/v1/ai/simulation-compliance`, `POST /api/v1/lesson-plans:draft`, `POST /api/v1/question-bank/items:draft` | `test/ai-governance.test.mjs`, `test/ai-routing.test.mjs`, `test/ai-simulation-compliance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-governance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-drafts.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:82`

### POST /api/v1/ai/routing-policies
- Best context: `| `ai-governance` | `POST /api/v1/ai/runs`, `POST /api/v1/ai/models`, `POST /api/v1/ai/routing-policies`, `POST /api/v1/ai/routing/resolve`, `POST /api/v1/ai/simulation-compliance`, `POST /api/v1/lesson-plans:draft`, `POST /api/v1/question-bank/items:draft` | `test/ai-governance.test.mjs`, `test/ai-routing.test.mjs`, `test/ai-simulation-compliance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-governance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-drafts.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:82`

### POST /api/v1/ai/routing/resolve
- Best context: `| `ai-governance` | `POST /api/v1/ai/runs`, `POST /api/v1/ai/models`, `POST /api/v1/ai/routing-policies`, `POST /api/v1/ai/routing/resolve`, `POST /api/v1/ai/simulation-compliance`, `POST /api/v1/lesson-plans:draft`, `POST /api/v1/question-bank/items:draft` | `test/ai-governance.test.mjs`, `test/ai-routing.test.mjs`, `test/ai-simulation-compliance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-governance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-drafts.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:82`

### POST /api/v1/ai/runs
- Best context: `### 31.1 POST /api/v1/ai/runs`
- Reference: `docs\architecture\llm-architecture-spec.md:604`
- Other refs: 1

### GET /api/v1/ai/runs/:runId
- Best context: `### 31.2 GET /api/v1/ai/runs/:runId`
- Reference: `docs\architecture\llm-architecture-spec.md:623`

### POST /api/v1/ai/simulation-compliance
- Best context: `| `ai-governance` | `POST /api/v1/ai/runs`, `POST /api/v1/ai/models`, `POST /api/v1/ai/routing-policies`, `POST /api/v1/ai/routing/resolve`, `POST /api/v1/ai/simulation-compliance`, `POST /api/v1/lesson-plans:draft`, `POST /api/v1/question-bank/items:draft` | `test/ai-governance.test.mjs`, `test/ai-routing.test.mjs`, `test/ai-simulation-compliance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-governance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-drafts.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:82`

### POST /api/v1/ai/tools/execute
- Best context: `### 31.3 POST /api/v1/ai/tools/execute`
- Reference: `docs\architecture\llm-architecture-spec.md:630`

### GET /api/v1/alerts
- Best context: `2. Verify SLA drift visibility with `GET /api/v1/integration-hub/sla-drift` and confirm alerts appear in `GET /api/v1/alerts`.`
- Reference: `docs\runbooks\deployment.md:80`

### POST /api/v1/algorithm-transparency/reports
- Best context: `| `algorithm-transparency` | `POST /api/v1/algorithm-transparency/reports`, `POST /api/v1/algorithm-transparency/reports/:reportId/reviews` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:58`

### POST /api/v1/algorithm-transparency/reports/:reportId/reviews
- Best context: `| `algorithm-transparency` | `POST /api/v1/algorithm-transparency/reports`, `POST /api/v1/algorithm-transparency/reports/:reportId/reviews` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:58`

### POST /api/v1/alignment-scorecards
- Best context: `| `alignment-scorecards` | `POST /api/v1/alignment-scorecards`, `POST /api/v1/alignment-scorecards/:scorecardId/signals` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:81`

### POST /api/v1/alignment-scorecards/:scorecardId/signals
- Best context: `| `alignment-scorecards` | `POST /api/v1/alignment-scorecards`, `POST /api/v1/alignment-scorecards/:scorecardId/signals` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:81`

### GET /api/v1/analytics/snapshots
- Best context: `| `analytics` | `GET /api/v1/analytics/snapshots`, `GET /api/v1/reports/operator-dashboard/trends` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:77`

### POST /api/v1/applications
- Best context: `| `student-lifecycle` | `POST /api/v1/applications`, `POST /api/v1/students/from-application` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:17`

### POST /api/v1/assessment-accessibility-reliability/reviews
- Best context: `| `assessment-accessibility-reliability` | `POST /api/v1/assessment-accessibility-reliability/reviews`, `POST /api/v1/assessment-accessibility-reliability/reviews/:accessibilityReviewId/findings`, `GET /api/v1/assessment-accessibility-reliability/summary` | `test/assessment-accessibility-reliability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:169`

### POST /api/v1/assessment-accessibility-reliability/reviews/:accessibilityReviewId/findings
- Best context: `| `assessment-accessibility-reliability` | `POST /api/v1/assessment-accessibility-reliability/reviews`, `POST /api/v1/assessment-accessibility-reliability/reviews/:accessibilityReviewId/findings`, `GET /api/v1/assessment-accessibility-reliability/summary` | `test/assessment-accessibility-reliability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:169`

### GET /api/v1/assessment-accessibility-reliability/summary
- Best context: `| `assessment-accessibility-reliability` | `POST /api/v1/assessment-accessibility-reliability/reviews`, `POST /api/v1/assessment-accessibility-reliability/reviews/:accessibilityReviewId/findings`, `GET /api/v1/assessment-accessibility-reliability/summary` | `test/assessment-accessibility-reliability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:169`

### POST /api/v1/assessment-accommodation-integrity/reviews
- Best context: `| `assessment-accommodation-integrity` | `POST /api/v1/assessment-accommodation-integrity/reviews`, `POST /api/v1/assessment-accommodation-integrity/reviews/:accommodationReviewId/findings`, `GET /api/v1/assessment-accommodation-integrity/summary` | `test/assessment-accommodation-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:159`

### POST /api/v1/assessment-accommodation-integrity/reviews/:accommodationReviewId/findings
- Best context: `| `assessment-accommodation-integrity` | `POST /api/v1/assessment-accommodation-integrity/reviews`, `POST /api/v1/assessment-accommodation-integrity/reviews/:accommodationReviewId/findings`, `GET /api/v1/assessment-accommodation-integrity/summary` | `test/assessment-accommodation-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:159`

### GET /api/v1/assessment-accommodation-integrity/summary
- Best context: `| `assessment-accommodation-integrity` | `POST /api/v1/assessment-accommodation-integrity/reviews`, `POST /api/v1/assessment-accommodation-integrity/reviews/:accommodationReviewId/findings`, `GET /api/v1/assessment-accommodation-integrity/summary` | `test/assessment-accommodation-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:159`

### POST /api/v1/assessment-authenticity-assurance/scans
- Best context: `| `assessment-authenticity-assurance` | `POST /api/v1/assessment-authenticity-assurance/scans`, `POST /api/v1/assessment-authenticity-assurance/scans/:authenticityScanId/findings`, `GET /api/v1/assessment-authenticity-assurance/summary` | `test/assessment-authenticity-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:164`

### POST /api/v1/assessment-authenticity-assurance/scans/:authenticityScanId/findings
- Best context: `| `assessment-authenticity-assurance` | `POST /api/v1/assessment-authenticity-assurance/scans`, `POST /api/v1/assessment-authenticity-assurance/scans/:authenticityScanId/findings`, `GET /api/v1/assessment-authenticity-assurance/summary` | `test/assessment-authenticity-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:164`

### GET /api/v1/assessment-authenticity-assurance/summary
- Best context: `| `assessment-authenticity-assurance` | `POST /api/v1/assessment-authenticity-assurance/scans`, `POST /api/v1/assessment-authenticity-assurance/scans/:authenticityScanId/findings`, `GET /api/v1/assessment-authenticity-assurance/summary` | `test/assessment-authenticity-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:164`

### POST /api/v1/assessment-calibration/runs
- Best context: `| `assessment-calibration` | `POST /api/v1/assessment-calibration/runs`, `POST /api/v1/assessment-calibration/runs/:calibrationRunId/findings`, `GET /api/v1/assessment-calibration/summary` | `test/assessment-calibration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:114`

### POST /api/v1/assessment-calibration/runs/:calibrationRunId/findings
- Best context: `| `assessment-calibration` | `POST /api/v1/assessment-calibration/runs`, `POST /api/v1/assessment-calibration/runs/:calibrationRunId/findings`, `GET /api/v1/assessment-calibration/summary` | `test/assessment-calibration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:114`

### GET /api/v1/assessment-calibration/summary
- Best context: `| `assessment-calibration` | `POST /api/v1/assessment-calibration/runs`, `POST /api/v1/assessment-calibration/runs/:calibrationRunId/findings`, `GET /api/v1/assessment-calibration/summary` | `test/assessment-calibration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:114`

### POST /api/v1/assessment-comparability/runs
- Best context: `| `assessment-comparability` | `POST /api/v1/assessment-comparability/runs`, `POST /api/v1/assessment-comparability/runs/:comparabilityRunId/findings`, `GET /api/v1/assessment-comparability/summary` | `test/assessment-comparability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:119`

### POST /api/v1/assessment-comparability/runs/:comparabilityRunId/findings
- Best context: `| `assessment-comparability` | `POST /api/v1/assessment-comparability/runs`, `POST /api/v1/assessment-comparability/runs/:comparabilityRunId/findings`, `GET /api/v1/assessment-comparability/summary` | `test/assessment-comparability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:119`

### GET /api/v1/assessment-comparability/summary
- Best context: `| `assessment-comparability` | `POST /api/v1/assessment-comparability/runs`, `POST /api/v1/assessment-comparability/runs/:comparabilityRunId/findings`, `GET /api/v1/assessment-comparability/summary` | `test/assessment-comparability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:119`

### POST /api/v1/assessment-context-adaptivity/reviews
- Best context: `| `assessment-context-adaptivity` | `POST /api/v1/assessment-context-adaptivity/reviews`, `POST /api/v1/assessment-context-adaptivity/reviews/:adaptivityReviewId/findings`, `GET /api/v1/assessment-context-adaptivity/summary` | `test/assessment-context-adaptivity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:144`

### POST /api/v1/assessment-context-adaptivity/reviews/:adaptivityReviewId/findings
- Best context: `| `assessment-context-adaptivity` | `POST /api/v1/assessment-context-adaptivity/reviews`, `POST /api/v1/assessment-context-adaptivity/reviews/:adaptivityReviewId/findings`, `GET /api/v1/assessment-context-adaptivity/summary` | `test/assessment-context-adaptivity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:144`

### GET /api/v1/assessment-context-adaptivity/summary
- Best context: `| `assessment-context-adaptivity` | `POST /api/v1/assessment-context-adaptivity/reviews`, `POST /api/v1/assessment-context-adaptivity/reviews/:adaptivityReviewId/findings`, `GET /api/v1/assessment-context-adaptivity/summary` | `test/assessment-context-adaptivity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:144`

### POST /api/v1/assessment-explainability/reviews
- Best context: `| `assessment-explainability` | `POST /api/v1/assessment-explainability/reviews`, `POST /api/v1/assessment-explainability/reviews/:explainabilityReviewId/findings`, `GET /api/v1/assessment-explainability/summary` | `test/assessment-explainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:134`

### POST /api/v1/assessment-explainability/reviews/:explainabilityReviewId/findings
- Best context: `| `assessment-explainability` | `POST /api/v1/assessment-explainability/reviews`, `POST /api/v1/assessment-explainability/reviews/:explainabilityReviewId/findings`, `GET /api/v1/assessment-explainability/summary` | `test/assessment-explainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:134`

### GET /api/v1/assessment-explainability/summary
- Best context: `| `assessment-explainability` | `POST /api/v1/assessment-explainability/reviews`, `POST /api/v1/assessment-explainability/reviews/:explainabilityReviewId/findings`, `GET /api/v1/assessment-explainability/summary` | `test/assessment-explainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:134`

### POST /api/v1/assessment-fairness/audits
- Best context: `| `assessment-fairness` | `POST /api/v1/assessment-fairness/audits`, `POST /api/v1/assessment-fairness/audits/:auditId/findings`, `GET /api/v1/assessment-fairness/summary` | `test/assessment-fairness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:104`

### POST /api/v1/assessment-fairness/audits/:auditId/findings
- Best context: `| `assessment-fairness` | `POST /api/v1/assessment-fairness/audits`, `POST /api/v1/assessment-fairness/audits/:auditId/findings`, `GET /api/v1/assessment-fairness/summary` | `test/assessment-fairness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:104`

### GET /api/v1/assessment-fairness/summary
- Best context: `| `assessment-fairness` | `POST /api/v1/assessment-fairness/audits`, `POST /api/v1/assessment-fairness/audits/:auditId/findings`, `GET /api/v1/assessment-fairness/summary` | `test/assessment-fairness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:104`

### POST /api/v1/assessment-integrity/scans
- Best context: `| `assessment-integrity` | `POST /api/v1/assessment-integrity/scans`, `POST /api/v1/assessment-integrity/scans/:integrityScanId/incidents`, `GET /api/v1/assessment-integrity/summary` | `test/assessment-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:93`

### POST /api/v1/assessment-integrity/scans/:integrityScanId/incidents
- Best context: `| `assessment-integrity` | `POST /api/v1/assessment-integrity/scans`, `POST /api/v1/assessment-integrity/scans/:integrityScanId/incidents`, `GET /api/v1/assessment-integrity/summary` | `test/assessment-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:93`

### GET /api/v1/assessment-integrity/summary
- Best context: `| `assessment-integrity` | `POST /api/v1/assessment-integrity/scans`, `POST /api/v1/assessment-integrity/scans/:integrityScanId/incidents`, `GET /api/v1/assessment-integrity/summary` | `test/assessment-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:93`

### POST /api/v1/assessment-item-provenance/scans
- Best context: `| `assessment-item-provenance` | `POST /api/v1/assessment-item-provenance/scans`, `POST /api/v1/assessment-item-provenance/scans/:provenanceScanId/findings`, `GET /api/v1/assessment-item-provenance/summary` | `test/assessment-item-provenance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:174`

### POST /api/v1/assessment-item-provenance/scans/:provenanceScanId/findings
- Best context: `| `assessment-item-provenance` | `POST /api/v1/assessment-item-provenance/scans`, `POST /api/v1/assessment-item-provenance/scans/:provenanceScanId/findings`, `GET /api/v1/assessment-item-provenance/summary` | `test/assessment-item-provenance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:174`

### GET /api/v1/assessment-item-provenance/summary
- Best context: `| `assessment-item-provenance` | `POST /api/v1/assessment-item-provenance/scans`, `POST /api/v1/assessment-item-provenance/scans/:provenanceScanId/findings`, `GET /api/v1/assessment-item-provenance/summary` | `test/assessment-item-provenance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:174`

### POST /api/v1/assessment-longitudinal-consistency/runs
- Best context: `| `assessment-longitudinal-consistency` | `POST /api/v1/assessment-longitudinal-consistency/runs`, `POST /api/v1/assessment-longitudinal-consistency/runs/:consistencyRunId/findings`, `GET /api/v1/assessment-longitudinal-consistency/summary` | `test/assessment-longitudinal-consistency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:124`

### POST /api/v1/assessment-longitudinal-consistency/runs/:consistencyRunId/findings
- Best context: `| `assessment-longitudinal-consistency` | `POST /api/v1/assessment-longitudinal-consistency/runs`, `POST /api/v1/assessment-longitudinal-consistency/runs/:consistencyRunId/findings`, `GET /api/v1/assessment-longitudinal-consistency/summary` | `test/assessment-longitudinal-consistency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:124`

### GET /api/v1/assessment-longitudinal-consistency/summary
- Best context: `| `assessment-longitudinal-consistency` | `POST /api/v1/assessment-longitudinal-consistency/runs`, `POST /api/v1/assessment-longitudinal-consistency/runs/:consistencyRunId/findings`, `GET /api/v1/assessment-longitudinal-consistency/summary` | `test/assessment-longitudinal-consistency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:124`

### POST /api/v1/assessment-misconduct-forensics/scans
- Best context: `| `assessment-misconduct-forensics` | `POST /api/v1/assessment-misconduct-forensics/scans`, `POST /api/v1/assessment-misconduct-forensics/scans/:misconductScanId/findings`, `GET /api/v1/assessment-misconduct-forensics/summary` | `test/assessment-misconduct-forensics.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:154`

### POST /api/v1/assessment-misconduct-forensics/scans/:misconductScanId/findings
- Best context: `| `assessment-misconduct-forensics` | `POST /api/v1/assessment-misconduct-forensics/scans`, `POST /api/v1/assessment-misconduct-forensics/scans/:misconductScanId/findings`, `GET /api/v1/assessment-misconduct-forensics/summary` | `test/assessment-misconduct-forensics.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:154`

### GET /api/v1/assessment-misconduct-forensics/summary
- Best context: `| `assessment-misconduct-forensics` | `POST /api/v1/assessment-misconduct-forensics/scans`, `POST /api/v1/assessment-misconduct-forensics/scans/:misconductScanId/findings`, `GET /api/v1/assessment-misconduct-forensics/summary` | `test/assessment-misconduct-forensics.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:154`

### POST /api/v1/assessment-model-robustness/scans
- Best context: `| `assessment-model-robustness` | `POST /api/v1/assessment-model-robustness/scans`, `POST /api/v1/assessment-model-robustness/scans/:robustnessScanId/findings`, `GET /api/v1/assessment-model-robustness/summary` | `test/assessment-model-robustness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:139`

### POST /api/v1/assessment-model-robustness/scans/:robustnessScanId/findings
- Best context: `| `assessment-model-robustness` | `POST /api/v1/assessment-model-robustness/scans`, `POST /api/v1/assessment-model-robustness/scans/:robustnessScanId/findings`, `GET /api/v1/assessment-model-robustness/summary` | `test/assessment-model-robustness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:139`

### GET /api/v1/assessment-model-robustness/summary
- Best context: `| `assessment-model-robustness` | `POST /api/v1/assessment-model-robustness/scans`, `POST /api/v1/assessment-model-robustness/scans/:robustnessScanId/findings`, `GET /api/v1/assessment-model-robustness/summary` | `test/assessment-model-robustness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:139`

### POST /api/v1/assessment-proctoring-integrity/scans
- Best context: `| `assessment-proctoring-integrity` | `POST /api/v1/assessment-proctoring-integrity/scans`, `POST /api/v1/assessment-proctoring-integrity/scans/:proctoringScanId/findings`, `GET /api/v1/assessment-proctoring-integrity/summary` | `test/assessment-proctoring-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:149`

### POST /api/v1/assessment-proctoring-integrity/scans/:proctoringScanId/findings
- Best context: `| `assessment-proctoring-integrity` | `POST /api/v1/assessment-proctoring-integrity/scans`, `POST /api/v1/assessment-proctoring-integrity/scans/:proctoringScanId/findings`, `GET /api/v1/assessment-proctoring-integrity/summary` | `test/assessment-proctoring-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:149`

### GET /api/v1/assessment-proctoring-integrity/summary
- Best context: `| `assessment-proctoring-integrity` | `POST /api/v1/assessment-proctoring-integrity/scans`, `POST /api/v1/assessment-proctoring-integrity/scans/:proctoringScanId/findings`, `GET /api/v1/assessment-proctoring-integrity/summary` | `test/assessment-proctoring-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:149`

### POST /api/v1/assessment-quality/analyses
- Best context: `| `assessment-quality` | `POST /api/v1/assessment-quality/analyses`, `POST /api/v1/assessment-quality/analyses/:analysisId/findings`, `GET /api/v1/assessment-quality/summary` | `test/assessment-quality.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:99`

### POST /api/v1/assessment-quality/analyses/:analysisId/findings
- Best context: `| `assessment-quality` | `POST /api/v1/assessment-quality/analyses`, `POST /api/v1/assessment-quality/analyses/:analysisId/findings`, `GET /api/v1/assessment-quality/summary` | `test/assessment-quality.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:99`

### GET /api/v1/assessment-quality/summary
- Best context: `| `assessment-quality` | `POST /api/v1/assessment-quality/analyses`, `POST /api/v1/assessment-quality/analyses/:analysisId/findings`, `GET /api/v1/assessment-quality/summary` | `test/assessment-quality.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:99`

### POST /api/v1/assessment-recovery-integrity/reviews
- Best context: `| `assessment-recovery-integrity` | `POST /api/v1/assessment-recovery-integrity/reviews`, `POST /api/v1/assessment-recovery-integrity/reviews/:recoveryIntegrityReviewId/findings`, `GET /api/v1/assessment-recovery-integrity/summary` | `test/assessment-recovery-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:192`

### POST /api/v1/assessment-recovery-integrity/reviews/:recoveryIntegrityReviewId/findings
- Best context: `| `assessment-recovery-integrity` | `POST /api/v1/assessment-recovery-integrity/reviews`, `POST /api/v1/assessment-recovery-integrity/reviews/:recoveryIntegrityReviewId/findings`, `GET /api/v1/assessment-recovery-integrity/summary` | `test/assessment-recovery-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:192`

### GET /api/v1/assessment-recovery-integrity/summary
- Best context: `| `assessment-recovery-integrity` | `POST /api/v1/assessment-recovery-integrity/reviews`, `POST /api/v1/assessment-recovery-integrity/reviews/:recoveryIntegrityReviewId/findings`, `GET /api/v1/assessment-recovery-integrity/summary` | `test/assessment-recovery-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:192`

### POST /api/v1/assessment-retake-bias-drift/reviews
- Best context: `| `assessment-retake-bias-drift` | `POST /api/v1/assessment-retake-bias-drift/reviews`, `POST /api/v1/assessment-retake-bias-drift/reviews/:retakeBiasReviewId/findings`, `GET /api/v1/assessment-retake-bias-drift/summary` | `test/assessment-retake-bias-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:212`

### POST /api/v1/assessment-retake-bias-drift/reviews/:retakeBiasReviewId/findings
- Best context: `| `assessment-retake-bias-drift` | `POST /api/v1/assessment-retake-bias-drift/reviews`, `POST /api/v1/assessment-retake-bias-drift/reviews/:retakeBiasReviewId/findings`, `GET /api/v1/assessment-retake-bias-drift/summary` | `test/assessment-retake-bias-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:212`

### GET /api/v1/assessment-retake-bias-drift/summary
- Best context: `| `assessment-retake-bias-drift` | `POST /api/v1/assessment-retake-bias-drift/reviews`, `POST /api/v1/assessment-retake-bias-drift/reviews/:retakeBiasReviewId/findings`, `GET /api/v1/assessment-retake-bias-drift/summary` | `test/assessment-retake-bias-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:212`

### POST /api/v1/assessment-retake-equivalence/reviews
- Best context: `| `assessment-retake-equivalence` | `POST /api/v1/assessment-retake-equivalence/reviews`, `POST /api/v1/assessment-retake-equivalence/reviews/:retakeEquivalenceReviewId/findings`, `GET /api/v1/assessment-retake-equivalence/summary` | `test/assessment-retake-equivalence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:202`

### POST /api/v1/assessment-retake-equivalence/reviews/:retakeEquivalenceReviewId/findings
- Best context: `| `assessment-retake-equivalence` | `POST /api/v1/assessment-retake-equivalence/reviews`, `POST /api/v1/assessment-retake-equivalence/reviews/:retakeEquivalenceReviewId/findings`, `GET /api/v1/assessment-retake-equivalence/summary` | `test/assessment-retake-equivalence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:202`

### GET /api/v1/assessment-retake-equivalence/summary
- Best context: `| `assessment-retake-equivalence` | `POST /api/v1/assessment-retake-equivalence/reviews`, `POST /api/v1/assessment-retake-equivalence/reviews/:retakeEquivalenceReviewId/findings`, `GET /api/v1/assessment-retake-equivalence/summary` | `test/assessment-retake-equivalence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:202`

### POST /api/v1/assessment-security-resilience/scans
- Best context: `| `assessment-security-resilience` | `POST /api/v1/assessment-security-resilience/scans`, `POST /api/v1/assessment-security-resilience/scans/:resilienceScanId/findings`, `GET /api/v1/assessment-security-resilience/summary` | `test/assessment-security-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:129`

### POST /api/v1/assessment-security-resilience/scans/:resilienceScanId/findings
- Best context: `| `assessment-security-resilience` | `POST /api/v1/assessment-security-resilience/scans`, `POST /api/v1/assessment-security-resilience/scans/:resilienceScanId/findings`, `GET /api/v1/assessment-security-resilience/summary` | `test/assessment-security-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:129`

### GET /api/v1/assessment-security-resilience/summary
- Best context: `| `assessment-security-resilience` | `POST /api/v1/assessment-security-resilience/scans`, `POST /api/v1/assessment-security-resilience/scans/:resilienceScanId/findings`, `GET /api/v1/assessment-security-resilience/summary` | `test/assessment-security-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:129`

### POST /api/v1/assessment-stress-risk/reviews
- Best context: `| `assessment-stress-risk` | `POST /api/v1/assessment-stress-risk/reviews`, `POST /api/v1/assessment-stress-risk/reviews/:stressReviewId/findings`, `GET /api/v1/assessment-stress-risk/summary` | `test/assessment-stress-risk.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:179`

### POST /api/v1/assessment-stress-risk/reviews/:stressReviewId/findings
- Best context: `| `assessment-stress-risk` | `POST /api/v1/assessment-stress-risk/reviews`, `POST /api/v1/assessment-stress-risk/reviews/:stressReviewId/findings`, `GET /api/v1/assessment-stress-risk/summary` | `test/assessment-stress-risk.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:179`

### GET /api/v1/assessment-stress-risk/summary
- Best context: `| `assessment-stress-risk` | `POST /api/v1/assessment-stress-risk/reviews`, `POST /api/v1/assessment-stress-risk/reviews/:stressReviewId/findings`, `GET /api/v1/assessment-stress-risk/summary` | `test/assessment-stress-risk.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:179`

### POST /api/v1/assessment-validity/reviews
- Best context: `| `assessment-validity` | `POST /api/v1/assessment-validity/reviews`, `POST /api/v1/assessment-validity/reviews/:validityReviewId/findings`, `GET /api/v1/assessment-validity/summary` | `test/assessment-validity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:109`

### POST /api/v1/assessment-validity/reviews/:validityReviewId/findings
- Best context: `| `assessment-validity` | `POST /api/v1/assessment-validity/reviews`, `POST /api/v1/assessment-validity/reviews/:validityReviewId/findings`, `GET /api/v1/assessment-validity/summary` | `test/assessment-validity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:109`

### GET /api/v1/assessment-validity/summary
- Best context: `| `assessment-validity` | `POST /api/v1/assessment-validity/reviews`, `POST /api/v1/assessment-validity/reviews/:validityReviewId/findings`, `GET /api/v1/assessment-validity/summary` | `test/assessment-validity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:109`

### POST /api/v1/assessments/blueprints
- Best context: `| `adaptive-assessment` | `POST /api/v1/assessments/blueprints`, `POST /api/v1/assessments/sessions` | `test/assessment-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:38`

### POST /api/v1/assessments/sessions
- Best context: `| `adaptive-assessment` | `POST /api/v1/assessments/blueprints`, `POST /api/v1/assessments/sessions` | `test/assessment-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:38`

### GET /api/v1/assets
- Best context: `| `operations` | `GET /api/v1/assets`, `GET /api/v1/facilities` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:74`

### POST /api/v1/assignments
- Best context: `| `lms` | `POST /api/v1/lesson-plans`, `POST /api/v1/assignments` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:22`

### POST /api/v1/assurance-cases
- Best context: `| `assurance-case-registry` | `POST /api/v1/assurance-cases`, `POST /api/v1/assurance-cases/:caseId/evidence` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:91`

### POST /api/v1/assurance-cases/:caseId/evidence
- Best context: `| `assurance-case-registry` | `POST /api/v1/assurance-cases`, `POST /api/v1/assurance-cases/:caseId/evidence` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:91`

### POST /api/v1/attendance/mark
- Best context: `| `attendance` | `POST /api/v1/attendance/mark`, `GET /api/v1/students/:studentId/attendance` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:21`

### GET /api/v1/audit/events
- Best context: `| `governance` | `POST /api/v1/policies`, `GET /api/v1/audit/events` | `test/platform-kernel.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:14`

### UNSPECIFIED /api/v1/audit/events?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=200
- Best context: `api(`/api/v1/audit/events?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=200`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7085`

### UNSPECIFIED /api/v1/auth/owner/activation:finish
- Best context: `const data = await apiRequest('/api/v1/auth/owner/activation:finish', {`
- Reference: `services\portal-service\assets\owner-activate.js:194`

### POST /api/v1/auth/owner/activation:finish
- Best context: `- `POST /api/v1/auth/owner/activation:finish``
- Reference: `docs\runbooks\owner-system-implementation-phases.md:433`

### UNSPECIFIED /api/v1/auth/owner/activation:start
- Best context: `const data = await apiRequest('/api/v1/auth/owner/activation:start', {`
- Reference: `services\portal-service\assets\owner-activate.js:160`

### POST /api/v1/auth/owner/activation:start
- Best context: ``POST /api/v1/auth/owner/activation:start` now blocks if the tenant is in single-owner mode.`
- Reference: `docs\runbooks\owner-identity-governance.md:93`
- Other refs: 1

### POST /api/v1/auth/owner/bootstrap:finish
- Best context: `- `POST /api/v1/auth/owner/bootstrap:finish``
- Reference: `docs\runbooks\owner-system-implementation-phases.md:270`

### POST /api/v1/auth/owner/bootstrap:start
- Best context: `- `POST /api/v1/auth/owner/bootstrap:start``
- Reference: `docs\runbooks\owner-system-implementation-phases.md:269`

### POST /api/v1/auth/owner/devices
- Best context: `- `POST /api/v1/auth/owner/devices``
- Reference: `docs\runbooks\owner-login-strict.md:87`

### UNSPECIFIED /api/v1/auth/owner/invitations
- Best context: `'/api/v1/auth/owner/invitations',`
- Reference: `services\portal-service\assets\portal-owner.js:8377`

### POST /api/v1/auth/owner/invitations
- Best context: `- `POST /api/v1/auth/owner/invitations``
- Reference: `docs\runbooks\owner-system-implementation-phases.md:430`

### UNSPECIFIED /api/v1/auth/owner/invitations/${encodeURIComponent(safeTokenId)}/revoke
- Best context: ``/api/v1/auth/owner/invitations/${encodeURIComponent(safeTokenId)}/revoke`,`
- Reference: `services\portal-service\assets\portal-owner.js:8412`

### POST /api/v1/auth/owner/invitations/:tokenId/revoke
- Best context: `- `POST /api/v1/auth/owner/invitations/:tokenId/revoke``
- Reference: `docs\runbooks\owner-system-implementation-phases.md:431`

### UNSPECIFIED /api/v1/auth/owner/invitations?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=50
- Best context: `api(`/api/v1/auth/owner/invitations?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=50`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7084`

### UNSPECIFIED /api/v1/auth/owner/login:finish
- Best context: `- completes `/api/v1/auth/owner/login:finish``
- Reference: `docs\runbooks\owner-login-strict.md:140`
- Other refs: 2

### POST /api/v1/auth/owner/login:finish
- Best context: `3. `POST /api/v1/auth/owner/login:finish``
- Reference: `docs\runbooks\owner-login-strict.md:46`

### UNSPECIFIED /api/v1/auth/owner/login:register-key
- Best context: `: '/api/v1/auth/owner/login:register-key';`
- Reference: `services\portal-service\assets\portal-owner.js:2818`

### POST /api/v1/auth/owner/login:register-key
- Best context: `2. `POST /api/v1/auth/owner/login:register-key``
- Reference: `docs\runbooks\owner-login-strict.md:43`

### UNSPECIFIED /api/v1/auth/password/login
- Action: Login
- Best context: `const data = await runAction('Login', () => apiRequest('/api/v1/auth/password/login', {`
- Reference: `services\portal-service\assets\portal.js:2753`
- Other refs: 2

### POST /api/v1/auth/password/login
- Best context: `1. `POST /api/v1/auth/password/login``
- Reference: `docs\runbooks\owner-login-strict.md:40`
- Other refs: 1

### UNSPECIFIED /api/v1/auth/platform-owner/access-model
- Best context: `2. switch `/owner` public access-state loading to `/api/v1/auth/platform-owner/access-model``
- Reference: `docs\runbooks\platform-root-owner-implementation-phases.md:217`
- Other refs: 1

### UNSPECIFIED /api/v1/auth/platform-owner/activity?${params.toString()}
- Best context: `const payload = await api(`/api/v1/auth/platform-owner/activity?${params.toString()}`);`
- Reference: `services\portal-service\assets\portal-owner.js:6679`

### UNSPECIFIED /api/v1/auth/platform-owner/authority
- Best context: `? await api('/api/v1/auth/platform-owner/authority').catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:6953`

### UNSPECIFIED /api/v1/auth/platform-owner/bootstrap:finish
- Best context: `const data = await apiRequest('/api/v1/auth/platform-owner/bootstrap:finish', {`
- Reference: `services\portal-service\assets\owner-bootstrap.js:238`

### POST /api/v1/auth/platform-owner/bootstrap:finish
- Best context: `- `POST /api/v1/auth/platform-owner/bootstrap:finish``
- Reference: `docs\runbooks\owner-system-spec.md:139`

### UNSPECIFIED /api/v1/auth/platform-owner/bootstrap:start
- Best context: `const data = await apiRequest('/api/v1/auth/platform-owner/bootstrap:start', {`
- Reference: `services\portal-service\assets\owner-bootstrap.js:194`

### POST /api/v1/auth/platform-owner/bootstrap:start
- Best context: `- `POST /api/v1/auth/platform-owner/bootstrap:start``
- Reference: `docs\runbooks\owner-system-spec.md:138`

### UNSPECIFIED /api/v1/auth/platform-owner/devices/${encodeURIComponent(device.device_id)}/retire
- Best context: `const data = await api(`/api/v1/auth/platform-owner/devices/${encodeURIComponent(device.device_id)}/retire`, {`
- Reference: `services\portal-service\assets\portal-owner.js:6423`

### UNSPECIFIED /api/v1/auth/platform-owner/login:finish
- Best context: `? '/api/v1/auth/platform-owner/login:finish'`
- Reference: `services\portal-service\assets\portal-owner.js:9560`

### POST /api/v1/auth/platform-owner/login:finish
- Best context: `7. Owner completes final verification using `POST /api/v1/auth/platform-owner/login:finish``
- Reference: `docs\runbooks\owner-system-spec.md:133`

### UNSPECIFIED /api/v1/auth/platform-owner/login:register-key
- Best context: `? '/api/v1/auth/platform-owner/login:register-key'`
- Reference: `services\portal-service\assets\portal-owner.js:2817`

### POST /api/v1/auth/platform-owner/login:register-key
- Best context: `6. If no hardware key is registered, the flow calls `POST /api/v1/auth/platform-owner/login:register-key``
- Reference: `docs\runbooks\owner-system-spec.md:132`

### UNSPECIFIED /api/v1/auth/platform-owner/login:start
- Best context: `? '/api/v1/auth/platform-owner/login:start'`
- Reference: `services\portal-service\assets\portal-owner.js:9477`

### POST /api/v1/auth/platform-owner/login:start
- Best context: `3. System calls `POST /api/v1/auth/platform-owner/login:start``
- Reference: `docs\runbooks\owner-system-spec.md:129`

### UNSPECIFIED /api/v1/auth/platform-owner/login:unlock
- Best context: `const data = await api('/api/v1/auth/platform-owner/login:unlock', {`
- Reference: `services\portal-service\assets\portal-owner.js:6449`

### UNSPECIFIED /api/v1/auth/platform-owner/security-keys/${encodeURIComponent(key.credential_id)}/retire
- Best context: `const data = await api(`/api/v1/auth/platform-owner/security-keys/${encodeURIComponent(key.credential_id)}/retire`, {`
- Reference: `services\portal-service\assets\portal-owner.js:6439`

### UNSPECIFIED /api/v1/auth/platform-owner/totp-rotation:finish
- Best context: `const data = await api('/api/v1/auth/platform-owner/totp-rotation:finish', {`
- Reference: `services\portal-service\assets\portal-owner.js:6481`

### UNSPECIFIED /api/v1/auth/platform-owner/totp-rotation:start
- Best context: `const data = await api('/api/v1/auth/platform-owner/totp-rotation:start', {`
- Reference: `services\portal-service\assets\portal-owner.js:6459`

### POST /api/v1/autonomous-ops/plans
- Best context: `| `autonomous-ops` | `POST /api/v1/autonomous-ops/plans`, `POST /api/v1/autonomous-ops/runs/:runId/approve` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:18`

### POST /api/v1/autonomous-ops/runs/:runId/approve
- Best context: `| `autonomous-ops` | `POST /api/v1/autonomous-ops/plans`, `POST /api/v1/autonomous-ops/runs/:runId/approve` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:18`

### POST /api/v1/autonomy-override/cases
- Best context: `| `autonomy-override-tribunal` | `POST /api/v1/autonomy-override/cases`, `POST /api/v1/autonomy-override/cases/:caseId/rulings` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:96`

### POST /api/v1/autonomy-override/cases/:caseId/rulings
- Best context: `| `autonomy-override-tribunal` | `POST /api/v1/autonomy-override/cases`, `POST /api/v1/autonomy-override/cases/:caseId/rulings` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:96`

### POST /api/v1/autonomy-safety/switches
- Best context: `| `autonomy-safety-switches` | `POST /api/v1/autonomy-safety/switches`, `POST /api/v1/autonomy-safety/switches/:switchId/overrides` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:86`

### POST /api/v1/autonomy-safety/switches/:switchId/overrides
- Best context: `| `autonomy-safety-switches` | `POST /api/v1/autonomy-safety/switches`, `POST /api/v1/autonomy-safety/switches/:switchId/overrides` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:86`

### POST /api/v1/bias-redress/cases
- Best context: `| `bias-redress-orchestrator` | `POST /api/v1/bias-redress/cases`, `POST /api/v1/bias-redress/cases/:caseId/remediations` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:107`

### POST /api/v1/bias-redress/cases/:caseId/remediations
- Best context: `| `bias-redress-orchestrator` | `POST /api/v1/bias-redress/cases`, `POST /api/v1/bias-redress/cases/:caseId/remediations` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:107`

### POST /api/v1/board-intelligence/packs
- Best context: `| `board-intelligence` | `POST /api/v1/board-intelligence/packs`, `POST /api/v1/board-intelligence/packs/:packId/questions` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:67`

### POST /api/v1/board-intelligence/packs/:packId/questions
- Best context: `| `board-intelligence` | `POST /api/v1/board-intelligence/packs`, `POST /api/v1/board-intelligence/packs/:packId/questions` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:67`

### POST /api/v1/campus-digital-twin/snapshots
- Best context: `| `campus-digital-twin` | `POST /api/v1/campus-digital-twin/snapshots`, `POST /api/v1/campus-digital-twin/snapshots/:snapshotId/insights` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:65`

### POST /api/v1/campus-digital-twin/snapshots/:snapshotId/insights
- Best context: `| `campus-digital-twin` | `POST /api/v1/campus-digital-twin/snapshots`, `POST /api/v1/campus-digital-twin/snapshots/:snapshotId/insights` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:65`

### UNSPECIFIED /api/v1/campuses
- Action: Create Campus
- Best context: `const data = await runAction('Create Campus', () => api('/api/v1/campuses', {`
- Reference: `services\portal-service\assets\portal-owner.js:9916`
- Other refs: 1

### POST /api/v1/campuses
- Best context: `| `institution-structure` | `POST /api/v1/schools`, `POST /api/v1/campuses` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:16`

### POST /api/v1/capacity/snapshots
- Best context: `| `capacity-optimization` | `POST /api/v1/capacity/snapshots`, `POST /api/v1/capacity/snapshots/:capacitySnapshotId/optimize`, `GET /api/v1/capacity/summary` | `test/capacity-optimization.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:86`

### POST /api/v1/capacity/snapshots/:capacitySnapshotId/optimize
- Best context: `| `capacity-optimization` | `POST /api/v1/capacity/snapshots`, `POST /api/v1/capacity/snapshots/:capacitySnapshotId/optimize`, `GET /api/v1/capacity/summary` | `test/capacity-optimization.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:86`

### GET /api/v1/capacity/summary
- Best context: `| `capacity-optimization` | `POST /api/v1/capacity/snapshots`, `POST /api/v1/capacity/snapshots/:capacitySnapshotId/optimize`, `GET /api/v1/capacity/summary` | `test/capacity-optimization.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:86`

### POST /api/v1/career-outcomes/records
- Best context: `| `career-outcomes` | `POST /api/v1/career-outcomes/records`, `POST /api/v1/career-outcomes/records/:outcomeId/feedback`, `GET /api/v1/career-outcomes/summary` | `test/career-outcomes.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:90`

### POST /api/v1/career-outcomes/records/:outcomeId/feedback
- Best context: `| `career-outcomes` | `POST /api/v1/career-outcomes/records`, `POST /api/v1/career-outcomes/records/:outcomeId/feedback`, `GET /api/v1/career-outcomes/summary` | `test/career-outcomes.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:90`

### GET /api/v1/career-outcomes/summary
- Best context: `| `career-outcomes` | `POST /api/v1/career-outcomes/records`, `POST /api/v1/career-outcomes/records/:outcomeId/feedback`, `GET /api/v1/career-outcomes/summary` | `test/career-outcomes.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:90`

### POST /api/v1/causal-impact/experiments
- Best context: `| `causal-impact-lab` | `POST /api/v1/causal-impact/experiments`, `POST /api/v1/causal-impact/experiments/:experimentId/findings` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:77`

### POST /api/v1/causal-impact/experiments/:experimentId/findings
- Best context: `| `causal-impact-lab` | `POST /api/v1/causal-impact/experiments`, `POST /api/v1/causal-impact/experiments/:experimentId/findings` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:77`

### POST /api/v1/cleanroom/queries
- Best context: `| `cleanroom-analytics` | `POST /api/v1/cleanroom/queries`, `POST /api/v1/cleanroom/queries/:queryId/run` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:11`

### POST /api/v1/cleanroom/queries/:queryId/run
- Best context: `| `cleanroom-analytics` | `POST /api/v1/cleanroom/queries`, `POST /api/v1/cleanroom/queries/:queryId/run` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:11`

### GET /api/v1/clinic/visits
- Best context: `| `safety-health` | `GET /api/v1/safety/drills`, `GET /api/v1/clinic/visits` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:75`

### POST /api/v1/community-partnerships/programs
- Best context: `| `community-partnerships` | `POST /api/v1/community-partnerships/programs`, `POST /api/v1/community-partnerships/programs/:programId/placements`, `GET /api/v1/community-partnerships/summary` | `test/community-partnerships.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:96`

### POST /api/v1/community-partnerships/programs/:programId/placements
- Best context: `| `community-partnerships` | `POST /api/v1/community-partnerships/programs`, `POST /api/v1/community-partnerships/programs/:programId/placements`, `GET /api/v1/community-partnerships/summary` | `test/community-partnerships.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:96`

### GET /api/v1/community-partnerships/summary
- Best context: `| `community-partnerships` | `POST /api/v1/community-partnerships/programs`, `POST /api/v1/community-partnerships/programs/:programId/placements`, `GET /api/v1/community-partnerships/summary` | `test/community-partnerships.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:96`

### POST /api/v1/competencies
- Best context: `| `competency-graph` | `POST /api/v1/competencies/domains`, `POST /api/v1/competencies` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:30`

### POST /api/v1/competencies/domains
- Best context: `| `competency-graph` | `POST /api/v1/competencies/domains`, `POST /api/v1/competencies` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:30`

### POST /api/v1/compliance-autopilot/controls
- Best context: `| `compliance-autopilot` | `POST /api/v1/compliance-autopilot/controls`, `POST /api/v1/compliance-autopilot/controls/:controlId/runs` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:30`

### POST /api/v1/compliance-autopilot/controls/:controlId/runs
- Best context: `| `compliance-autopilot` | `POST /api/v1/compliance-autopilot/controls`, `POST /api/v1/compliance-autopilot/controls/:controlId/runs` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:30`

### POST /api/v1/compliance-flight/records
- Best context: `| `sovereign-compliance-flight-recorder` | `POST /api/v1/compliance-flight/records`, `POST /api/v1/compliance-flight/records/:recordId/events` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:97`

### POST /api/v1/compliance-flight/records/:recordId/events
- Best context: `| `sovereign-compliance-flight-recorder` | `POST /api/v1/compliance-flight/records`, `POST /api/v1/compliance-flight/records/:recordId/events` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:97`

### POST /api/v1/compute-attestations/sessions
- Best context: `| `confidential-compute-attestation` | `POST /api/v1/compute-attestations/sessions`, `POST /api/v1/compute-attestations/sessions/:sessionId/evidence` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:52`

### POST /api/v1/compute-attestations/sessions/:sessionId/evidence
- Best context: `| `confidential-compute-attestation` | `POST /api/v1/compute-attestations/sessions`, `POST /api/v1/compute-attestations/sessions/:sessionId/evidence` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:52`

### POST /api/v1/consent-comprehension-fidelity/audits
- Best context: `| `consent-comprehension-fidelity` | `POST /api/v1/consent-comprehension-fidelity/audits`, `POST /api/v1/consent-comprehension-fidelity/audits/:consentComprehensionAuditId/actions`, `GET /api/v1/consent-comprehension-fidelity/summary` | `test/consent-comprehension-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:197`

### POST /api/v1/consent-comprehension-fidelity/audits/:consentComprehensionAuditId/actions
- Best context: `| `consent-comprehension-fidelity` | `POST /api/v1/consent-comprehension-fidelity/audits`, `POST /api/v1/consent-comprehension-fidelity/audits/:consentComprehensionAuditId/actions`, `GET /api/v1/consent-comprehension-fidelity/summary` | `test/consent-comprehension-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:197`

### GET /api/v1/consent-comprehension-fidelity/summary
- Best context: `| `consent-comprehension-fidelity` | `POST /api/v1/consent-comprehension-fidelity/audits`, `POST /api/v1/consent-comprehension-fidelity/audits/:consentComprehensionAuditId/actions`, `GET /api/v1/consent-comprehension-fidelity/summary` | `test/consent-comprehension-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:197`

### POST /api/v1/consent-comprehension-renewal/audits
- Best context: `| `consent-comprehension-renewal` | `POST /api/v1/consent-comprehension-renewal/audits`, `POST /api/v1/consent-comprehension-renewal/audits/:consentRenewalAuditId/actions`, `GET /api/v1/consent-comprehension-renewal/summary` | `test/consent-comprehension-renewal.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:207`

### POST /api/v1/consent-comprehension-renewal/audits/:consentRenewalAuditId/actions
- Best context: `| `consent-comprehension-renewal` | `POST /api/v1/consent-comprehension-renewal/audits`, `POST /api/v1/consent-comprehension-renewal/audits/:consentRenewalAuditId/actions`, `GET /api/v1/consent-comprehension-renewal/summary` | `test/consent-comprehension-renewal.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:207`

### GET /api/v1/consent-comprehension-renewal/summary
- Best context: `| `consent-comprehension-renewal` | `POST /api/v1/consent-comprehension-renewal/audits`, `POST /api/v1/consent-comprehension-renewal/audits/:consentRenewalAuditId/actions`, `GET /api/v1/consent-comprehension-renewal/summary` | `test/consent-comprehension-renewal.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:207`

### POST /api/v1/consent-evidence/cases
- Best context: `| `consent-evidence-network` | `POST /api/v1/consent-evidence/cases`, `POST /api/v1/consent-evidence/cases/:caseId/entries` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:85`

### POST /api/v1/consent-evidence/cases/:caseId/entries
- Best context: `| `consent-evidence-network` | `POST /api/v1/consent-evidence/cases`, `POST /api/v1/consent-evidence/cases/:caseId/entries` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:85`

### POST /api/v1/consent-orchestration/flows
- Best context: `| `consent-orchestration` | `POST /api/v1/consent-orchestration/flows`, `POST /api/v1/consent-orchestration/flows/:flowId/steps` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:49`

### POST /api/v1/consent-orchestration/flows/:flowId/steps
- Best context: `| `consent-orchestration` | `POST /api/v1/consent-orchestration/flows`, `POST /api/v1/consent-orchestration/flows/:flowId/steps` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:49`

### POST /api/v1/consent-receipts
- Best context: `| `consent-receipts` | `POST /api/v1/consent-receipts`, `POST /api/v1/consent-receipts/:consentId/revoke` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:21`

### POST /api/v1/consent-receipts/:consentId/revoke
- Best context: `| `consent-receipts` | `POST /api/v1/consent-receipts`, `POST /api/v1/consent-receipts/:consentId/revoke` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:21`

### POST /api/v1/consent-revocations
- Best context: `| `consent-revocation-mesh` | `POST /api/v1/consent-revocations`, `POST /api/v1/consent-revocations/:revocationId/propagations` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:95`

### POST /api/v1/consent-revocations/:revocationId/propagations
- Best context: `| `consent-revocation-mesh` | `POST /api/v1/consent-revocations`, `POST /api/v1/consent-revocations/:revocationId/propagations` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:95`

### POST /api/v1/control-plane/audit-locks
- Best context: `| `enterprise-control-plane` | `POST /api/v1/control-plane/policies`, `POST /api/v1/control-plane/audit-locks`, `POST /api/v1/control-plane/entitlements:snapshot` | `test/enterprise-control-plane.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:42`

### POST /api/v1/control-plane/entitlements:snapshot
- Best context: `| `enterprise-control-plane` | `POST /api/v1/control-plane/policies`, `POST /api/v1/control-plane/audit-locks`, `POST /api/v1/control-plane/entitlements:snapshot` | `test/enterprise-control-plane.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:42`

### POST /api/v1/control-plane/policies
- Best context: `| `enterprise-control-plane` | `POST /api/v1/control-plane/policies`, `POST /api/v1/control-plane/audit-locks`, `POST /api/v1/control-plane/entitlements:snapshot` | `test/enterprise-control-plane.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:42`

### POST /api/v1/credential-audit/packs
- Best context: `| `credential-audit-network` | `POST /api/v1/credential-audit/packs`, `POST /api/v1/credential-audit/packs/:packId/entries` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:73`

### POST /api/v1/credential-audit/packs/:packId/entries
- Best context: `| `credential-audit-network` | `POST /api/v1/credential-audit/packs`, `POST /api/v1/credential-audit/packs/:packId/entries` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:73`

### POST /api/v1/credential-trust/exchanges
- Best context: `| `credential-trust-exchange` | `POST /api/v1/credential-trust/exchanges`, `POST /api/v1/credential-trust/shares/:shareId/verify` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:20`

### POST /api/v1/credential-trust/shares/:shareId/verify
- Best context: `| `credential-trust-exchange` | `POST /api/v1/credential-trust/exchanges`, `POST /api/v1/credential-trust/shares/:shareId/verify` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:20`

### POST /api/v1/credentials
- Best context: `| `credential-ledger` | `POST /api/v1/credentials`, `POST /api/v1/credentials/:credentialId/verify` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:19`

### POST /api/v1/credentials/:credentialId/verify
- Best context: `| `credential-ledger` | `POST /api/v1/credentials`, `POST /api/v1/credentials/:credentialId/verify` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:19`

### POST /api/v1/cross-border/policies
- Best context: `| `cross-border-compliance` | `POST /api/v1/cross-border/policies`, `POST /api/v1/cross-border/policies/:policyId/assessments` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:45`

### POST /api/v1/cross-border/policies/:policyId/assessments
- Best context: `| `cross-border-compliance` | `POST /api/v1/cross-border/policies`, `POST /api/v1/cross-border/policies/:policyId/assessments` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:45`

### POST /api/v1/cross-tenant-risk/exposures
- Best context: `| `cross-tenant-risk` | `POST /api/v1/cross-tenant-risk/exposures`, `POST /api/v1/cross-tenant-risk/exposures/:exposureId/partners` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:36`

### POST /api/v1/cross-tenant-risk/exposures/:exposureId/partners
- Best context: `| `cross-tenant-risk` | `POST /api/v1/cross-tenant-risk/exposures`, `POST /api/v1/cross-tenant-risk/exposures/:exposureId/partners` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:36`

### POST /api/v1/crypto-agility/plans
- Best context: `| `sovereign-crypto-agility` | `POST /api/v1/crypto-agility/plans`, `POST /api/v1/crypto-agility/plans/:planId/rotations` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:87`

### POST /api/v1/crypto-agility/plans/:planId/rotations
- Best context: `| `sovereign-crypto-agility` | `POST /api/v1/crypto-agility/plans`, `POST /api/v1/crypto-agility/plans/:planId/rotations` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:87`

### POST /api/v1/curriculum-coauthoring-governance/reviews
- Best context: `| `curriculum-coauthoring-governance` | `POST /api/v1/curriculum-coauthoring-governance/reviews`, `POST /api/v1/curriculum-coauthoring-governance/reviews/:coauthoringReviewId/actions`, `GET /api/v1/curriculum-coauthoring-governance/summary` | `test/curriculum-coauthoring-governance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:140`

### POST /api/v1/curriculum-coauthoring-governance/reviews/:coauthoringReviewId/actions
- Best context: `| `curriculum-coauthoring-governance` | `POST /api/v1/curriculum-coauthoring-governance/reviews`, `POST /api/v1/curriculum-coauthoring-governance/reviews/:coauthoringReviewId/actions`, `GET /api/v1/curriculum-coauthoring-governance/summary` | `test/curriculum-coauthoring-governance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:140`

### GET /api/v1/curriculum-coauthoring-governance/summary
- Best context: `| `curriculum-coauthoring-governance` | `POST /api/v1/curriculum-coauthoring-governance/reviews`, `POST /api/v1/curriculum-coauthoring-governance/reviews/:coauthoringReviewId/actions`, `GET /api/v1/curriculum-coauthoring-governance/summary` | `test/curriculum-coauthoring-governance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:140`

### POST /api/v1/curriculum-coherence/scans
- Best context: `| `curriculum-coherence` | `POST /api/v1/curriculum-coherence/scans`, `POST /api/v1/curriculum-coherence/scans/:coherenceScanId/actions`, `GET /api/v1/curriculum-coherence/summary` | `test/curriculum-coherence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:110`

### POST /api/v1/curriculum-coherence/scans/:coherenceScanId/actions
- Best context: `| `curriculum-coherence` | `POST /api/v1/curriculum-coherence/scans`, `POST /api/v1/curriculum-coherence/scans/:coherenceScanId/actions`, `GET /api/v1/curriculum-coherence/summary` | `test/curriculum-coherence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:110`

### GET /api/v1/curriculum-coherence/summary
- Best context: `| `curriculum-coherence` | `POST /api/v1/curriculum-coherence/scans`, `POST /api/v1/curriculum-coherence/scans/:coherenceScanId/actions`, `GET /api/v1/curriculum-coherence/summary` | `test/curriculum-coherence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:110`

### POST /api/v1/curriculum-competency-mapping/assessments
- Best context: `| `curriculum-competency-mapping` | `POST /api/v1/curriculum-competency-mapping/assessments`, `POST /api/v1/curriculum-competency-mapping/assessments/:competencyMappingAssessmentId/actions`, `GET /api/v1/curriculum-competency-mapping/summary` | `test/curriculum-competency-mapping.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:180`

### POST /api/v1/curriculum-competency-mapping/assessments/:competencyMappingAssessmentId/actions
- Best context: `| `curriculum-competency-mapping` | `POST /api/v1/curriculum-competency-mapping/assessments`, `POST /api/v1/curriculum-competency-mapping/assessments/:competencyMappingAssessmentId/actions`, `GET /api/v1/curriculum-competency-mapping/summary` | `test/curriculum-competency-mapping.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:180`

### GET /api/v1/curriculum-competency-mapping/summary
- Best context: `| `curriculum-competency-mapping` | `POST /api/v1/curriculum-competency-mapping/assessments`, `POST /api/v1/curriculum-competency-mapping/assessments/:competencyMappingAssessmentId/actions`, `GET /api/v1/curriculum-competency-mapping/summary` | `test/curriculum-competency-mapping.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:180`

### POST /api/v1/curriculum-credential-portability/assessments
- Best context: `| `curriculum-credential-portability` | `POST /api/v1/curriculum-credential-portability/assessments`, `POST /api/v1/curriculum-credential-portability/assessments/:credentialPortabilityAssessmentId/actions`, `GET /api/v1/curriculum-credential-portability/summary` | `test/curriculum-credential-portability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:170`

### POST /api/v1/curriculum-credential-portability/assessments/:credentialPortabilityAssessmentId/actions
- Best context: `| `curriculum-credential-portability` | `POST /api/v1/curriculum-credential-portability/assessments`, `POST /api/v1/curriculum-credential-portability/assessments/:credentialPortabilityAssessmentId/actions`, `GET /api/v1/curriculum-credential-portability/summary` | `test/curriculum-credential-portability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:170`

### GET /api/v1/curriculum-credential-portability/summary
- Best context: `| `curriculum-credential-portability` | `POST /api/v1/curriculum-credential-portability/assessments`, `POST /api/v1/curriculum-credential-portability/assessments/:credentialPortabilityAssessmentId/actions`, `GET /api/v1/curriculum-credential-portability/summary` | `test/curriculum-credential-portability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:170`

### POST /api/v1/curriculum-drift/scans
- Best context: `| `curriculum-drift-detection` | `POST /api/v1/curriculum-drift/scans`, `POST /api/v1/curriculum-drift/scans/:driftScanId/actions`, `GET /api/v1/curriculum-drift/summary` | `test/curriculum-drift-detection.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:85`

### POST /api/v1/curriculum-drift/scans/:driftScanId/actions
- Best context: `| `curriculum-drift-detection` | `POST /api/v1/curriculum-drift/scans`, `POST /api/v1/curriculum-drift/scans/:driftScanId/actions`, `GET /api/v1/curriculum-drift/summary` | `test/curriculum-drift-detection.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:85`

### GET /api/v1/curriculum-drift/summary
- Best context: `| `curriculum-drift-detection` | `POST /api/v1/curriculum-drift/scans`, `POST /api/v1/curriculum-drift/scans/:driftScanId/actions`, `GET /api/v1/curriculum-drift/summary` | `test/curriculum-drift-detection.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:85`

### POST /api/v1/curriculum-ecosystem-alignment/assessments
- Best context: `| `curriculum-ecosystem-alignment` | `POST /api/v1/curriculum-ecosystem-alignment/assessments`, `POST /api/v1/curriculum-ecosystem-alignment/assessments/:ecosystemAlignmentAssessmentId/actions`, `GET /api/v1/curriculum-ecosystem-alignment/summary` | `test/curriculum-ecosystem-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:150`

### POST /api/v1/curriculum-ecosystem-alignment/assessments/:ecosystemAlignmentAssessmentId/actions
- Best context: `| `curriculum-ecosystem-alignment` | `POST /api/v1/curriculum-ecosystem-alignment/assessments`, `POST /api/v1/curriculum-ecosystem-alignment/assessments/:ecosystemAlignmentAssessmentId/actions`, `GET /api/v1/curriculum-ecosystem-alignment/summary` | `test/curriculum-ecosystem-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:150`

### GET /api/v1/curriculum-ecosystem-alignment/summary
- Best context: `| `curriculum-ecosystem-alignment` | `POST /api/v1/curriculum-ecosystem-alignment/assessments`, `POST /api/v1/curriculum-ecosystem-alignment/assessments/:ecosystemAlignmentAssessmentId/actions`, `GET /api/v1/curriculum-ecosystem-alignment/summary` | `test/curriculum-ecosystem-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:150`

### POST /api/v1/curriculum-evidence-coverage/assessments
- Best context: `| `curriculum-evidence-coverage` | `POST /api/v1/curriculum-evidence-coverage/assessments`, `POST /api/v1/curriculum-evidence-coverage/assessments/:evidenceCoverageAssessmentId/actions`, `GET /api/v1/curriculum-evidence-coverage/summary` | `test/curriculum-evidence-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:189`

### POST /api/v1/curriculum-evidence-coverage/assessments/:evidenceCoverageAssessmentId/actions
- Best context: `| `curriculum-evidence-coverage` | `POST /api/v1/curriculum-evidence-coverage/assessments`, `POST /api/v1/curriculum-evidence-coverage/assessments/:evidenceCoverageAssessmentId/actions`, `GET /api/v1/curriculum-evidence-coverage/summary` | `test/curriculum-evidence-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:189`

### GET /api/v1/curriculum-evidence-coverage/summary
- Best context: `| `curriculum-evidence-coverage` | `POST /api/v1/curriculum-evidence-coverage/assessments`, `POST /api/v1/curriculum-evidence-coverage/assessments/:evidenceCoverageAssessmentId/actions`, `GET /api/v1/curriculum-evidence-coverage/summary` | `test/curriculum-evidence-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:189`

### POST /api/v1/curriculum-evidence-decay-forecast/forecasts
- Best context: `| `curriculum-evidence-decay-forecast` | `POST /api/v1/curriculum-evidence-decay-forecast/forecasts`, `POST /api/v1/curriculum-evidence-decay-forecast/forecasts/:evidenceDecayForecastId/actions`, `GET /api/v1/curriculum-evidence-decay-forecast/summary` | `test/curriculum-evidence-decay-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:209`

### POST /api/v1/curriculum-evidence-decay-forecast/forecasts/:evidenceDecayForecastId/actions
- Best context: `| `curriculum-evidence-decay-forecast` | `POST /api/v1/curriculum-evidence-decay-forecast/forecasts`, `POST /api/v1/curriculum-evidence-decay-forecast/forecasts/:evidenceDecayForecastId/actions`, `GET /api/v1/curriculum-evidence-decay-forecast/summary` | `test/curriculum-evidence-decay-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:209`

### GET /api/v1/curriculum-evidence-decay-forecast/summary
- Best context: `| `curriculum-evidence-decay-forecast` | `POST /api/v1/curriculum-evidence-decay-forecast/forecasts`, `POST /api/v1/curriculum-evidence-decay-forecast/forecasts/:evidenceDecayForecastId/actions`, `GET /api/v1/curriculum-evidence-decay-forecast/summary` | `test/curriculum-evidence-decay-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:209`

### POST /api/v1/curriculum-evidence-timeliness/assessments
- Best context: `| `curriculum-evidence-timeliness` | `POST /api/v1/curriculum-evidence-timeliness/assessments`, `POST /api/v1/curriculum-evidence-timeliness/assessments/:evidenceTimelinessAssessmentId/actions`, `GET /api/v1/curriculum-evidence-timeliness/summary` | `test/curriculum-evidence-timeliness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:199`

### POST /api/v1/curriculum-evidence-timeliness/assessments/:evidenceTimelinessAssessmentId/actions
- Best context: `| `curriculum-evidence-timeliness` | `POST /api/v1/curriculum-evidence-timeliness/assessments`, `POST /api/v1/curriculum-evidence-timeliness/assessments/:evidenceTimelinessAssessmentId/actions`, `GET /api/v1/curriculum-evidence-timeliness/summary` | `test/curriculum-evidence-timeliness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:199`

### GET /api/v1/curriculum-evidence-timeliness/summary
- Best context: `| `curriculum-evidence-timeliness` | `POST /api/v1/curriculum-evidence-timeliness/assessments`, `POST /api/v1/curriculum-evidence-timeliness/assessments/:evidenceTimelinessAssessmentId/actions`, `GET /api/v1/curriculum-evidence-timeliness/summary` | `test/curriculum-evidence-timeliness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:199`

### POST /api/v1/curriculum-future-readiness/assessments
- Best context: `| `curriculum-future-readiness` | `POST /api/v1/curriculum-future-readiness/assessments`, `POST /api/v1/curriculum-future-readiness/assessments/:futureReadinessAssessmentId/actions`, `GET /api/v1/curriculum-future-readiness/summary` | `test/curriculum-future-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:135`

### POST /api/v1/curriculum-future-readiness/assessments/:futureReadinessAssessmentId/actions
- Best context: `| `curriculum-future-readiness` | `POST /api/v1/curriculum-future-readiness/assessments`, `POST /api/v1/curriculum-future-readiness/assessments/:futureReadinessAssessmentId/actions`, `GET /api/v1/curriculum-future-readiness/summary` | `test/curriculum-future-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:135`

### GET /api/v1/curriculum-future-readiness/summary
- Best context: `| `curriculum-future-readiness` | `POST /api/v1/curriculum-future-readiness/assessments`, `POST /api/v1/curriculum-future-readiness/assessments/:futureReadinessAssessmentId/actions`, `GET /api/v1/curriculum-future-readiness/summary` | `test/curriculum-future-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:135`

### POST /api/v1/curriculum-innovation-impact/studies
- Best context: `| `curriculum-innovation-impact` | `POST /api/v1/curriculum-innovation-impact/studies`, `POST /api/v1/curriculum-innovation-impact/studies/:innovationStudyId/actions`, `GET /api/v1/curriculum-innovation-impact/summary` | `test/curriculum-innovation-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:125`

### POST /api/v1/curriculum-innovation-impact/studies/:innovationStudyId/actions
- Best context: `| `curriculum-innovation-impact` | `POST /api/v1/curriculum-innovation-impact/studies`, `POST /api/v1/curriculum-innovation-impact/studies/:innovationStudyId/actions`, `GET /api/v1/curriculum-innovation-impact/summary` | `test/curriculum-innovation-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:125`

### GET /api/v1/curriculum-innovation-impact/summary
- Best context: `| `curriculum-innovation-impact` | `POST /api/v1/curriculum-innovation-impact/studies`, `POST /api/v1/curriculum-innovation-impact/studies/:innovationStudyId/actions`, `GET /api/v1/curriculum-innovation-impact/summary` | `test/curriculum-innovation-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:125`

### POST /api/v1/curriculum-localization-fidelity/assessments
- Best context: `| `curriculum-localization-fidelity` | `POST /api/v1/curriculum-localization-fidelity/assessments`, `POST /api/v1/curriculum-localization-fidelity/assessments/:localizationAssessmentId/actions`, `GET /api/v1/curriculum-localization-fidelity/summary` | `test/curriculum-localization-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:175`

### POST /api/v1/curriculum-localization-fidelity/assessments/:localizationAssessmentId/actions
- Best context: `| `curriculum-localization-fidelity` | `POST /api/v1/curriculum-localization-fidelity/assessments`, `POST /api/v1/curriculum-localization-fidelity/assessments/:localizationAssessmentId/actions`, `GET /api/v1/curriculum-localization-fidelity/summary` | `test/curriculum-localization-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:175`

### GET /api/v1/curriculum-localization-fidelity/summary
- Best context: `| `curriculum-localization-fidelity` | `POST /api/v1/curriculum-localization-fidelity/assessments`, `POST /api/v1/curriculum-localization-fidelity/assessments/:localizationAssessmentId/actions`, `GET /api/v1/curriculum-localization-fidelity/summary` | `test/curriculum-localization-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:175`

### POST /api/v1/curriculum-micro-credential-alignment/assessments
- Best context: `| `curriculum-micro-credential-alignment` | `POST /api/v1/curriculum-micro-credential-alignment/assessments`, `POST /api/v1/curriculum-micro-credential-alignment/assessments/:microCredentialAssessmentId/actions`, `GET /api/v1/curriculum-micro-credential-alignment/summary` | `test/curriculum-micro-credential-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:145`

### POST /api/v1/curriculum-micro-credential-alignment/assessments/:microCredentialAssessmentId/actions
- Best context: `| `curriculum-micro-credential-alignment` | `POST /api/v1/curriculum-micro-credential-alignment/assessments`, `POST /api/v1/curriculum-micro-credential-alignment/assessments/:microCredentialAssessmentId/actions`, `GET /api/v1/curriculum-micro-credential-alignment/summary` | `test/curriculum-micro-credential-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:145`

### GET /api/v1/curriculum-micro-credential-alignment/summary
- Best context: `| `curriculum-micro-credential-alignment` | `POST /api/v1/curriculum-micro-credential-alignment/assessments`, `POST /api/v1/curriculum-micro-credential-alignment/assessments/:microCredentialAssessmentId/actions`, `GET /api/v1/curriculum-micro-credential-alignment/summary` | `test/curriculum-micro-credential-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:145`

### POST /api/v1/curriculum-relevance/scans
- Best context: `| `curriculum-relevance` | `POST /api/v1/curriculum-relevance/scans`, `POST /api/v1/curriculum-relevance/scans/:relevanceScanId/actions`, `GET /api/v1/curriculum-relevance/summary` | `test/curriculum-relevance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:120`

### POST /api/v1/curriculum-relevance/scans/:relevanceScanId/actions
- Best context: `| `curriculum-relevance` | `POST /api/v1/curriculum-relevance/scans`, `POST /api/v1/curriculum-relevance/scans/:relevanceScanId/actions`, `GET /api/v1/curriculum-relevance/summary` | `test/curriculum-relevance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:120`

### GET /api/v1/curriculum-relevance/summary
- Best context: `| `curriculum-relevance` | `POST /api/v1/curriculum-relevance/scans`, `POST /api/v1/curriculum-relevance/scans/:relevanceScanId/actions`, `GET /api/v1/curriculum-relevance/summary` | `test/curriculum-relevance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:120`

### POST /api/v1/curriculum-resource-efficiency/audits
- Best context: `| `curriculum-resource-efficiency` | `POST /api/v1/curriculum-resource-efficiency/audits`, `POST /api/v1/curriculum-resource-efficiency/audits/:efficiencyAuditId/actions`, `GET /api/v1/curriculum-resource-efficiency/summary` | `test/curriculum-resource-efficiency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:130`

### POST /api/v1/curriculum-resource-efficiency/audits/:efficiencyAuditId/actions
- Best context: `| `curriculum-resource-efficiency` | `POST /api/v1/curriculum-resource-efficiency/audits`, `POST /api/v1/curriculum-resource-efficiency/audits/:efficiencyAuditId/actions`, `GET /api/v1/curriculum-resource-efficiency/summary` | `test/curriculum-resource-efficiency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:130`

### GET /api/v1/curriculum-resource-efficiency/summary
- Best context: `| `curriculum-resource-efficiency` | `POST /api/v1/curriculum-resource-efficiency/audits`, `POST /api/v1/curriculum-resource-efficiency/audits/:efficiencyAuditId/actions`, `GET /api/v1/curriculum-resource-efficiency/summary` | `test/curriculum-resource-efficiency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:130`

### POST /api/v1/curriculum-sequencing/analyses
- Best context: `| `curriculum-sequencing` | `POST /api/v1/curriculum-sequencing/analyses`, `POST /api/v1/curriculum-sequencing/analyses/:sequencingAnalysisId/actions`, `GET /api/v1/curriculum-sequencing/summary` | `test/curriculum-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:115`

### POST /api/v1/curriculum-sequencing/analyses/:sequencingAnalysisId/actions
- Best context: `| `curriculum-sequencing` | `POST /api/v1/curriculum-sequencing/analyses`, `POST /api/v1/curriculum-sequencing/analyses/:sequencingAnalysisId/actions`, `GET /api/v1/curriculum-sequencing/summary` | `test/curriculum-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:115`

### GET /api/v1/curriculum-sequencing/summary
- Best context: `| `curriculum-sequencing` | `POST /api/v1/curriculum-sequencing/analyses`, `POST /api/v1/curriculum-sequencing/analyses/:sequencingAnalysisId/actions`, `GET /api/v1/curriculum-sequencing/summary` | `test/curriculum-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:115`

### POST /api/v1/curriculum-skill-stack-stability/assessments
- Best context: `| `curriculum-skill-stack-stability` | `POST /api/v1/curriculum-skill-stack-stability/assessments`, `POST /api/v1/curriculum-skill-stack-stability/assessments/:skillStackAssessmentId/actions`, `GET /api/v1/curriculum-skill-stack-stability/summary` | `test/curriculum-skill-stack-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:155`

### POST /api/v1/curriculum-skill-stack-stability/assessments/:skillStackAssessmentId/actions
- Best context: `| `curriculum-skill-stack-stability` | `POST /api/v1/curriculum-skill-stack-stability/assessments`, `POST /api/v1/curriculum-skill-stack-stability/assessments/:skillStackAssessmentId/actions`, `GET /api/v1/curriculum-skill-stack-stability/summary` | `test/curriculum-skill-stack-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:155`

### GET /api/v1/curriculum-skill-stack-stability/summary
- Best context: `| `curriculum-skill-stack-stability` | `POST /api/v1/curriculum-skill-stack-stability/assessments`, `POST /api/v1/curriculum-skill-stack-stability/assessments/:skillStackAssessmentId/actions`, `GET /api/v1/curriculum-skill-stack-stability/summary` | `test/curriculum-skill-stack-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:155`

### POST /api/v1/curriculum-transferability-index/assessments
- Best context: `| `curriculum-transferability-index` | `POST /api/v1/curriculum-transferability-index/assessments`, `POST /api/v1/curriculum-transferability-index/assessments/:transferabilityAssessmentId/actions`, `GET /api/v1/curriculum-transferability-index/summary` | `test/curriculum-transferability-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:165`

### POST /api/v1/curriculum-transferability-index/assessments/:transferabilityAssessmentId/actions
- Best context: `| `curriculum-transferability-index` | `POST /api/v1/curriculum-transferability-index/assessments`, `POST /api/v1/curriculum-transferability-index/assessments/:transferabilityAssessmentId/actions`, `GET /api/v1/curriculum-transferability-index/summary` | `test/curriculum-transferability-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:165`

### GET /api/v1/curriculum-transferability-index/summary
- Best context: `| `curriculum-transferability-index` | `POST /api/v1/curriculum-transferability-index/assessments`, `POST /api/v1/curriculum-transferability-index/assessments/:transferabilityAssessmentId/actions`, `GET /api/v1/curriculum-transferability-index/summary` | `test/curriculum-transferability-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:165`

### POST /api/v1/curriculum-vendor-exit-readiness/assessments
- Best context: `| `curriculum-vendor-exit-readiness` | `POST /api/v1/curriculum-vendor-exit-readiness/assessments`, `POST /api/v1/curriculum-vendor-exit-readiness/assessments/:vendorExitAssessmentId/actions`, `GET /api/v1/curriculum-vendor-exit-readiness/summary` | `test/curriculum-vendor-exit-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:160`

### POST /api/v1/curriculum-vendor-exit-readiness/assessments/:vendorExitAssessmentId/actions
- Best context: `| `curriculum-vendor-exit-readiness` | `POST /api/v1/curriculum-vendor-exit-readiness/assessments`, `POST /api/v1/curriculum-vendor-exit-readiness/assessments/:vendorExitAssessmentId/actions`, `GET /api/v1/curriculum-vendor-exit-readiness/summary` | `test/curriculum-vendor-exit-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:160`

### GET /api/v1/curriculum-vendor-exit-readiness/summary
- Best context: `| `curriculum-vendor-exit-readiness` | `POST /api/v1/curriculum-vendor-exit-readiness/assessments`, `POST /api/v1/curriculum-vendor-exit-readiness/assessments/:vendorExitAssessmentId/actions`, `GET /api/v1/curriculum-vendor-exit-readiness/summary` | `test/curriculum-vendor-exit-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:160`

### POST /api/v1/customer-success/accounts
- Best context: `| `customer-success` | `POST /api/v1/customer-success/accounts`, `POST /api/v1/customer-success/accounts/:customerSuccessAccountId/refresh-health` | `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:44`

### POST /api/v1/customer-success/accounts/:customerSuccessAccountId/refresh-health
- Best context: `| `customer-success` | `POST /api/v1/customer-success/accounts`, `POST /api/v1/customer-success/accounts/:customerSuccessAccountId/refresh-health` | `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:44`

### POST /api/v1/data-escrow/cases
- Best context: `| `data-escrow` | `POST /api/v1/data-escrow/cases`, `POST /api/v1/data-escrow/cases/:caseId/release` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:32`

### POST /api/v1/data-escrow/cases/:caseId/release
- Best context: `| `data-escrow` | `POST /api/v1/data-escrow/cases`, `POST /api/v1/data-escrow/cases/:caseId/release` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:32`

### POST /api/v1/data-governance/access-requests/:accessRequestId/approve
- Best context: `| `data-governance-ops` | `POST /api/v1/data-governance/assets`, `POST /api/v1/data-governance/access-requests/:accessRequestId/approve`, `POST /api/v1/data-governance/retention-exceptions/:exceptionId/approve` | `test/data-governance-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:80`

### POST /api/v1/data-governance/assets
- Best context: `| `data-governance-ops` | `POST /api/v1/data-governance/assets`, `POST /api/v1/data-governance/access-requests/:accessRequestId/approve`, `POST /api/v1/data-governance/retention-exceptions/:exceptionId/approve` | `test/data-governance-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:80`

### POST /api/v1/data-governance/retention-exceptions/:exceptionId/approve
- Best context: `| `data-governance-ops` | `POST /api/v1/data-governance/assets`, `POST /api/v1/data-governance/access-requests/:accessRequestId/approve`, `POST /api/v1/data-governance/retention-exceptions/:exceptionId/approve` | `test/data-governance-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:80`

### GET /api/v1/data-lineage/graphs
- Best context: `| `data-lineage` | `POST /api/v1/data-lineage/nodes`, `GET /api/v1/data-lineage/graphs` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:50`

### POST /api/v1/data-lineage/nodes
- Best context: `| `data-lineage` | `POST /api/v1/data-lineage/nodes`, `GET /api/v1/data-lineage/graphs` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:50`

### POST /api/v1/data-minimization/audits
- Best context: `| `data-minimization-audits` | `POST /api/v1/data-minimization/audits`, `POST /api/v1/data-minimization/audits/:auditId/findings` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:84`

### POST /api/v1/data-minimization/audits/:auditId/findings
- Best context: `| `data-minimization-audits` | `POST /api/v1/data-minimization/audits`, `POST /api/v1/data-minimization/audits/:auditId/findings` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:84`

### POST /api/v1/data-pipelines
- Best context: `| `data-pipelines` | `POST /api/v1/data-pipelines`, `POST /api/v1/data-pipelines/:pipelineId/runs`, `GET /api/v1/data-pipelines/runs/:pipelineRunId` | `test/data-pipeline.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:43`

### POST /api/v1/data-pipelines/:pipelineId/runs
- Best context: `| `data-pipelines` | `POST /api/v1/data-pipelines`, `POST /api/v1/data-pipelines/:pipelineId/runs`, `GET /api/v1/data-pipelines/runs/:pipelineRunId` | `test/data-pipeline.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:43`

### GET /api/v1/data-pipelines/runs/:pipelineRunId
- Best context: `| `data-pipelines` | `POST /api/v1/data-pipelines`, `POST /api/v1/data-pipelines/:pipelineId/runs`, `GET /api/v1/data-pipelines/runs/:pipelineRunId` | `test/data-pipeline.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:43`

### POST /api/v1/data-purpose/registries
- Best context: `| `data-purpose-registry` | `POST /api/v1/data-purpose/registries`, `POST /api/v1/data-purpose/registries/:registryId/entries` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:94`

### POST /api/v1/data-purpose/registries/:registryId/entries
- Best context: `| `data-purpose-registry` | `POST /api/v1/data-purpose/registries`, `POST /api/v1/data-purpose/registries/:registryId/entries` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:94`

### POST /api/v1/data-residency/policies
- Best context: `| `data-residency` | `POST /api/v1/data-residency/policies`, `POST /api/v1/data-residency/requests/:requestId/decide` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:22`

### POST /api/v1/data-residency/requests/:requestId/decide
- Best context: `| `data-residency` | `POST /api/v1/data-residency/policies`, `POST /api/v1/data-residency/requests/:requestId/decide` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:22`

### POST /api/v1/data-sharing/contracts
- Best context: `| `data-sharing-contracts` | `POST /api/v1/data-sharing/contracts`, `POST /api/v1/data-sharing/contracts/:contractId/approvals` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:54`

### POST /api/v1/data-sharing/contracts/:contractId/approvals
- Best context: `| `data-sharing-contracts` | `POST /api/v1/data-sharing/contracts`, `POST /api/v1/data-sharing/contracts/:contractId/approvals` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:54`

### POST /api/v1/data-signals
- Best context: `| `data-signal-marketplace` | `POST /api/v1/data-signals`, `POST /api/v1/data-signals/:signalId/subscriptions` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:59`

### POST /api/v1/data-signals/:signalId/subscriptions
- Best context: `| `data-signal-marketplace` | `POST /api/v1/data-signals`, `POST /api/v1/data-signals/:signalId/subscriptions` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:59`

### POST /api/v1/decision-appeals
- Best context: `| `decision-appeals-hub` | `POST /api/v1/decision-appeals`, `POST /api/v1/decision-appeals/:appealId/resolutions` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:101`

### POST /api/v1/decision-appeals/:appealId/resolutions
- Best context: `| `decision-appeals-hub` | `POST /api/v1/decision-appeals`, `POST /api/v1/decision-appeals/:appealId/resolutions` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:101`

### POST /api/v1/disputes
- Best context: `| `cross-tenant-dispute` | `POST /api/v1/disputes`, `POST /api/v1/disputes/:disputeId/resolutions` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:57`

### POST /api/v1/disputes/:disputeId/resolutions
- Best context: `| `cross-tenant-dispute` | `POST /api/v1/disputes`, `POST /api/v1/disputes/:disputeId/resolutions` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:57`

### POST /api/v1/edge-devices
- Best context: `| `integration` | `POST /api/v1/integration-hub/health:refresh`, `GET /api/v1/integration-hub/sla-drift`, `POST /api/v1/integration-hub/sync-schedules`, `POST /api/v1/integration-hub/endpoints`, `POST /api/v1/edge-devices` | `test/integration-observability.test.mjs`, `test/integration-schedule.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs`, `test/enterprise-integration-edge-devices.test.mjs`, `test/enterprise-integration-endpoints.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:41`

### POST /api/v1/equity-access-resilience/runs
- Best context: `| `equity-access-resilience` | `POST /api/v1/equity-access-resilience/runs`, `POST /api/v1/equity-access-resilience/runs/:accessResilienceRunId/actions`, `GET /api/v1/equity-access-resilience/summary` | `test/equity-access-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:147`

### POST /api/v1/equity-access-resilience/runs/:accessResilienceRunId/actions
- Best context: `| `equity-access-resilience` | `POST /api/v1/equity-access-resilience/runs`, `POST /api/v1/equity-access-resilience/runs/:accessResilienceRunId/actions`, `GET /api/v1/equity-access-resilience/summary` | `test/equity-access-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:147`

### GET /api/v1/equity-access-resilience/summary
- Best context: `| `equity-access-resilience` | `POST /api/v1/equity-access-resilience/runs`, `POST /api/v1/equity-access-resilience/runs/:accessResilienceRunId/actions`, `GET /api/v1/equity-access-resilience/summary` | `test/equity-access-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:147`

### POST /api/v1/equity-access-trajectory/audits
- Best context: `| `equity-access-trajectory` | `POST /api/v1/equity-access-trajectory/audits`, `POST /api/v1/equity-access-trajectory/audits/:accessTrajectoryAuditId/actions`, `GET /api/v1/equity-access-trajectory/summary` | `test/equity-access-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:182`

### POST /api/v1/equity-access-trajectory/audits/:accessTrajectoryAuditId/actions
- Best context: `| `equity-access-trajectory` | `POST /api/v1/equity-access-trajectory/audits`, `POST /api/v1/equity-access-trajectory/audits/:accessTrajectoryAuditId/actions`, `GET /api/v1/equity-access-trajectory/summary` | `test/equity-access-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:182`

### GET /api/v1/equity-access-trajectory/summary
- Best context: `| `equity-access-trajectory` | `POST /api/v1/equity-access-trajectory/audits`, `POST /api/v1/equity-access-trajectory/audits/:accessTrajectoryAuditId/actions`, `GET /api/v1/equity-access-trajectory/summary` | `test/equity-access-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:182`

### POST /api/v1/equity-counterfactuals
- Best context: `| `equity-counterfactual-lab` | `POST /api/v1/equity-counterfactuals`, `POST /api/v1/equity-counterfactuals/:runId/insights` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:103`

### POST /api/v1/equity-counterfactuals/:runId/insights
- Best context: `| `equity-counterfactual-lab` | `POST /api/v1/equity-counterfactuals`, `POST /api/v1/equity-counterfactuals/:runId/insights` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:103`

### POST /api/v1/equity-forecasts
- Best context: `| `equity-impact-forecast` | `POST /api/v1/equity-forecasts`, `POST /api/v1/equity-forecasts/:forecastId/scenarios` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:74`

### POST /api/v1/equity-forecasts/:forecastId/scenarios
- Best context: `| `equity-impact-forecast` | `POST /api/v1/equity-forecasts`, `POST /api/v1/equity-forecasts/:forecastId/scenarios` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:74`

### POST /api/v1/equity-gain-persistence/runs
- Best context: `| `equity-gain-persistence` | `POST /api/v1/equity-gain-persistence/runs`, `POST /api/v1/equity-gain-persistence/runs/:persistenceRunId/actions`, `GET /api/v1/equity-gain-persistence/summary` | `test/equity-gain-persistence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:177`

### POST /api/v1/equity-gain-persistence/runs/:persistenceRunId/actions
- Best context: `| `equity-gain-persistence` | `POST /api/v1/equity-gain-persistence/runs`, `POST /api/v1/equity-gain-persistence/runs/:persistenceRunId/actions`, `GET /api/v1/equity-gain-persistence/summary` | `test/equity-gain-persistence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:177`

### GET /api/v1/equity-gain-persistence/summary
- Best context: `| `equity-gain-persistence` | `POST /api/v1/equity-gain-persistence/runs`, `POST /api/v1/equity-gain-persistence/runs/:persistenceRunId/actions`, `GET /api/v1/equity-gain-persistence/summary` | `test/equity-gain-persistence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:177`

### POST /api/v1/equity-gap-closure/runs
- Best context: `| `equity-gap-closure` | `POST /api/v1/equity-gap-closure/runs`, `POST /api/v1/equity-gap-closure/runs/:gapClosureRunId/actions`, `GET /api/v1/equity-gap-closure/summary` | `test/equity-gap-closure.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:117`

### POST /api/v1/equity-gap-closure/runs/:gapClosureRunId/actions
- Best context: `| `equity-gap-closure` | `POST /api/v1/equity-gap-closure/runs`, `POST /api/v1/equity-gap-closure/runs/:gapClosureRunId/actions`, `GET /api/v1/equity-gap-closure/summary` | `test/equity-gap-closure.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:117`

### GET /api/v1/equity-gap-closure/summary
- Best context: `| `equity-gap-closure` | `POST /api/v1/equity-gap-closure/runs`, `POST /api/v1/equity-gap-closure/runs/:gapClosureRunId/actions`, `GET /api/v1/equity-gap-closure/summary` | `test/equity-gap-closure.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:117`

### POST /api/v1/equity-intervention-precision/runs
- Best context: `| `equity-intervention-precision` | `POST /api/v1/equity-intervention-precision/runs`, `POST /api/v1/equity-intervention-precision/runs/:interventionPrecisionRunId/actions`, `GET /api/v1/equity-intervention-precision/summary` | `test/equity-intervention-precision.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:157`

### POST /api/v1/equity-intervention-precision/runs/:interventionPrecisionRunId/actions
- Best context: `| `equity-intervention-precision` | `POST /api/v1/equity-intervention-precision/runs`, `POST /api/v1/equity-intervention-precision/runs/:interventionPrecisionRunId/actions`, `GET /api/v1/equity-intervention-precision/summary` | `test/equity-intervention-precision.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:157`

### GET /api/v1/equity-intervention-precision/summary
- Best context: `| `equity-intervention-precision` | `POST /api/v1/equity-intervention-precision/runs`, `POST /api/v1/equity-intervention-precision/runs/:interventionPrecisionRunId/actions`, `GET /api/v1/equity-intervention-precision/summary` | `test/equity-intervention-precision.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:157`

### POST /api/v1/equity-intervention-resilience/runs
- Best context: `| `equity-intervention-resilience` | `POST /api/v1/equity-intervention-resilience/runs`, `POST /api/v1/equity-intervention-resilience/runs/:interventionResilienceRunId/actions`, `GET /api/v1/equity-intervention-resilience/summary` | `test/equity-intervention-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:132`

### POST /api/v1/equity-intervention-resilience/runs/:interventionResilienceRunId/actions
- Best context: `| `equity-intervention-resilience` | `POST /api/v1/equity-intervention-resilience/runs`, `POST /api/v1/equity-intervention-resilience/runs/:interventionResilienceRunId/actions`, `GET /api/v1/equity-intervention-resilience/summary` | `test/equity-intervention-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:132`

### GET /api/v1/equity-intervention-resilience/summary
- Best context: `| `equity-intervention-resilience` | `POST /api/v1/equity-intervention-resilience/runs`, `POST /api/v1/equity-intervention-resilience/runs/:interventionResilienceRunId/actions`, `GET /api/v1/equity-intervention-resilience/summary` | `test/equity-intervention-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:132`

### POST /api/v1/equity-intervention-roi/audits
- Best context: `| `equity-intervention-roi` | `POST /api/v1/equity-intervention-roi/audits`, `POST /api/v1/equity-intervention-roi/audits/:interventionRoiAuditId/actions`, `GET /api/v1/equity-intervention-roi/summary` | `test/equity-intervention-roi.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:172`

### POST /api/v1/equity-intervention-roi/audits/:interventionRoiAuditId/actions
- Best context: `| `equity-intervention-roi` | `POST /api/v1/equity-intervention-roi/audits`, `POST /api/v1/equity-intervention-roi/audits/:interventionRoiAuditId/actions`, `GET /api/v1/equity-intervention-roi/summary` | `test/equity-intervention-roi.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:172`

### GET /api/v1/equity-intervention-roi/summary
- Best context: `| `equity-intervention-roi` | `POST /api/v1/equity-intervention-roi/audits`, `POST /api/v1/equity-intervention-roi/audits/:interventionRoiAuditId/actions`, `GET /api/v1/equity-intervention-roi/summary` | `test/equity-intervention-roi.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:172`

### POST /api/v1/equity-interventions/plans
- Best context: `| `equity-intervention-optimizer` | `POST /api/v1/equity-interventions/plans`, `POST /api/v1/equity-interventions/plans/:planId/recommendations` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:80`

### POST /api/v1/equity-interventions/plans/:planId/recommendations
- Best context: `| `equity-intervention-optimizer` | `POST /api/v1/equity-interventions/plans`, `POST /api/v1/equity-interventions/plans/:planId/recommendations` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:80`

### POST /api/v1/equity-momentum/runs
- Best context: `| `equity-momentum` | `POST /api/v1/equity-momentum/runs`, `POST /api/v1/equity-momentum/runs/:equityRunId/actions`, `GET /api/v1/equity-momentum/summary` | `test/equity-momentum.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:112`

### POST /api/v1/equity-momentum/runs/:equityRunId/actions
- Best context: `| `equity-momentum` | `POST /api/v1/equity-momentum/runs`, `POST /api/v1/equity-momentum/runs/:equityRunId/actions`, `GET /api/v1/equity-momentum/summary` | `test/equity-momentum.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:112`

### GET /api/v1/equity-momentum/summary
- Best context: `| `equity-momentum` | `POST /api/v1/equity-momentum/runs`, `POST /api/v1/equity-momentum/runs/:equityRunId/actions`, `GET /api/v1/equity-momentum/summary` | `test/equity-momentum.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:112`

### POST /api/v1/equity-opportunity-index/runs
- Best context: `| `equity-opportunity-index` | `POST /api/v1/equity-opportunity-index/runs`, `POST /api/v1/equity-opportunity-index/runs/:opportunityRunId/actions`, `GET /api/v1/equity-opportunity-index/summary` | `test/equity-opportunity-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:137`

### POST /api/v1/equity-opportunity-index/runs/:opportunityRunId/actions
- Best context: `| `equity-opportunity-index` | `POST /api/v1/equity-opportunity-index/runs`, `POST /api/v1/equity-opportunity-index/runs/:opportunityRunId/actions`, `GET /api/v1/equity-opportunity-index/summary` | `test/equity-opportunity-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:137`

### GET /api/v1/equity-opportunity-index/summary
- Best context: `| `equity-opportunity-index` | `POST /api/v1/equity-opportunity-index/runs`, `POST /api/v1/equity-opportunity-index/runs/:opportunityRunId/actions`, `GET /api/v1/equity-opportunity-index/summary` | `test/equity-opportunity-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:137`

### POST /api/v1/equity-opportunity-resilience/runs
- Best context: `| `equity-opportunity-resilience` | `POST /api/v1/equity-opportunity-resilience/runs`, `POST /api/v1/equity-opportunity-resilience/runs/:opportunityResilienceRunId/actions`, `GET /api/v1/equity-opportunity-resilience/summary` | `test/equity-opportunity-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:142`

### POST /api/v1/equity-opportunity-resilience/runs/:opportunityResilienceRunId/actions
- Best context: `| `equity-opportunity-resilience` | `POST /api/v1/equity-opportunity-resilience/runs`, `POST /api/v1/equity-opportunity-resilience/runs/:opportunityResilienceRunId/actions`, `GET /api/v1/equity-opportunity-resilience/summary` | `test/equity-opportunity-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:142`

### GET /api/v1/equity-opportunity-resilience/summary
- Best context: `| `equity-opportunity-resilience` | `POST /api/v1/equity-opportunity-resilience/runs`, `POST /api/v1/equity-opportunity-resilience/runs/:opportunityResilienceRunId/actions`, `GET /api/v1/equity-opportunity-resilience/summary` | `test/equity-opportunity-resilience.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:142`

### POST /api/v1/equity-participation-elasticity/runs
- Best context: `| `equity-participation-elasticity` | `POST /api/v1/equity-participation-elasticity/runs`, `POST /api/v1/equity-participation-elasticity/runs/:participationElasticityRunId/actions`, `GET /api/v1/equity-participation-elasticity/summary` | `test/equity-participation-elasticity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:190`

### POST /api/v1/equity-participation-elasticity/runs/:participationElasticityRunId/actions
- Best context: `| `equity-participation-elasticity` | `POST /api/v1/equity-participation-elasticity/runs`, `POST /api/v1/equity-participation-elasticity/runs/:participationElasticityRunId/actions`, `GET /api/v1/equity-participation-elasticity/summary` | `test/equity-participation-elasticity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:190`

### GET /api/v1/equity-participation-elasticity/summary
- Best context: `| `equity-participation-elasticity` | `POST /api/v1/equity-participation-elasticity/runs`, `POST /api/v1/equity-participation-elasticity/runs/:participationElasticityRunId/actions`, `GET /api/v1/equity-participation-elasticity/summary` | `test/equity-participation-elasticity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:190`

### POST /api/v1/equity-participation-friction/runs
- Best context: `| `equity-participation-friction` | `POST /api/v1/equity-participation-friction/runs`, `POST /api/v1/equity-participation-friction/runs/:participationFrictionRunId/actions`, `GET /api/v1/equity-participation-friction/summary` | `test/equity-participation-friction.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:200`

### POST /api/v1/equity-participation-friction/runs/:participationFrictionRunId/actions
- Best context: `| `equity-participation-friction` | `POST /api/v1/equity-participation-friction/runs`, `POST /api/v1/equity-participation-friction/runs/:participationFrictionRunId/actions`, `GET /api/v1/equity-participation-friction/summary` | `test/equity-participation-friction.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:200`

### GET /api/v1/equity-participation-friction/summary
- Best context: `| `equity-participation-friction` | `POST /api/v1/equity-participation-friction/runs`, `POST /api/v1/equity-participation-friction/runs/:participationFrictionRunId/actions`, `GET /api/v1/equity-participation-friction/summary` | `test/equity-participation-friction.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:200`

### POST /api/v1/equity-participation-opportunity-cost/runs
- Best context: `| `equity-participation-opportunity-cost` | `POST /api/v1/equity-participation-opportunity-cost/runs`, `POST /api/v1/equity-participation-opportunity-cost/runs/:opportunityCostRunId/actions`, `GET /api/v1/equity-participation-opportunity-cost/summary` | `test/equity-participation-opportunity-cost.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:210`

### POST /api/v1/equity-participation-opportunity-cost/runs/:opportunityCostRunId/actions
- Best context: `| `equity-participation-opportunity-cost` | `POST /api/v1/equity-participation-opportunity-cost/runs`, `POST /api/v1/equity-participation-opportunity-cost/runs/:opportunityCostRunId/actions`, `GET /api/v1/equity-participation-opportunity-cost/summary` | `test/equity-participation-opportunity-cost.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:210`

### GET /api/v1/equity-participation-opportunity-cost/summary
- Best context: `| `equity-participation-opportunity-cost` | `POST /api/v1/equity-participation-opportunity-cost/runs`, `POST /api/v1/equity-participation-opportunity-cost/runs/:opportunityCostRunId/actions`, `GET /api/v1/equity-participation-opportunity-cost/summary` | `test/equity-participation-opportunity-cost.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:210`

### POST /api/v1/equity-resource-efficiency/audits
- Best context: `| `equity-resource-efficiency` | `POST /api/v1/equity-resource-efficiency/audits`, `POST /api/v1/equity-resource-efficiency/audits/:resourceEfficiencyAuditId/actions`, `GET /api/v1/equity-resource-efficiency/summary` | `test/equity-resource-efficiency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:162`

### POST /api/v1/equity-resource-efficiency/audits/:resourceEfficiencyAuditId/actions
- Best context: `| `equity-resource-efficiency` | `POST /api/v1/equity-resource-efficiency/audits`, `POST /api/v1/equity-resource-efficiency/audits/:resourceEfficiencyAuditId/actions`, `GET /api/v1/equity-resource-efficiency/summary` | `test/equity-resource-efficiency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:162`

### GET /api/v1/equity-resource-efficiency/summary
- Best context: `| `equity-resource-efficiency` | `POST /api/v1/equity-resource-efficiency/audits`, `POST /api/v1/equity-resource-efficiency/audits/:resourceEfficiencyAuditId/actions`, `GET /api/v1/equity-resource-efficiency/summary` | `test/equity-resource-efficiency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:162`

### POST /api/v1/equity-resource-parity/audits
- Best context: `| `equity-resource-parity` | `POST /api/v1/equity-resource-parity/audits`, `POST /api/v1/equity-resource-parity/audits/:parityAuditId/actions`, `GET /api/v1/equity-resource-parity/summary` | `test/equity-resource-parity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:152`

### POST /api/v1/equity-resource-parity/audits/:parityAuditId/actions
- Best context: `| `equity-resource-parity` | `POST /api/v1/equity-resource-parity/audits`, `POST /api/v1/equity-resource-parity/audits/:parityAuditId/actions`, `GET /api/v1/equity-resource-parity/summary` | `test/equity-resource-parity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:152`

### GET /api/v1/equity-resource-parity/summary
- Best context: `| `equity-resource-parity` | `POST /api/v1/equity-resource-parity/audits`, `POST /api/v1/equity-resource-parity/audits/:parityAuditId/actions`, `GET /api/v1/equity-resource-parity/summary` | `test/equity-resource-parity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:152`

### POST /api/v1/equity-response-efficacy/runs
- Best context: `| `equity-response-efficacy` | `POST /api/v1/equity-response-efficacy/runs`, `POST /api/v1/equity-response-efficacy/runs/:efficacyRunId/actions`, `GET /api/v1/equity-response-efficacy/summary` | `test/equity-response-efficacy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:122`

### POST /api/v1/equity-response-efficacy/runs/:efficacyRunId/actions
- Best context: `| `equity-response-efficacy` | `POST /api/v1/equity-response-efficacy/runs`, `POST /api/v1/equity-response-efficacy/runs/:efficacyRunId/actions`, `GET /api/v1/equity-response-efficacy/summary` | `test/equity-response-efficacy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:122`

### GET /api/v1/equity-response-efficacy/summary
- Best context: `| `equity-response-efficacy` | `POST /api/v1/equity-response-efficacy/runs`, `POST /api/v1/equity-response-efficacy/runs/:efficacyRunId/actions`, `GET /api/v1/equity-response-efficacy/summary` | `test/equity-response-efficacy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:122`

### POST /api/v1/equity-root-cause-attribution/runs
- Best context: `| `equity-root-cause-attribution` | `POST /api/v1/equity-root-cause-attribution/runs`, `POST /api/v1/equity-root-cause-attribution/runs/:rootCauseRunId/actions`, `GET /api/v1/equity-root-cause-attribution/summary` | `test/equity-root-cause-attribution.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:167`

### POST /api/v1/equity-root-cause-attribution/runs/:rootCauseRunId/actions
- Best context: `| `equity-root-cause-attribution` | `POST /api/v1/equity-root-cause-attribution/runs`, `POST /api/v1/equity-root-cause-attribution/runs/:rootCauseRunId/actions`, `GET /api/v1/equity-root-cause-attribution/summary` | `test/equity-root-cause-attribution.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:167`

### GET /api/v1/equity-root-cause-attribution/summary
- Best context: `| `equity-root-cause-attribution` | `POST /api/v1/equity-root-cause-attribution/runs`, `POST /api/v1/equity-root-cause-attribution/runs/:rootCauseRunId/actions`, `GET /api/v1/equity-root-cause-attribution/summary` | `test/equity-root-cause-attribution.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:167`

### POST /api/v1/equity-sentinels
- Best context: `| `learning-equity-sentinel` | `POST /api/v1/equity-sentinels`, `POST /api/v1/equity-sentinels/:sentinelId/signals` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:65`

### POST /api/v1/equity-sentinels/:sentinelId/signals
- Best context: `| `learning-equity-sentinel` | `POST /api/v1/equity-sentinels`, `POST /api/v1/equity-sentinels/:sentinelId/signals` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:65`

### POST /api/v1/equity-sustainability/runs
- Best context: `| `equity-sustainability` | `POST /api/v1/equity-sustainability/runs`, `POST /api/v1/equity-sustainability/runs/:sustainabilityRunId/actions`, `GET /api/v1/equity-sustainability/summary` | `test/equity-sustainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:127`

### POST /api/v1/equity-sustainability/runs/:sustainabilityRunId/actions
- Best context: `| `equity-sustainability` | `POST /api/v1/equity-sustainability/runs`, `POST /api/v1/equity-sustainability/runs/:sustainabilityRunId/actions`, `GET /api/v1/equity-sustainability/summary` | `test/equity-sustainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:127`

### GET /api/v1/equity-sustainability/summary
- Best context: `| `equity-sustainability` | `POST /api/v1/equity-sustainability/runs`, `POST /api/v1/equity-sustainability/runs/:sustainabilityRunId/actions`, `GET /api/v1/equity-sustainability/summary` | `test/equity-sustainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:127`

### POST /api/v1/ethics-council/cases
- Best context: `| `federated-ethics-council` | `POST /api/v1/ethics-council/cases`, `POST /api/v1/ethics-council/cases/:caseId/decisions` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:100`

### POST /api/v1/ethics-council/cases/:caseId/decisions
- Best context: `| `federated-ethics-council` | `POST /api/v1/ethics-council/cases`, `POST /api/v1/ethics-council/cases/:caseId/decisions` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:100`

### POST /api/v1/evidence/bundles
- Best context: `| `evidence-vault` | `POST /api/v1/evidence/bundles`, `POST /api/v1/evidence/bundles/:bundleId/attestations` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:10`

### POST /api/v1/evidence/bundles/:bundleId/attestations
- Best context: `| `evidence-vault` | `POST /api/v1/evidence/bundles`, `POST /api/v1/evidence/bundles/:bundleId/attestations` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:10`

### POST /api/v1/exams
- Best context: `| `exams` | `POST /api/v1/exams`, `POST /api/v1/exams/:examId/mark-entries` | `test/platform-kernel.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:23`

### UNSPECIFIED /api/v1/exams/${encodeURIComponent(ensureWorkspaceValue(workspace.exam_id,
- Best context: ``/api/v1/exams/${encodeURIComponent(ensureWorkspaceValue(workspace.exam_id, 'Exam ID'))}/offline-mark-sync-pack``
- Reference: `services\portal-service\assets\portal-owner.js:9811`
- Other refs: 3

### POST /api/v1/exams/:examId/mark-entries
- Best context: `| `exams` | `POST /api/v1/exams`, `POST /api/v1/exams/:examId/mark-entries` | `test/platform-kernel.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:23`

### POST /api/v1/experience/events
- Best context: `| `experience-fabric` | `POST /api/v1/experience/events`, `GET /api/v1/experience/timelines` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:51`

### GET /api/v1/experience/timelines
- Best context: `| `experience-fabric` | `POST /api/v1/experience/events`, `GET /api/v1/experience/timelines` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:51`

### POST /api/v1/explainability-cases
- Best context: `| `explainability-evidence-lab` | `POST /api/v1/explainability-cases`, `POST /api/v1/explainability-cases/:caseId/evidence` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:102`

### POST /api/v1/explainability-cases/:caseId/evidence
- Best context: `| `explainability-evidence-lab` | `POST /api/v1/explainability-cases`, `POST /api/v1/explainability-cases/:caseId/evidence` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:102`

### GET /api/v1/facilities
- Best context: `| `operations` | `GET /api/v1/assets`, `GET /api/v1/facilities` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:74`

### POST /api/v1/family-financial/profiles
- Best context: `| `family-financial-intelligence` | `POST /api/v1/family-financial/profiles`, `POST /api/v1/family-financial/profiles/:profileId/assessments` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:64`

### POST /api/v1/family-financial/profiles/:profileId/assessments
- Best context: `| `family-financial-intelligence` | `POST /api/v1/family-financial/profiles`, `POST /api/v1/family-financial/profiles/:profileId/assessments` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:64`

### POST /api/v1/family-sentiment/feedback
- Best context: `| `family-sentiment` | `POST /api/v1/family-sentiment/feedback`, `POST /api/v1/family-sentiment/feedback/:feedbackId/actions`, `GET /api/v1/family-sentiment/summary` | `test/family-sentiment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:91`

### POST /api/v1/family-sentiment/feedback/:feedbackId/actions
- Best context: `| `family-sentiment` | `POST /api/v1/family-sentiment/feedback`, `POST /api/v1/family-sentiment/feedback/:feedbackId/actions`, `GET /api/v1/family-sentiment/summary` | `test/family-sentiment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:91`

### GET /api/v1/family-sentiment/summary
- Best context: `| `family-sentiment` | `POST /api/v1/family-sentiment/feedback`, `POST /api/v1/family-sentiment/feedback/:feedbackId/actions`, `GET /api/v1/family-sentiment/summary` | `test/family-sentiment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:91`

### POST /api/v1/federated-analytics/queries
- Best context: `| `federated-analytics` | `POST /api/v1/federated-analytics/queries`, `POST /api/v1/federated-analytics/queries/:queryId/results` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:55`

### POST /api/v1/federated-analytics/queries/:queryId/results
- Best context: `| `federated-analytics` | `POST /api/v1/federated-analytics/queries`, `POST /api/v1/federated-analytics/queries/:queryId/results` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:55`

### POST /api/v1/federated-audit/packs
- Best context: `| `federated-audit` | `POST /api/v1/federated-audit/packs`, `POST /api/v1/federated-audit/packs/:packId/entries` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:26`

### POST /api/v1/federated-audit/packs/:packId/entries
- Best context: `| `federated-audit` | `POST /api/v1/federated-audit/packs`, `POST /api/v1/federated-audit/packs/:packId/entries` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:26`

### POST /api/v1/federated-learning/rounds
- Best context: `| `federated-learning` | `POST /api/v1/federated-learning/rounds`, `POST /api/v1/federated-learning/rounds/:roundId/participants` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:42`

### POST /api/v1/federated-learning/rounds/:roundId/participants
- Best context: `| `federated-learning` | `POST /api/v1/federated-learning/rounds`, `POST /api/v1/federated-learning/rounds/:roundId/participants` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:42`

### POST /api/v1/federated-policy/bundles
- Best context: `| `federated-policy-enforcement` | `POST /api/v1/federated-policy/bundles`, `POST /api/v1/federated-policy/bundles/:bundleId/enforcements` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:62`

### POST /api/v1/federated-policy/bundles/:bundleId/enforcements
- Best context: `| `federated-policy-enforcement` | `POST /api/v1/federated-policy/bundles`, `POST /api/v1/federated-policy/bundles/:bundleId/enforcements` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:62`

### POST /api/v1/federated-sandboxes
- Best context: `| `federated-sandbox-governance` | `POST /api/v1/federated-sandboxes`, `POST /api/v1/federated-sandboxes/:sandboxId/approvals` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:72`

### POST /api/v1/federated-sandboxes/:sandboxId/approvals
- Best context: `| `federated-sandbox-governance` | `POST /api/v1/federated-sandboxes`, `POST /api/v1/federated-sandboxes/:sandboxId/approvals` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:72`

### POST /api/v1/federation-benchmarks
- Best context: `| `federation-benchmark` | `POST /api/v1/federation-benchmarks`, `GET /api/v1/federation-benchmarks/:benchmarkId/insights` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:14`

### GET /api/v1/federation-benchmarks/:benchmarkId/insights
- Best context: `| `federation-benchmark` | `POST /api/v1/federation-benchmarks`, `GET /api/v1/federation-benchmarks/:benchmarkId/insights` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:14`

### POST /api/v1/federations
- Best context: `| `federation` | `POST /api/v1/federations`, `POST /api/v1/federations/:federationId/members` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:9`

### POST /api/v1/federations/:federationId/members
- Best context: `| `federation` | `POST /api/v1/federations`, `POST /api/v1/federations/:federationId/members` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:9`

### GET /api/v1/fee-plans
- Best context: `| `finance` | `GET /api/v1/fee-plans`, `GET /api/v1/invoices/:invoiceId` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-billing-alignment.test.mjs`, `test/enterprise-downgrade-sequencing-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:70`

### POST /api/v1/feedback-authenticity-assurance/reviews
- Best context: `| `feedback-authenticity-assurance` | `POST /api/v1/feedback-authenticity-assurance/reviews`, `POST /api/v1/feedback-authenticity-assurance/reviews/:authenticityReviewId/findings`, `GET /api/v1/feedback-authenticity-assurance/summary` | `test/feedback-authenticity-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:198`

### POST /api/v1/feedback-authenticity-assurance/reviews/:authenticityReviewId/findings
- Best context: `| `feedback-authenticity-assurance` | `POST /api/v1/feedback-authenticity-assurance/reviews`, `POST /api/v1/feedback-authenticity-assurance/reviews/:authenticityReviewId/findings`, `GET /api/v1/feedback-authenticity-assurance/summary` | `test/feedback-authenticity-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:198`

### GET /api/v1/feedback-authenticity-assurance/summary
- Best context: `| `feedback-authenticity-assurance` | `POST /api/v1/feedback-authenticity-assurance/reviews`, `POST /api/v1/feedback-authenticity-assurance/reviews/:authenticityReviewId/findings`, `GET /api/v1/feedback-authenticity-assurance/summary` | `test/feedback-authenticity-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:198`

### POST /api/v1/feedback-authenticity-drift/reviews
- Best context: `| `feedback-authenticity-drift` | `POST /api/v1/feedback-authenticity-drift/reviews`, `POST /api/v1/feedback-authenticity-drift/reviews/:authenticityDriftReviewId/findings`, `GET /api/v1/feedback-authenticity-drift/summary` | `test/feedback-authenticity-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:208`

### POST /api/v1/feedback-authenticity-drift/reviews/:authenticityDriftReviewId/findings
- Best context: `| `feedback-authenticity-drift` | `POST /api/v1/feedback-authenticity-drift/reviews`, `POST /api/v1/feedback-authenticity-drift/reviews/:authenticityDriftReviewId/findings`, `GET /api/v1/feedback-authenticity-drift/summary` | `test/feedback-authenticity-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:208`

### GET /api/v1/feedback-authenticity-drift/summary
- Best context: `| `feedback-authenticity-drift` | `POST /api/v1/feedback-authenticity-drift/reviews`, `POST /api/v1/feedback-authenticity-drift/reviews/:authenticityDriftReviewId/findings`, `GET /api/v1/feedback-authenticity-drift/summary` | `test/feedback-authenticity-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:208`

### POST /api/v1/feedback-signal-integrity/reviews
- Best context: `| `feedback-signal-integrity` | `POST /api/v1/feedback-signal-integrity/reviews`, `POST /api/v1/feedback-signal-integrity/reviews/:signalIntegrityReviewId/findings`, `GET /api/v1/feedback-signal-integrity/summary` | `test/feedback-signal-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:188`

### POST /api/v1/feedback-signal-integrity/reviews/:signalIntegrityReviewId/findings
- Best context: `| `feedback-signal-integrity` | `POST /api/v1/feedback-signal-integrity/reviews`, `POST /api/v1/feedback-signal-integrity/reviews/:signalIntegrityReviewId/findings`, `GET /api/v1/feedback-signal-integrity/summary` | `test/feedback-signal-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:188`

### GET /api/v1/feedback-signal-integrity/summary
- Best context: `| `feedback-signal-integrity` | `POST /api/v1/feedback-signal-integrity/reviews`, `POST /api/v1/feedback-signal-integrity/reviews/:signalIntegrityReviewId/findings`, `GET /api/v1/feedback-signal-integrity/summary` | `test/feedback-signal-integrity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:188`

### POST /api/v1/finance-forecast/tuition-scenarios
- Best context: `| `finance-forecast` | `POST /api/v1/finance-forecast/tuition-scenarios`, `POST /api/v1/finance-forecast/tuition-scenarios/:scenarioId/run` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:55`

### POST /api/v1/finance-forecast/tuition-scenarios/:scenarioId/run
- Best context: `| `finance-forecast` | `POST /api/v1/finance-forecast/tuition-scenarios`, `POST /api/v1/finance-forecast/tuition-scenarios/:scenarioId/run` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:55`

### POST /api/v1/governance-automation/policies
- Best context: `| `governance-automation-lab` | `POST /api/v1/governance-automation/policies`, `POST /api/v1/governance-automation/policies/:policyId/runs` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:70`

### POST /api/v1/governance-automation/policies/:policyId/runs
- Best context: `| `governance-automation-lab` | `POST /api/v1/governance-automation/policies`, `POST /api/v1/governance-automation/policies/:policyId/runs` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:70`

### UNSPECIFIED /api/v1/governance/portfolio/events?${params.toString()}
- Best context: `return api(`/api/v1/governance/portfolio/events?${params.toString()}`);`
- Reference: `services\portal-service\assets\portal-owner.js:9826`
- Other refs: 1

### UNSPECIFIED /api/v1/governance/portfolio/events?tenant_id=${encodeURIComponent(focusedTenantId)}
- Best context: `? api(`/api/v1/governance/portfolio/events?tenant_id=${encodeURIComponent(focusedTenantId)}`).catch(() => ({ items: [] }))`
- Reference: `services\portal-service\assets\portal-owner.js:3336`

### UNSPECIFIED /api/v1/governance/portfolio/events?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `? api(`/api/v1/governance/portfolio/events?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => ({ items: [] }))`
- Reference: `services\portal-service\assets\portal.js:1587`

### UNSPECIFIED /api/v1/governance/portfolio/events?tenant_id=${encodeURIComponent(workspace.tenant_id)}&school_id=${encodeURIComponent(selectedSchoolId)}&limit=10
- Best context: `? api(`/api/v1/governance/portfolio/events?tenant_id=${encodeURIComponent(workspace.tenant_id)}&school_id=${encodeURIComponent(selectedSchoolId)}&limit=10`).catch(() => ({ items: [] }))`
- Reference: `services\portal-service\assets\portal-owner.js:7095`

### UNSPECIFIED /api/v1/governance/portfolio?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/governance/portfolio?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:7075`

### POST /api/v1/grade-levels
- Best context: `| `academics` | `POST /api/v1/academic-years`, `POST /api/v1/grade-levels` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:19`

### POST /api/v1/guardian-advocacy/cases
- Best context: `| `guardian-advocacy-network` | `POST /api/v1/guardian-advocacy/cases`, `POST /api/v1/guardian-advocacy/cases/:caseId/escalations` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:109`

### POST /api/v1/guardian-advocacy/cases/:caseId/escalations
- Best context: `| `guardian-advocacy-network` | `POST /api/v1/guardian-advocacy/cases`, `POST /api/v1/guardian-advocacy/cases/:caseId/escalations` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:109`

### POST /api/v1/guardian-links
- Best context: `| `parent-visibility` | `POST /api/v1/guardian-links`, `GET /api/v1/principals/:principalId/children` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:26`

### POST /api/v1/identity-federations
- Best context: `| `identity-federation` | `POST /api/v1/identity-federations`, `POST /api/v1/identity-federations/:federationId/links` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:34`

### POST /api/v1/identity-federations/:federationId/links
- Best context: `| `identity-federation` | `POST /api/v1/identity-federations`, `POST /api/v1/identity-federations/:federationId/links` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:34`

### POST /api/v1/identity-proofing/sessions
- Best context: `| `identity-proofing` | `POST /api/v1/identity-proofing/sessions`, `POST /api/v1/identity-proofing/sessions/:sessionId/decide` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:23`

### POST /api/v1/identity-proofing/sessions/:sessionId/decide
- Best context: `| `identity-proofing` | `POST /api/v1/identity-proofing/sessions`, `POST /api/v1/identity-proofing/sessions/:sessionId/decide` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:23`

### POST /api/v1/identity-risk/profiles
- Best context: `| `identity-risk-shield` | `POST /api/v1/identity-risk/profiles`, `POST /api/v1/identity-risk/profiles/:profileId/mitigations` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:69`

### POST /api/v1/identity-risk/profiles/:profileId/mitigations
- Best context: `| `identity-risk-shield` | `POST /api/v1/identity-risk/profiles`, `POST /api/v1/identity-risk/profiles/:profileId/mitigations` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:69`

### POST /api/v1/identity-wallets
- Best context: `| `sovereign-identity-wallet` | `POST /api/v1/identity-wallets`, `POST /api/v1/identity-wallets/:walletId/credentials` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:53`

### POST /api/v1/identity-wallets/:walletId/credentials
- Best context: `| `sovereign-identity-wallet` | `POST /api/v1/identity-wallets`, `POST /api/v1/identity-wallets/:walletId/credentials` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:53`

### POST /api/v1/impact-assurance/cases
- Best context: `| `impact-assurance` | `POST /api/v1/impact-assurance/cases`, `POST /api/v1/impact-assurance/cases/:caseId/evidence` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:46`

### POST /api/v1/impact-assurance/cases/:caseId/evidence
- Best context: `| `impact-assurance` | `POST /api/v1/impact-assurance/cases`, `POST /api/v1/impact-assurance/cases/:caseId/evidence` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:46`

### POST /api/v1/inbox/:deliveryId/read
- Best context: `| `communication` | `POST /api/v1/notices`, `POST /api/v1/inbox/:deliveryId/read` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:27`

### POST /api/v1/incident-coordination/incidents
- Best context: `| `incident-coordination-network` | `POST /api/v1/incident-coordination/incidents`, `POST /api/v1/incident-coordination/incidents/:incidentId/actions` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:60`

### POST /api/v1/incident-coordination/incidents/:incidentId/actions
- Best context: `| `incident-coordination-network` | `POST /api/v1/incident-coordination/incidents`, `POST /api/v1/incident-coordination/incidents/:incidentId/actions` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:60`

### POST /api/v1/incident-evidence/cases
- Best context: `| `incident-evidence-network` | `POST /api/v1/incident-evidence/cases`, `POST /api/v1/incident-evidence/cases/:caseId/shares` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:68`

### POST /api/v1/incident-evidence/cases/:caseId/shares
- Best context: `| `incident-evidence-network` | `POST /api/v1/incident-evidence/cases`, `POST /api/v1/incident-evidence/cases/:caseId/shares` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:68`

### POST /api/v1/incident-signals
- Best context: `| `federated-incident-signals` | `POST /api/v1/incident-signals`, `POST /api/v1/incident-signals/:signalId/acknowledgements` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:82`

### POST /api/v1/incident-signals/:signalId/acknowledgements
- Best context: `| `federated-incident-signals` | `POST /api/v1/incident-signals`, `POST /api/v1/incident-signals/:signalId/acknowledgements` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:82`

### GET /api/v1/initiative-portfolio/health
- Best context: `| `initiative-portfolio` | `POST /api/v1/initiatives`, `GET /api/v1/initiative-portfolio/health` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:48`

### POST /api/v1/initiatives
- Best context: `| `initiative-portfolio` | `POST /api/v1/initiatives`, `GET /api/v1/initiative-portfolio/health` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:48`

### POST /api/v1/instructional-coaching/observations
- Best context: `| `instructional-coaching` | `POST /api/v1/instructional-coaching/observations`, `POST /api/v1/instructional-coaching/plans`, `POST /api/v1/instructional-coaching/plans/:coachingPlanId/check-ins`, `GET /api/v1/instructional-coaching/summary` | `test/instructional-coaching.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:88`

### POST /api/v1/instructional-coaching/plans
- Best context: `| `instructional-coaching` | `POST /api/v1/instructional-coaching/observations`, `POST /api/v1/instructional-coaching/plans`, `POST /api/v1/instructional-coaching/plans/:coachingPlanId/check-ins`, `GET /api/v1/instructional-coaching/summary` | `test/instructional-coaching.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:88`

### POST /api/v1/instructional-coaching/plans/:coachingPlanId/check-ins
- Best context: `| `instructional-coaching` | `POST /api/v1/instructional-coaching/observations`, `POST /api/v1/instructional-coaching/plans`, `POST /api/v1/instructional-coaching/plans/:coachingPlanId/check-ins`, `GET /api/v1/instructional-coaching/summary` | `test/instructional-coaching.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:88`

### GET /api/v1/instructional-coaching/summary
- Best context: `| `instructional-coaching` | `POST /api/v1/instructional-coaching/observations`, `POST /api/v1/instructional-coaching/plans`, `POST /api/v1/instructional-coaching/plans/:coachingPlanId/check-ins`, `GET /api/v1/instructional-coaching/summary` | `test/instructional-coaching.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:88`

### POST /api/v1/instructional-content-provenance/scans
- Best context: `| `instructional-content-provenance` | `POST /api/v1/instructional-content-provenance/scans`, `POST /api/v1/instructional-content-provenance/scans/:contentProvenanceScanId/findings`, `GET /api/v1/instructional-content-provenance/summary` | `test/instructional-content-provenance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:184`

### POST /api/v1/instructional-content-provenance/scans/:contentProvenanceScanId/findings
- Best context: `| `instructional-content-provenance` | `POST /api/v1/instructional-content-provenance/scans`, `POST /api/v1/instructional-content-provenance/scans/:contentProvenanceScanId/findings`, `GET /api/v1/instructional-content-provenance/summary` | `test/instructional-content-provenance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:184`

### GET /api/v1/instructional-content-provenance/summary
- Best context: `| `instructional-content-provenance` | `POST /api/v1/instructional-content-provenance/scans`, `POST /api/v1/instructional-content-provenance/scans/:contentProvenanceScanId/findings`, `GET /api/v1/instructional-content-provenance/summary` | `test/instructional-content-provenance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:184`

### POST /api/v1/instructional-safety/gates
- Best context: `| `instructional-safety-gate` | `POST /api/v1/instructional-safety/gates`, `POST /api/v1/instructional-safety/gates/:gateId/blocks` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:105`

### POST /api/v1/instructional-safety/gates/:gateId/blocks
- Best context: `| `instructional-safety-gate` | `POST /api/v1/instructional-safety/gates`, `POST /api/v1/instructional-safety/gates/:gateId/blocks` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:105`

### POST /api/v1/instructional-source-credibility-ledger/scans
- Best context: `| `instructional-source-credibility-ledger` | `POST /api/v1/instructional-source-credibility-ledger/scans`, `POST /api/v1/instructional-source-credibility-ledger/scans/:sourceCredibilityScanId/findings`, `GET /api/v1/instructional-source-credibility-ledger/summary` | `test/instructional-source-credibility-ledger.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:204`

### POST /api/v1/instructional-source-credibility-ledger/scans/:sourceCredibilityScanId/findings
- Best context: `| `instructional-source-credibility-ledger` | `POST /api/v1/instructional-source-credibility-ledger/scans`, `POST /api/v1/instructional-source-credibility-ledger/scans/:sourceCredibilityScanId/findings`, `GET /api/v1/instructional-source-credibility-ledger/summary` | `test/instructional-source-credibility-ledger.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:204`

### GET /api/v1/instructional-source-credibility-ledger/summary
- Best context: `| `instructional-source-credibility-ledger` | `POST /api/v1/instructional-source-credibility-ledger/scans`, `POST /api/v1/instructional-source-credibility-ledger/scans/:sourceCredibilityScanId/findings`, `GET /api/v1/instructional-source-credibility-ledger/summary` | `test/instructional-source-credibility-ledger.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:204`

### POST /api/v1/instructional-source-drift/scans
- Best context: `| `instructional-source-drift` | `POST /api/v1/instructional-source-drift/scans`, `POST /api/v1/instructional-source-drift/scans/:sourceDriftScanId/findings`, `GET /api/v1/instructional-source-drift/summary` | `test/instructional-source-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:194`

### POST /api/v1/instructional-source-drift/scans/:sourceDriftScanId/findings
- Best context: `| `instructional-source-drift` | `POST /api/v1/instructional-source-drift/scans`, `POST /api/v1/instructional-source-drift/scans/:sourceDriftScanId/findings`, `GET /api/v1/instructional-source-drift/summary` | `test/instructional-source-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:194`

### GET /api/v1/instructional-source-drift/summary
- Best context: `| `instructional-source-drift` | `POST /api/v1/instructional-source-drift/scans`, `POST /api/v1/instructional-source-drift/scans/:sourceDriftScanId/findings`, `GET /api/v1/instructional-source-drift/summary` | `test/instructional-source-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:194`

### POST /api/v1/instructional-workload/snapshots
- Best context: `| `instructional-workload` | `POST /api/v1/instructional-workload/snapshots`, `POST /api/v1/instructional-workload/snapshots/:workloadSnapshotId/adjustments`, `GET /api/v1/instructional-workload/summary` | `test/instructional-workload.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:97`

### POST /api/v1/instructional-workload/snapshots/:workloadSnapshotId/adjustments
- Best context: `| `instructional-workload` | `POST /api/v1/instructional-workload/snapshots`, `POST /api/v1/instructional-workload/snapshots/:workloadSnapshotId/adjustments`, `GET /api/v1/instructional-workload/summary` | `test/instructional-workload.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:97`

### GET /api/v1/instructional-workload/summary
- Best context: `| `instructional-workload` | `POST /api/v1/instructional-workload/snapshots`, `POST /api/v1/instructional-workload/snapshots/:workloadSnapshotId/adjustments`, `GET /api/v1/instructional-workload/summary` | `test/instructional-workload.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:97`

### POST /api/v1/integration-hub/endpoints
- Best context: `| `integration` | `POST /api/v1/integration-hub/health:refresh`, `GET /api/v1/integration-hub/sla-drift`, `POST /api/v1/integration-hub/sync-schedules`, `POST /api/v1/integration-hub/endpoints`, `POST /api/v1/edge-devices` | `test/integration-observability.test.mjs`, `test/integration-schedule.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs`, `test/enterprise-integration-edge-devices.test.mjs`, `test/enterprise-integration-endpoints.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:41`

### GET /api/v1/integration-hub/health
- Best context: `1. Run `POST /api/v1/integration-hub/health:refresh` for a live tenant and confirm `GET /api/v1/integration-hub/health` returns connector health snapshots.`
- Reference: `docs\runbooks\deployment.md:79`

### POST /api/v1/integration-hub/health:refresh
- Best context: `| `integration` | `POST /api/v1/integration-hub/health:refresh`, `GET /api/v1/integration-hub/sla-drift`, `POST /api/v1/integration-hub/sync-schedules`, `POST /api/v1/integration-hub/endpoints`, `POST /api/v1/edge-devices` | `test/integration-observability.test.mjs`, `test/integration-schedule.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs`, `test/enterprise-integration-edge-devices.test.mjs`, `test/enterprise-integration-endpoints.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:41`
- Other refs: 1

### GET /api/v1/integration-hub/sla-drift
- Best context: `| `integration` | `POST /api/v1/integration-hub/health:refresh`, `GET /api/v1/integration-hub/sla-drift`, `POST /api/v1/integration-hub/sync-schedules`, `POST /api/v1/integration-hub/endpoints`, `POST /api/v1/edge-devices` | `test/integration-observability.test.mjs`, `test/integration-schedule.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs`, `test/enterprise-integration-edge-devices.test.mjs`, `test/enterprise-integration-endpoints.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:41`
- Other refs: 1

### POST /api/v1/integration-hub/sync-schedules
- Best context: `| `integration` | `POST /api/v1/integration-hub/health:refresh`, `GET /api/v1/integration-hub/sla-drift`, `POST /api/v1/integration-hub/sync-schedules`, `POST /api/v1/integration-hub/endpoints`, `POST /api/v1/edge-devices` | `test/integration-observability.test.mjs`, `test/integration-schedule.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs`, `test/enterprise-integration-edge-devices.test.mjs`, `test/enterprise-integration-endpoints.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:41`

### POST /api/v1/integrity-cases
- Best context: `| `learning-integrity-shield` | `POST /api/v1/integrity-cases`, `POST /api/v1/integrity-cases/:caseId/actions` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:75`

### POST /api/v1/integrity-cases/:caseId/actions
- Best context: `| `learning-integrity-shield` | `POST /api/v1/integrity-cases`, `POST /api/v1/integrity-cases/:caseId/actions` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:75`

### POST /api/v1/interoperability/connections
- Best context: `| `interoperability-hub` | `POST /api/v1/interoperability/connections`, `POST /api/v1/interoperability/connections/:connectionId/conformance-runs` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:12`

### POST /api/v1/interoperability/connections/:connectionId/conformance-runs
- Best context: `| `interoperability-hub` | `POST /api/v1/interoperability/connections`, `POST /api/v1/interoperability/connections/:connectionId/conformance-runs` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:12`

### POST /api/v1/intervention-assurance/cases
- Best context: `| `intervention-assurance` | `POST /api/v1/intervention-assurance/cases`, `POST /api/v1/intervention-assurance/cases/:caseId/verifications` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:110`

### POST /api/v1/intervention-assurance/cases/:caseId/verifications
- Best context: `| `intervention-assurance` | `POST /api/v1/intervention-assurance/cases`, `POST /api/v1/intervention-assurance/cases/:caseId/verifications` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:110`

### POST /api/v1/intervention-attribution/runs
- Best context: `| `intervention-attribution` | `POST /api/v1/intervention-attribution/runs`, `POST /api/v1/intervention-attribution/runs/:attributionRunId/insights`, `GET /api/v1/intervention-attribution/summary` | `test/intervention-attribution.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:107`

### POST /api/v1/intervention-attribution/runs/:attributionRunId/insights
- Best context: `| `intervention-attribution` | `POST /api/v1/intervention-attribution/runs`, `POST /api/v1/intervention-attribution/runs/:attributionRunId/insights`, `GET /api/v1/intervention-attribution/summary` | `test/intervention-attribution.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:107`

### GET /api/v1/intervention-attribution/summary
- Best context: `| `intervention-attribution` | `POST /api/v1/intervention-attribution/runs`, `POST /api/v1/intervention-attribution/runs/:attributionRunId/insights`, `GET /api/v1/intervention-attribution/summary` | `test/intervention-attribution.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:107`

### POST /api/v1/intervention-consent-freshness/audits
- Best context: `| `intervention-consent-freshness` | `POST /api/v1/intervention-consent-freshness/audits`, `POST /api/v1/intervention-consent-freshness/audits/:consentFreshnessAuditId/actions`, `GET /api/v1/intervention-consent-freshness/summary` | `test/intervention-consent-freshness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:187`

### POST /api/v1/intervention-consent-freshness/audits/:consentFreshnessAuditId/actions
- Best context: `| `intervention-consent-freshness` | `POST /api/v1/intervention-consent-freshness/audits`, `POST /api/v1/intervention-consent-freshness/audits/:consentFreshnessAuditId/actions`, `GET /api/v1/intervention-consent-freshness/summary` | `test/intervention-consent-freshness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:187`

### GET /api/v1/intervention-consent-freshness/summary
- Best context: `| `intervention-consent-freshness` | `POST /api/v1/intervention-consent-freshness/audits`, `POST /api/v1/intervention-consent-freshness/audits/:consentFreshnessAuditId/actions`, `GET /api/v1/intervention-consent-freshness/summary` | `test/intervention-consent-freshness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:187`

### GET /api/v1/invoices/:invoiceId
- Best context: `| `finance` | `GET /api/v1/fee-plans`, `GET /api/v1/invoices/:invoiceId` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-billing-alignment.test.mjs`, `test/enterprise-downgrade-sequencing-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:70`

### POST /api/v1/key-escrow/escrows
- Best context: `| `sovereign-key-escrow` | `POST /api/v1/key-escrow/escrows`, `POST /api/v1/key-escrow/escrows/:escrowId/releases` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:44`

### POST /api/v1/key-escrow/escrows/:escrowId/releases
- Best context: `| `sovereign-key-escrow` | `POST /api/v1/key-escrow/escrows`, `POST /api/v1/key-escrow/escrows/:escrowId/releases` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:44`

### POST /api/v1/knowledge-fabric/nodes
- Best context: `| `knowledge-fabric` | `POST /api/v1/knowledge-fabric/nodes`, `POST /api/v1/knowledge-fabric/queries` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:57`

### POST /api/v1/knowledge-fabric/queries
- Best context: `| `knowledge-fabric` | `POST /api/v1/knowledge-fabric/nodes`, `POST /api/v1/knowledge-fabric/queries` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:57`

### POST /api/v1/knowledge-provenance/assets
- Best context: `| `knowledge-provenance` | `POST /api/v1/knowledge-provenance/assets`, `POST /api/v1/knowledge-provenance/assets/:assetId/entries` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:39`

### POST /api/v1/knowledge-provenance/assets/:assetId/entries
- Best context: `| `knowledge-provenance` | `POST /api/v1/knowledge-provenance/assets`, `POST /api/v1/knowledge-provenance/assets/:assetId/entries` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:39`

### POST /api/v1/knowledge/questions
- Best context: `| `data-intelligence` | `GET /api/v1/search/documents`, `POST /api/v1/knowledge/questions` | `test/search-knowledge-brain.test.mjs`, `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:69`

### UNSPECIFIED /api/v1/launch-governance/escalations/${encodeURIComponent(escalation.escalation_id)}/follow-up-actions
- Best context: ``/api/v1/launch-governance/escalations/${encodeURIComponent(escalation.escalation_id)}/follow-up-actions`,`
- Reference: `services\portal-service\assets\portal-owner.js:9333`

### UNSPECIFIED /api/v1/launch-governance/escalations/${encodeURIComponent(escalation.escalation_id)}/notes
- Best context: ``/api/v1/launch-governance/escalations/${encodeURIComponent(escalation.escalation_id)}/notes`,`
- Reference: `services\portal-service\assets\portal-owner.js:9304`

### UNSPECIFIED /api/v1/launch-governance/escalations/${encodeURIComponent(escalationId)}/acknowledge
- Best context: ``/api/v1/launch-governance/escalations/${encodeURIComponent(escalationId)}/acknowledge`,`
- Reference: `services\portal-service\assets\portal-owner.js:9273`

### UNSPECIFIED /api/v1/launch-governance/escalations/${encodeURIComponent(escalationId)}/resolve
- Best context: ``/api/v1/launch-governance/escalations/${encodeURIComponent(escalationId)}/resolve`,`
- Reference: `services\portal-service\assets\portal-owner.js:9285`

### UNSPECIFIED /api/v1/launch-governance/escalations/${encodeURIComponent(escalationId)}?tenant_id=${encodeURIComponent(tenantId)}
- Best context: `const detail = await api(`/api/v1/launch-governance/escalations/${encodeURIComponent(escalationId)}?tenant_id=${encodeURIComponent(tenantId)}`).catch(() => null);`
- Reference: `services\portal-service\assets\portal-owner.js:9153`

### UNSPECIFIED /api/v1/launch-governance/escalations/${encodeURIComponent(selectedEscalationId)}?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `? await api(`/api/v1/launch-governance/escalations/${encodeURIComponent(selectedEscalationId)}?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:7148`

### UNSPECIFIED /api/v1/launch-governance/escalations?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=20
- Best context: `? api(`/api/v1/launch-governance/escalations?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=20`).catch(() => ({ items: [] }))`
- Reference: `services\portal-service\assets\portal-owner.js:7101`

### UNSPECIFIED /api/v1/launch-governance/follow-up-actions/${encodeURIComponent(followUpActionId)}/complete
- Best context: ``/api/v1/launch-governance/follow-up-actions/${encodeURIComponent(followUpActionId)}/complete`,`
- Reference: `services\portal-service\assets\portal-owner.js:9359`

### UNSPECIFIED /api/v1/launch-governance/summary?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `? api(`/api/v1/launch-governance/summary?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:7098`

### UNSPECIFIED /api/v1/launch-readiness/summary?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/launch-readiness/summary?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:7077`

### UNSPECIFIED /api/v1/launch-readiness/summary?tenant_id=${encodeURIComponent(workspace.tenant_id)}&school_id=${encodeURIComponent(selectedSchoolId)}
- Best context: `? api(`/api/v1/launch-readiness/summary?tenant_id=${encodeURIComponent(workspace.tenant_id)}&school_id=${encodeURIComponent(selectedSchoolId)}`).catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:7092`

### UNSPECIFIED /api/v1/launch-readiness/sweeps
- Best context: `'/api/v1/launch-readiness/sweeps',`
- Reference: `services\portal-service\assets\portal-owner.js:8346`

### POST /api/v1/learner-agency-drift/reviews
- Best context: `| `learner-agency-drift` | `POST /api/v1/learner-agency-drift/reviews`, `POST /api/v1/learner-agency-drift/reviews/:agencyDriftReviewId/actions`, `GET /api/v1/learner-agency-drift/summary` | `test/learner-agency-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:186`

### POST /api/v1/learner-agency-drift/reviews/:agencyDriftReviewId/actions
- Best context: `| `learner-agency-drift` | `POST /api/v1/learner-agency-drift/reviews`, `POST /api/v1/learner-agency-drift/reviews/:agencyDriftReviewId/actions`, `GET /api/v1/learner-agency-drift/summary` | `test/learner-agency-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:186`

### GET /api/v1/learner-agency-drift/summary
- Best context: `| `learner-agency-drift` | `POST /api/v1/learner-agency-drift/reviews`, `POST /api/v1/learner-agency-drift/reviews/:agencyDriftReviewId/actions`, `GET /api/v1/learner-agency-drift/summary` | `test/learner-agency-drift.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:186`

### POST /api/v1/learner-confidence-recovery-trajectory/runs
- Best context: `| `learner-confidence-recovery-trajectory` | `POST /api/v1/learner-confidence-recovery-trajectory/runs`, `POST /api/v1/learner-confidence-recovery-trajectory/runs/:confidenceRecoveryRunId/actions`, `GET /api/v1/learner-confidence-recovery-trajectory/summary` | `test/learner-confidence-recovery-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:206`

### POST /api/v1/learner-confidence-recovery-trajectory/runs/:confidenceRecoveryRunId/actions
- Best context: `| `learner-confidence-recovery-trajectory` | `POST /api/v1/learner-confidence-recovery-trajectory/runs`, `POST /api/v1/learner-confidence-recovery-trajectory/runs/:confidenceRecoveryRunId/actions`, `GET /api/v1/learner-confidence-recovery-trajectory/summary` | `test/learner-confidence-recovery-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:206`

### GET /api/v1/learner-confidence-recovery-trajectory/summary
- Best context: `| `learner-confidence-recovery-trajectory` | `POST /api/v1/learner-confidence-recovery-trajectory/runs`, `POST /api/v1/learner-confidence-recovery-trajectory/runs/:confidenceRecoveryRunId/actions`, `GET /api/v1/learner-confidence-recovery-trajectory/summary` | `test/learner-confidence-recovery-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:206`

### POST /api/v1/learner-confidence-volatility/reviews
- Best context: `| `learner-confidence-volatility` | `POST /api/v1/learner-confidence-volatility/reviews`, `POST /api/v1/learner-confidence-volatility/reviews/:confidenceVolatilityReviewId/actions`, `GET /api/v1/learner-confidence-volatility/summary` | `test/learner-confidence-volatility.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:196`

### POST /api/v1/learner-confidence-volatility/reviews/:confidenceVolatilityReviewId/actions
- Best context: `| `learner-confidence-volatility` | `POST /api/v1/learner-confidence-volatility/reviews`, `POST /api/v1/learner-confidence-volatility/reviews/:confidenceVolatilityReviewId/actions`, `GET /api/v1/learner-confidence-volatility/summary` | `test/learner-confidence-volatility.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:196`

### GET /api/v1/learner-confidence-volatility/summary
- Best context: `| `learner-confidence-volatility` | `POST /api/v1/learner-confidence-volatility/reviews`, `POST /api/v1/learner-confidence-volatility/reviews/:confidenceVolatilityReviewId/actions`, `GET /api/v1/learner-confidence-volatility/summary` | `test/learner-confidence-volatility.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:196`

### POST /api/v1/learning-attention-recovery-index/reviews
- Best context: `| `learning-attention-recovery-index` | `POST /api/v1/learning-attention-recovery-index/reviews`, `POST /api/v1/learning-attention-recovery-index/reviews/:attentionRecoveryReviewId/actions`, `GET /api/v1/learning-attention-recovery-index/summary` | `test/learning-attention-recovery-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:203`

### POST /api/v1/learning-attention-recovery-index/reviews/:attentionRecoveryReviewId/actions
- Best context: `| `learning-attention-recovery-index` | `POST /api/v1/learning-attention-recovery-index/reviews`, `POST /api/v1/learning-attention-recovery-index/reviews/:attentionRecoveryReviewId/actions`, `GET /api/v1/learning-attention-recovery-index/summary` | `test/learning-attention-recovery-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:203`

### GET /api/v1/learning-attention-recovery-index/summary
- Best context: `| `learning-attention-recovery-index` | `POST /api/v1/learning-attention-recovery-index/reviews`, `POST /api/v1/learning-attention-recovery-index/reviews/:attentionRecoveryReviewId/actions`, `GET /api/v1/learning-attention-recovery-index/summary` | `test/learning-attention-recovery-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:203`

### POST /api/v1/learning-attention-stability/reviews
- Best context: `| `learning-attention-stability` | `POST /api/v1/learning-attention-stability/reviews`, `POST /api/v1/learning-attention-stability/reviews/:attentionStabilityReviewId/actions`, `GET /api/v1/learning-attention-stability/summary` | `test/learning-attention-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:193`

### POST /api/v1/learning-attention-stability/reviews/:attentionStabilityReviewId/actions
- Best context: `| `learning-attention-stability` | `POST /api/v1/learning-attention-stability/reviews`, `POST /api/v1/learning-attention-stability/reviews/:attentionStabilityReviewId/actions`, `GET /api/v1/learning-attention-stability/summary` | `test/learning-attention-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:193`

### GET /api/v1/learning-attention-stability/summary
- Best context: `| `learning-attention-stability` | `POST /api/v1/learning-attention-stability/reviews`, `POST /api/v1/learning-attention-stability/reviews/:attentionStabilityReviewId/actions`, `GET /api/v1/learning-attention-stability/summary` | `test/learning-attention-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:193`

### POST /api/v1/learning-cognitive-load-stability/reviews
- Best context: `| `learning-cognitive-load-stability` | `POST /api/v1/learning-cognitive-load-stability/reviews`, `POST /api/v1/learning-cognitive-load-stability/reviews/:loadStabilityReviewId/actions`, `GET /api/v1/learning-cognitive-load-stability/summary` | `test/learning-cognitive-load-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:183`

### POST /api/v1/learning-cognitive-load-stability/reviews/:loadStabilityReviewId/actions
- Best context: `| `learning-cognitive-load-stability` | `POST /api/v1/learning-cognitive-load-stability/reviews`, `POST /api/v1/learning-cognitive-load-stability/reviews/:loadStabilityReviewId/actions`, `GET /api/v1/learning-cognitive-load-stability/summary` | `test/learning-cognitive-load-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:183`

### GET /api/v1/learning-cognitive-load-stability/summary
- Best context: `| `learning-cognitive-load-stability` | `POST /api/v1/learning-cognitive-load-stability/reviews`, `POST /api/v1/learning-cognitive-load-stability/reviews/:loadStabilityReviewId/actions`, `GET /api/v1/learning-cognitive-load-stability/summary` | `test/learning-cognitive-load-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:183`

### POST /api/v1/learning-continuity-index/snapshots
- Best context: `| `learning-continuity-index` | `POST /api/v1/learning-continuity-index/snapshots`, `POST /api/v1/learning-continuity-index/snapshots/:continuitySnapshotId/actions`, `GET /api/v1/learning-continuity-index/summary` | `test/learning-continuity-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:133`

### POST /api/v1/learning-continuity-index/snapshots/:continuitySnapshotId/actions
- Best context: `| `learning-continuity-index` | `POST /api/v1/learning-continuity-index/snapshots`, `POST /api/v1/learning-continuity-index/snapshots/:continuitySnapshotId/actions`, `GET /api/v1/learning-continuity-index/summary` | `test/learning-continuity-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:133`

### GET /api/v1/learning-continuity-index/summary
- Best context: `| `learning-continuity-index` | `POST /api/v1/learning-continuity-index/snapshots`, `POST /api/v1/learning-continuity-index/snapshots/:continuitySnapshotId/actions`, `GET /api/v1/learning-continuity-index/summary` | `test/learning-continuity-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:133`

### POST /api/v1/learning-durability/snapshots
- Best context: `| `learning-durability` | `POST /api/v1/learning-durability/snapshots`, `POST /api/v1/learning-durability/snapshots/:durabilitySnapshotId/actions`, `GET /api/v1/learning-durability/summary` | `test/learning-durability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:118`

### POST /api/v1/learning-durability/snapshots/:durabilitySnapshotId/actions
- Best context: `| `learning-durability` | `POST /api/v1/learning-durability/snapshots`, `POST /api/v1/learning-durability/snapshots/:durabilitySnapshotId/actions`, `GET /api/v1/learning-durability/summary` | `test/learning-durability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:118`

### GET /api/v1/learning-durability/summary
- Best context: `| `learning-durability` | `POST /api/v1/learning-durability/snapshots`, `POST /api/v1/learning-durability/snapshots/:durabilitySnapshotId/actions`, `GET /api/v1/learning-durability/summary` | `test/learning-durability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:118`

### POST /api/v1/learning-ecosystem-health/assessments
- Best context: `| `learning-ecosystem-health` | `POST /api/v1/learning-ecosystem-health/assessments`, `POST /api/v1/learning-ecosystem-health/assessments/:ecosystemAssessmentId/actions`, `GET /api/v1/learning-ecosystem-health/summary` | `test/learning-ecosystem-health.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:138`

### POST /api/v1/learning-ecosystem-health/assessments/:ecosystemAssessmentId/actions
- Best context: `| `learning-ecosystem-health` | `POST /api/v1/learning-ecosystem-health/assessments`, `POST /api/v1/learning-ecosystem-health/assessments/:ecosystemAssessmentId/actions`, `GET /api/v1/learning-ecosystem-health/summary` | `test/learning-ecosystem-health.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:138`

### GET /api/v1/learning-ecosystem-health/summary
- Best context: `| `learning-ecosystem-health` | `POST /api/v1/learning-ecosystem-health/assessments`, `POST /api/v1/learning-ecosystem-health/assessments/:ecosystemAssessmentId/actions`, `GET /api/v1/learning-ecosystem-health/summary` | `test/learning-ecosystem-health.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:138`

### POST /api/v1/learning-engagement/forecasts
- Best context: `| `learning-engagement-forecast` | `POST /api/v1/learning-engagement/forecasts`, `POST /api/v1/learning-engagement/forecasts/:forecastId/actions`, `GET /api/v1/learning-engagement/summary` | `test/learning-engagement-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:108`

### POST /api/v1/learning-engagement/forecasts/:forecastId/actions
- Best context: `| `learning-engagement-forecast` | `POST /api/v1/learning-engagement/forecasts`, `POST /api/v1/learning-engagement/forecasts/:forecastId/actions`, `GET /api/v1/learning-engagement/summary` | `test/learning-engagement-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:108`

### GET /api/v1/learning-engagement/summary
- Best context: `| `learning-engagement-forecast` | `POST /api/v1/learning-engagement/forecasts`, `POST /api/v1/learning-engagement/forecasts/:forecastId/actions`, `GET /api/v1/learning-engagement/summary` | `test/learning-engagement-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:108`

### POST /api/v1/learning-exchange/packs
- Best context: `| `learning-exchange` | `POST /api/v1/learning-exchange/packs`, `POST /api/v1/learning-exchange/packs/:packId/policies` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:58`

### POST /api/v1/learning-exchange/packs/:packId/policies
- Best context: `| `learning-exchange` | `POST /api/v1/learning-exchange/packs`, `POST /api/v1/learning-exchange/packs/:packId/policies` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:58`

### POST /api/v1/learning-goals
- Best context: `| `learning-goals` | `POST /api/v1/learning-goals`, `POST /api/v1/learning-goals/:goalId/progress`, `GET /api/v1/learning-goals/summary` | `test/learning-goals.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:100`

### POST /api/v1/learning-goals/:goalId/progress
- Best context: `| `learning-goals` | `POST /api/v1/learning-goals`, `POST /api/v1/learning-goals/:goalId/progress`, `GET /api/v1/learning-goals/summary` | `test/learning-goals.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:100`

### GET /api/v1/learning-goals/summary
- Best context: `| `learning-goals` | `POST /api/v1/learning-goals`, `POST /api/v1/learning-goals/:goalId/progress`, `GET /api/v1/learning-goals/summary` | `test/learning-goals.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:100`

### GET /api/v1/learning-impact/portfolio
- Best context: `| `learning-impact-lab` | `POST /api/v1/learning-impact/studies`, `POST /api/v1/learning-impact/studies/:impactStudyId/runs`, `GET /api/v1/learning-impact/portfolio` | `test/learning-impact-lab.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:83`

### POST /api/v1/learning-impact/studies
- Best context: `| `learning-impact-lab` | `POST /api/v1/learning-impact/studies`, `POST /api/v1/learning-impact/studies/:impactStudyId/runs`, `GET /api/v1/learning-impact/portfolio` | `test/learning-impact-lab.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:83`

### POST /api/v1/learning-impact/studies/:impactStudyId/runs
- Best context: `| `learning-impact-lab` | `POST /api/v1/learning-impact/studies`, `POST /api/v1/learning-impact/studies/:impactStudyId/runs`, `GET /api/v1/learning-impact/portfolio` | `test/learning-impact-lab.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:83`

### POST /api/v1/learning-intervention-burden/forecasts
- Best context: `| `learning-intervention-burden` | `POST /api/v1/learning-intervention-burden/forecasts`, `POST /api/v1/learning-intervention-burden/forecasts/:interventionBurdenForecastId/actions`, `GET /api/v1/learning-intervention-burden/summary` | `test/learning-intervention-burden.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:178`

### POST /api/v1/learning-intervention-burden/forecasts/:interventionBurdenForecastId/actions
- Best context: `| `learning-intervention-burden` | `POST /api/v1/learning-intervention-burden/forecasts`, `POST /api/v1/learning-intervention-burden/forecasts/:interventionBurdenForecastId/actions`, `GET /api/v1/learning-intervention-burden/summary` | `test/learning-intervention-burden.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:178`

### GET /api/v1/learning-intervention-burden/summary
- Best context: `| `learning-intervention-burden` | `POST /api/v1/learning-intervention-burden/forecasts`, `POST /api/v1/learning-intervention-burden/forecasts/:interventionBurdenForecastId/actions`, `GET /api/v1/learning-intervention-burden/summary` | `test/learning-intervention-burden.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:178`

### POST /api/v1/learning-mentorship-impact/studies
- Best context: `| `learning-mentorship-impact` | `POST /api/v1/learning-mentorship-impact/studies`, `POST /api/v1/learning-mentorship-impact/studies/:mentorshipStudyId/actions`, `GET /api/v1/learning-mentorship-impact/summary` | `test/learning-mentorship-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:148`

### POST /api/v1/learning-mentorship-impact/studies/:mentorshipStudyId/actions
- Best context: `| `learning-mentorship-impact` | `POST /api/v1/learning-mentorship-impact/studies`, `POST /api/v1/learning-mentorship-impact/studies/:mentorshipStudyId/actions`, `GET /api/v1/learning-mentorship-impact/summary` | `test/learning-mentorship-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:148`

### GET /api/v1/learning-mentorship-impact/summary
- Best context: `| `learning-mentorship-impact` | `POST /api/v1/learning-mentorship-impact/studies`, `POST /api/v1/learning-mentorship-impact/studies/:mentorshipStudyId/actions`, `GET /api/v1/learning-mentorship-impact/summary` | `test/learning-mentorship-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:148`

### POST /api/v1/learning-metacognition-index/runs
- Best context: `| `learning-metacognition-index` | `POST /api/v1/learning-metacognition-index/runs`, `POST /api/v1/learning-metacognition-index/runs/:metacognitionRunId/actions`, `GET /api/v1/learning-metacognition-index/summary` | `test/learning-metacognition-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:173`

### POST /api/v1/learning-metacognition-index/runs/:metacognitionRunId/actions
- Best context: `| `learning-metacognition-index` | `POST /api/v1/learning-metacognition-index/runs`, `POST /api/v1/learning-metacognition-index/runs/:metacognitionRunId/actions`, `GET /api/v1/learning-metacognition-index/summary` | `test/learning-metacognition-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:173`

### GET /api/v1/learning-metacognition-index/summary
- Best context: `| `learning-metacognition-index` | `POST /api/v1/learning-metacognition-index/runs`, `POST /api/v1/learning-metacognition-index/runs/:metacognitionRunId/actions`, `GET /api/v1/learning-metacognition-index/summary` | `test/learning-metacognition-index.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:173`

### POST /api/v1/learning-orchestration/refresh
- Best context: `| `learning-orchestration` | `POST /api/v1/learning-orchestration/refresh`, `GET /api/v1/learning-orchestration/runs` | `test/learning-orchestration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:39`

### GET /api/v1/learning-orchestration/runs
- Best context: `| `learning-orchestration` | `POST /api/v1/learning-orchestration/refresh`, `GET /api/v1/learning-orchestration/runs` | `test/learning-orchestration.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:39`

### POST /api/v1/learning-passports
- Best context: `| `learning-passport` | `POST /api/v1/learning-passports`, `POST /api/v1/learning-passports/:passportId/entries` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:27`

### POST /api/v1/learning-passports/:passportId/entries
- Best context: `| `learning-passport` | `POST /api/v1/learning-passports`, `POST /api/v1/learning-passports/:passportId/entries` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:27`

### POST /api/v1/learning-path-fidelity/runs
- Best context: `| `learning-path-fidelity` | `POST /api/v1/learning-path-fidelity/runs`, `POST /api/v1/learning-path-fidelity/runs/:fidelityRunId/actions`, `GET /api/v1/learning-path-fidelity/summary` | `test/learning-path-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:102`

### POST /api/v1/learning-path-fidelity/runs/:fidelityRunId/actions
- Best context: `| `learning-path-fidelity` | `POST /api/v1/learning-path-fidelity/runs`, `POST /api/v1/learning-path-fidelity/runs/:fidelityRunId/actions`, `GET /api/v1/learning-path-fidelity/summary` | `test/learning-path-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:102`

### GET /api/v1/learning-path-fidelity/summary
- Best context: `| `learning-path-fidelity` | `POST /api/v1/learning-path-fidelity/runs`, `POST /api/v1/learning-path-fidelity/runs/:fidelityRunId/actions`, `GET /api/v1/learning-path-fidelity/summary` | `test/learning-path-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:102`

### POST /api/v1/learning-paths/:pathId/steps/:stepId/complete
- Best context: `| `adaptive-learning` | `POST /api/v1/learning-paths/generate`, `POST /api/v1/learning-paths/:pathId/steps/:stepId/complete` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:37`

### POST /api/v1/learning-paths/generate
- Best context: `| `adaptive-learning` | `POST /api/v1/learning-paths/generate`, `POST /api/v1/learning-paths/:pathId/steps/:stepId/complete` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:37`

### GET /api/v1/learning-pulse/events
- Best context: `| `learning-pulse` | `POST /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/summary`, `GET /api/v1/learning-pulse/students/:studentId/summary` | `test/learning-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:89`

### POST /api/v1/learning-pulse/events
- Best context: `| `learning-pulse` | `POST /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/summary`, `GET /api/v1/learning-pulse/students/:studentId/summary` | `test/learning-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:89`

### GET /api/v1/learning-pulse/students/:studentId/summary
- Best context: `| `learning-pulse` | `POST /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/summary`, `GET /api/v1/learning-pulse/students/:studentId/summary` | `test/learning-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:89`

### GET /api/v1/learning-pulse/summary
- Best context: `| `learning-pulse` | `POST /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/events`, `GET /api/v1/learning-pulse/summary`, `GET /api/v1/learning-pulse/students/:studentId/summary` | `test/learning-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:89`

### POST /api/v1/learning-readiness/snapshots
- Best context: `| `learning-readiness` | `POST /api/v1/learning-readiness/snapshots`, `POST /api/v1/learning-readiness/snapshots/:snapshotId/actions`, `GET /api/v1/learning-readiness/summary` | `test/learning-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:103`

### POST /api/v1/learning-readiness/snapshots/:snapshotId/actions
- Best context: `| `learning-readiness` | `POST /api/v1/learning-readiness/snapshots`, `POST /api/v1/learning-readiness/snapshots/:snapshotId/actions`, `GET /api/v1/learning-readiness/summary` | `test/learning-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:103`

### GET /api/v1/learning-readiness/summary
- Best context: `| `learning-readiness` | `POST /api/v1/learning-readiness/snapshots`, `POST /api/v1/learning-readiness/snapshots/:snapshotId/actions`, `GET /api/v1/learning-readiness/summary` | `test/learning-readiness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:103`

### POST /api/v1/learning-record/evidence
- Best context: `| `learning-record` | `POST /api/v1/learning-record/evidence`, `POST /api/v1/learning-record/mastery/compute` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:31`

### POST /api/v1/learning-record/mastery/compute
- Best context: `| `learning-record` | `POST /api/v1/learning-record/evidence`, `POST /api/v1/learning-record/mastery/compute` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:31`

### POST /api/v1/learning-recovery-effectiveness/runs
- Best context: `| `learning-recovery-effectiveness` | `POST /api/v1/learning-recovery-effectiveness/runs`, `POST /api/v1/learning-recovery-effectiveness/runs/:recoveryEffectivenessRunId/actions`, `GET /api/v1/learning-recovery-effectiveness/summary` | `test/learning-recovery-effectiveness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:163`

### POST /api/v1/learning-recovery-effectiveness/runs/:recoveryEffectivenessRunId/actions
- Best context: `| `learning-recovery-effectiveness` | `POST /api/v1/learning-recovery-effectiveness/runs`, `POST /api/v1/learning-recovery-effectiveness/runs/:recoveryEffectivenessRunId/actions`, `GET /api/v1/learning-recovery-effectiveness/summary` | `test/learning-recovery-effectiveness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:163`

### GET /api/v1/learning-recovery-effectiveness/summary
- Best context: `| `learning-recovery-effectiveness` | `POST /api/v1/learning-recovery-effectiveness/runs`, `POST /api/v1/learning-recovery-effectiveness/runs/:recoveryEffectivenessRunId/actions`, `GET /api/v1/learning-recovery-effectiveness/summary` | `test/learning-recovery-effectiveness.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:163`

### POST /api/v1/learning-recovery-velocity/runs
- Best context: `| `learning-recovery-velocity` | `POST /api/v1/learning-recovery-velocity/runs`, `POST /api/v1/learning-recovery-velocity/runs/:recoveryVelocityRunId/actions`, `GET /api/v1/learning-recovery-velocity/summary` | `test/learning-recovery-velocity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:153`

### POST /api/v1/learning-recovery-velocity/runs/:recoveryVelocityRunId/actions
- Best context: `| `learning-recovery-velocity` | `POST /api/v1/learning-recovery-velocity/runs`, `POST /api/v1/learning-recovery-velocity/runs/:recoveryVelocityRunId/actions`, `GET /api/v1/learning-recovery-velocity/summary` | `test/learning-recovery-velocity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:153`

### GET /api/v1/learning-recovery-velocity/summary
- Best context: `| `learning-recovery-velocity` | `POST /api/v1/learning-recovery-velocity/runs`, `POST /api/v1/learning-recovery-velocity/runs/:recoveryVelocityRunId/actions`, `GET /api/v1/learning-recovery-velocity/summary` | `test/learning-recovery-velocity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:153`

### POST /api/v1/learning-recovery/cases
- Best context: `| `learning-recovery` | `POST /api/v1/learning-recovery/cases`, `POST /api/v1/learning-recovery/cases/:recoveryCaseId/plans`, `GET /api/v1/learning-recovery/summary` | `test/learning-recovery.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:94`

### POST /api/v1/learning-recovery/cases/:recoveryCaseId/plans
- Best context: `| `learning-recovery` | `POST /api/v1/learning-recovery/cases`, `POST /api/v1/learning-recovery/cases/:recoveryCaseId/plans`, `GET /api/v1/learning-recovery/summary` | `test/learning-recovery.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:94`

### GET /api/v1/learning-recovery/summary
- Best context: `| `learning-recovery` | `POST /api/v1/learning-recovery/cases`, `POST /api/v1/learning-recovery/cases/:recoveryCaseId/plans`, `GET /api/v1/learning-recovery/summary` | `test/learning-recovery.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:94`

### POST /api/v1/learning-resilience/forecasts
- Best context: `| `learning-resilience-forecast` | `POST /api/v1/learning-resilience/forecasts`, `POST /api/v1/learning-resilience/forecasts/:resilienceForecastId/actions`, `GET /api/v1/learning-resilience/summary` | `test/learning-resilience-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:143`

### POST /api/v1/learning-resilience/forecasts/:resilienceForecastId/actions
- Best context: `| `learning-resilience-forecast` | `POST /api/v1/learning-resilience/forecasts`, `POST /api/v1/learning-resilience/forecasts/:resilienceForecastId/actions`, `GET /api/v1/learning-resilience/summary` | `test/learning-resilience-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:143`

### GET /api/v1/learning-resilience/summary
- Best context: `| `learning-resilience-forecast` | `POST /api/v1/learning-resilience/forecasts`, `POST /api/v1/learning-resilience/forecasts/:resilienceForecastId/actions`, `GET /api/v1/learning-resilience/summary` | `test/learning-resilience-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:143`

### POST /api/v1/learning-retention/forecasts
- Best context: `| `learning-retention-forecast` | `POST /api/v1/learning-retention/forecasts`, `POST /api/v1/learning-retention/forecasts/:retentionForecastId/actions`, `GET /api/v1/learning-retention/summary` | `test/learning-retention-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:113`

### POST /api/v1/learning-retention/forecasts/:retentionForecastId/actions
- Best context: `| `learning-retention-forecast` | `POST /api/v1/learning-retention/forecasts`, `POST /api/v1/learning-retention/forecasts/:retentionForecastId/actions`, `GET /api/v1/learning-retention/summary` | `test/learning-retention-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:113`

### GET /api/v1/learning-retention/summary
- Best context: `| `learning-retention-forecast` | `POST /api/v1/learning-retention/forecasts`, `POST /api/v1/learning-retention/forecasts/:retentionForecastId/actions`, `GET /api/v1/learning-retention/summary` | `test/learning-retention-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:113`

### POST /api/v1/learning-stability/snapshots
- Best context: `| `learning-stability` | `POST /api/v1/learning-stability/snapshots`, `POST /api/v1/learning-stability/snapshots/:stabilitySnapshotId/actions`, `GET /api/v1/learning-stability/summary` | `test/learning-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:123`

### POST /api/v1/learning-stability/snapshots/:stabilitySnapshotId/actions
- Best context: `| `learning-stability` | `POST /api/v1/learning-stability/snapshots`, `POST /api/v1/learning-stability/snapshots/:stabilitySnapshotId/actions`, `GET /api/v1/learning-stability/summary` | `test/learning-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:123`

### GET /api/v1/learning-stability/summary
- Best context: `| `learning-stability` | `POST /api/v1/learning-stability/snapshots`, `POST /api/v1/learning-stability/snapshots/:stabilitySnapshotId/actions`, `GET /api/v1/learning-stability/summary` | `test/learning-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:123`

### POST /api/v1/learning-support-capacity-forecast/forecasts
- Best context: `| `learning-support-capacity-forecast` | `POST /api/v1/learning-support-capacity-forecast/forecasts`, `POST /api/v1/learning-support-capacity-forecast/forecasts/:supportCapacityForecastId/actions`, `GET /api/v1/learning-support-capacity-forecast/summary` | `test/learning-support-capacity-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:168`

### POST /api/v1/learning-support-capacity-forecast/forecasts/:supportCapacityForecastId/actions
- Best context: `| `learning-support-capacity-forecast` | `POST /api/v1/learning-support-capacity-forecast/forecasts`, `POST /api/v1/learning-support-capacity-forecast/forecasts/:supportCapacityForecastId/actions`, `GET /api/v1/learning-support-capacity-forecast/summary` | `test/learning-support-capacity-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:168`

### GET /api/v1/learning-support-capacity-forecast/summary
- Best context: `| `learning-support-capacity-forecast` | `POST /api/v1/learning-support-capacity-forecast/forecasts`, `POST /api/v1/learning-support-capacity-forecast/forecasts/:supportCapacityForecastId/actions`, `GET /api/v1/learning-support-capacity-forecast/summary` | `test/learning-support-capacity-forecast.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:168`

### POST /api/v1/learning-support-latency/runs
- Best context: `| `learning-support-latency` | `POST /api/v1/learning-support-latency/runs`, `POST /api/v1/learning-support-latency/runs/:supportLatencyRunId/actions`, `GET /api/v1/learning-support-latency/summary` | `test/learning-support-latency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:158`

### POST /api/v1/learning-support-latency/runs/:supportLatencyRunId/actions
- Best context: `| `learning-support-latency` | `POST /api/v1/learning-support-latency/runs`, `POST /api/v1/learning-support-latency/runs/:supportLatencyRunId/actions`, `GET /api/v1/learning-support-latency/summary` | `test/learning-support-latency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:158`

### GET /api/v1/learning-support-latency/summary
- Best context: `| `learning-support-latency` | `POST /api/v1/learning-support-latency/runs`, `POST /api/v1/learning-support-latency/runs/:supportLatencyRunId/actions`, `GET /api/v1/learning-support-latency/summary` | `test/learning-support-latency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:158`

### POST /api/v1/learning-trajectories
- Best context: `| `learning-trajectory` | `POST /api/v1/learning-trajectories`, `POST /api/v1/learning-trajectories/:trajectoryId/checkpoints`, `GET /api/v1/learning-trajectories/summary` | `test/learning-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:98`

### POST /api/v1/learning-trajectories/:trajectoryId/checkpoints
- Best context: `| `learning-trajectory` | `POST /api/v1/learning-trajectories`, `POST /api/v1/learning-trajectories/:trajectoryId/checkpoints`, `GET /api/v1/learning-trajectories/summary` | `test/learning-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:98`

### GET /api/v1/learning-trajectories/summary
- Best context: `| `learning-trajectory` | `POST /api/v1/learning-trajectories`, `POST /api/v1/learning-trajectories/:trajectoryId/checkpoints`, `GET /api/v1/learning-trajectories/summary` | `test/learning-trajectory.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:98`

### POST /api/v1/learning-transfer/analyses
- Best context: `| `learning-transfer` | `POST /api/v1/learning-transfer/analyses`, `POST /api/v1/learning-transfer/analyses/:transferAnalysisId/actions`, `GET /api/v1/learning-transfer/summary` | `test/learning-transfer.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:128`

### POST /api/v1/learning-transfer/analyses/:transferAnalysisId/actions
- Best context: `| `learning-transfer` | `POST /api/v1/learning-transfer/analyses`, `POST /api/v1/learning-transfer/analyses/:transferAnalysisId/actions`, `GET /api/v1/learning-transfer/summary` | `test/learning-transfer.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:128`

### GET /api/v1/learning-transfer/summary
- Best context: `| `learning-transfer` | `POST /api/v1/learning-transfer/analyses`, `POST /api/v1/learning-transfer/analyses/:transferAnalysisId/actions`, `GET /api/v1/learning-transfer/summary` | `test/learning-transfer.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:128`

### POST /api/v1/lesson-plan-fidelity/checks
- Best context: `| `lesson-plan-fidelity` | `POST /api/v1/lesson-plan-fidelity/checks`, `POST /api/v1/lesson-plan-fidelity/checks/:checkId/actions`, `GET /api/v1/lesson-plan-fidelity/summary` | `test/lesson-plan-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:105`

### POST /api/v1/lesson-plan-fidelity/checks/:checkId/actions
- Best context: `| `lesson-plan-fidelity` | `POST /api/v1/lesson-plan-fidelity/checks`, `POST /api/v1/lesson-plan-fidelity/checks/:checkId/actions`, `GET /api/v1/lesson-plan-fidelity/summary` | `test/lesson-plan-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:105`

### GET /api/v1/lesson-plan-fidelity/summary
- Best context: `| `lesson-plan-fidelity` | `POST /api/v1/lesson-plan-fidelity/checks`, `POST /api/v1/lesson-plan-fidelity/checks/:checkId/actions`, `GET /api/v1/lesson-plan-fidelity/summary` | `test/lesson-plan-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:105`

### POST /api/v1/lesson-plans
- Best context: `| `lms` | `POST /api/v1/lesson-plans`, `POST /api/v1/assignments` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:22`

### POST /api/v1/lesson-plans:draft
- Best context: `| `ai-governance` | `POST /api/v1/ai/runs`, `POST /api/v1/ai/models`, `POST /api/v1/ai/routing-policies`, `POST /api/v1/ai/routing/resolve`, `POST /api/v1/ai/simulation-compliance`, `POST /api/v1/lesson-plans:draft`, `POST /api/v1/question-bank/items:draft` | `test/ai-governance.test.mjs`, `test/ai-routing.test.mjs`, `test/ai-simulation-compliance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-governance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-drafts.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:82`

### GET /api/v1/library/books
- Best context: `| `library` | `GET /api/v1/library/books`, `GET /api/v1/library/reservations` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:72`

### GET /api/v1/library/reservations
- Best context: `| `library` | `GET /api/v1/library/books`, `GET /api/v1/library/reservations` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:72`

### POST /api/v1/market/forecasts
- Best context: `| `market-intelligence` | `POST /api/v1/market/segments`, `POST /api/v1/market/forecasts` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:59`

### POST /api/v1/market/segments
- Best context: `| `market-intelligence` | `POST /api/v1/market/segments`, `POST /api/v1/market/forecasts` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:59`

### POST /api/v1/marketplace/listings
- Best context: `| `ecosystem-marketplace` | `POST /api/v1/marketplace/listings`, `POST /api/v1/marketplace/orders` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:16`

### POST /api/v1/marketplace/orders
- Best context: `| `ecosystem-marketplace` | `POST /api/v1/marketplace/listings`, `POST /api/v1/marketplace/orders` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:16`

### POST /api/v1/mastery/snapshots/compute
- Best context: `| `mastery-engine` | `POST /api/v1/mastery/snapshots/compute`, `GET /api/v1/mastery/students/:studentId/latest` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:32`

### GET /api/v1/mastery/students/:studentId/latest
- Best context: `| `mastery-engine` | `POST /api/v1/mastery/snapshots/compute`, `GET /api/v1/mastery/students/:studentId/latest` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:32`

### POST /api/v1/model-evaluations/suites
- Best context: `| `model-evaluation-lab` | `POST /api/v1/model-evaluations/suites`, `POST /api/v1/model-evaluations/suites/:suiteId/runs` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:71`

### POST /api/v1/model-evaluations/suites/:suiteId/runs
- Best context: `| `model-evaluation-lab` | `POST /api/v1/model-evaluations/suites`, `POST /api/v1/model-evaluations/suites/:suiteId/runs` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:71`

### POST /api/v1/model-exchange/listings
- Best context: `| `secure-model-exchange` | `POST /api/v1/model-exchange/listings`, `POST /api/v1/model-exchange/listings/:listingId/attestations` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:67`

### POST /api/v1/model-exchange/listings/:listingId/attestations
- Best context: `| `secure-model-exchange` | `POST /api/v1/model-exchange/listings`, `POST /api/v1/model-exchange/listings/:listingId/attestations` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:67`

### POST /api/v1/model-forensics/cases
- Best context: `| `model-behavior-forensics` | `POST /api/v1/model-forensics/cases`, `POST /api/v1/model-forensics/cases/:caseId/snapshots` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:93`

### POST /api/v1/model-forensics/cases/:caseId/snapshots
- Best context: `| `model-behavior-forensics` | `POST /api/v1/model-forensics/cases`, `POST /api/v1/model-forensics/cases/:caseId/snapshots` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:93`

### POST /api/v1/model-lineage/chains
- Best context: `| `model-lineage-verification` | `POST /api/v1/model-lineage/chains`, `POST /api/v1/model-lineage/chains/:chainId/links` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:61`

### POST /api/v1/model-lineage/chains/:chainId/links
- Best context: `| `model-lineage-verification` | `POST /api/v1/model-lineage/chains`, `POST /api/v1/model-lineage/chains/:chainId/links` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:61`

### POST /api/v1/model-risk/profiles
- Best context: `| `model-risk-governance` | `POST /api/v1/model-risk/profiles`, `POST /api/v1/model-risk/profiles/:profileId/assessments` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:51`

### POST /api/v1/model-risk/profiles/:profileId/assessments
- Best context: `| `model-risk-governance` | `POST /api/v1/model-risk/profiles`, `POST /api/v1/model-risk/profiles/:profileId/assessments` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:51`

### POST /api/v1/model-usage/attestations
- Best context: `| `model-usage-attestations` | `POST /api/v1/model-usage/attestations`, `POST /api/v1/model-usage/attestations/:attestationId/verifications` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:83`

### POST /api/v1/model-usage/attestations/:attestationId/verifications
- Best context: `| `model-usage-attestations` | `POST /api/v1/model-usage/attestations`, `POST /api/v1/model-usage/attestations/:attestationId/verifications` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:83`

### POST /api/v1/mutual-aid/requests
- Best context: `| `mutual-aid` | `POST /api/v1/mutual-aid/requests`, `POST /api/v1/mutual-aid/requests/:requestId/offers` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:40`

### POST /api/v1/mutual-aid/requests/:requestId/offers
- Best context: `| `mutual-aid` | `POST /api/v1/mutual-aid/requests`, `POST /api/v1/mutual-aid/requests/:requestId/offers` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:40`

### POST /api/v1/notices
- Best context: `| `communication` | `POST /api/v1/notices`, `POST /api/v1/inbox/:deliveryId/read` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:27`

### UNSPECIFIED /api/v1/onboarding/tenants
- Best context: `- `/api/v1/onboarding/tenants` now requires a platform-root owner session (bearer token) and is rejected otherwise.`
- Reference: `docs\runbooks\owner-panel-dashboard.md:132`
- Other refs: 2

### POST /api/v1/onboarding/tenants
- Best context: `| `onboarding` | `POST /api/v1/onboarding/tenants`, `GET /api/v1/onboarding/tenants/:tenantId` | `test/onboarding.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:15`

### GET /api/v1/onboarding/tenants/:tenantId
- Best context: `| `onboarding` | `POST /api/v1/onboarding/tenants`, `GET /api/v1/onboarding/tenants/:tenantId` | `test/onboarding.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:15`

### POST /api/v1/operator-briefings
- Best context: `| `operator-briefings` | `POST /api/v1/operator-briefings`, `GET /api/v1/operator-briefings/:briefingId` | `test/operator-briefing.test.mjs`, `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:45`

### GET /api/v1/operator-briefings/:briefingId
- Best context: `| `operator-briefings` | `POST /api/v1/operator-briefings`, `GET /api/v1/operator-briefings/:briefingId` | `test/operator-briefing.test.mjs`, `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-extended.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:45`

### GET /api/v1/outcome-ledger/entries
- Best context: `| `learning-ledger` | `POST /api/v1/outcome-ledger/entries`, `GET /api/v1/outcome-ledger/entries` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:36`

### POST /api/v1/outcome-ledger/entries
- Best context: `| `learning-ledger` | `POST /api/v1/outcome-ledger/entries`, `GET /api/v1/outcome-ledger/entries` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:36`

### POST /api/v1/outcome-verifications
- Best context: `| `outcome-verification` | `POST /api/v1/outcome-verifications`, `POST /api/v1/outcome-verifications/:verificationId/decide` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:37`

### POST /api/v1/outcome-verifications/:verificationId/decide
- Best context: `| `outcome-verification` | `POST /api/v1/outcome-verifications`, `POST /api/v1/outcome-verifications/:verificationId/decide` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:37`

### POST /api/v1/pathways
- Best context: `| `pathways-intelligence` | `POST /api/v1/pathways`, `GET /api/v1/pathways/:pathwayId/insights` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:60`

### GET /api/v1/pathways/:pathwayId/insights
- Best context: `| `pathways-intelligence` | `POST /api/v1/pathways`, `GET /api/v1/pathways/:pathwayId/insights` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:60`

### GET /api/v1/payroll/plans
- Best context: `| `hr-payroll` | `GET /api/v1/payroll/plans`, `GET /api/v1/staff-attendance/records` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:76`

### POST /api/v1/personalization-agency-preservation/runs
- Best context: `| `personalization-agency-preservation` | `POST /api/v1/personalization-agency-preservation/runs`, `POST /api/v1/personalization-agency-preservation/runs/:agencyPreservationRunId/actions`, `GET /api/v1/personalization-agency-preservation/summary` | `test/personalization-agency-preservation.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:141`

### POST /api/v1/personalization-agency-preservation/runs/:agencyPreservationRunId/actions
- Best context: `| `personalization-agency-preservation` | `POST /api/v1/personalization-agency-preservation/runs`, `POST /api/v1/personalization-agency-preservation/runs/:agencyPreservationRunId/actions`, `GET /api/v1/personalization-agency-preservation/summary` | `test/personalization-agency-preservation.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:141`

### GET /api/v1/personalization-agency-preservation/summary
- Best context: `| `personalization-agency-preservation` | `POST /api/v1/personalization-agency-preservation/runs`, `POST /api/v1/personalization-agency-preservation/runs/:agencyPreservationRunId/actions`, `GET /api/v1/personalization-agency-preservation/summary` | `test/personalization-agency-preservation.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:141`

### POST /api/v1/personalization-consent-fidelity/reviews
- Best context: `| `personalization-consent-fidelity` | `POST /api/v1/personalization-consent-fidelity/reviews`, `POST /api/v1/personalization-consent-fidelity/reviews/:consentFidelityReviewId/actions`, `GET /api/v1/personalization-consent-fidelity/summary` | `test/personalization-consent-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:156`

### POST /api/v1/personalization-consent-fidelity/reviews/:consentFidelityReviewId/actions
- Best context: `| `personalization-consent-fidelity` | `POST /api/v1/personalization-consent-fidelity/reviews`, `POST /api/v1/personalization-consent-fidelity/reviews/:consentFidelityReviewId/actions`, `GET /api/v1/personalization-consent-fidelity/summary` | `test/personalization-consent-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:156`

### GET /api/v1/personalization-consent-fidelity/summary
- Best context: `| `personalization-consent-fidelity` | `POST /api/v1/personalization-consent-fidelity/reviews`, `POST /api/v1/personalization-consent-fidelity/reviews/:consentFidelityReviewId/actions`, `GET /api/v1/personalization-consent-fidelity/summary` | `test/personalization-consent-fidelity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:156`

### POST /api/v1/personalization-context-stability/reviews
- Best context: `| `personalization-context-stability` | `POST /api/v1/personalization-context-stability/reviews`, `POST /api/v1/personalization-context-stability/reviews/:contextStabilityReviewId/actions`, `GET /api/v1/personalization-context-stability/summary` | `test/personalization-context-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:181`

### POST /api/v1/personalization-context-stability/reviews/:contextStabilityReviewId/actions
- Best context: `| `personalization-context-stability` | `POST /api/v1/personalization-context-stability/reviews`, `POST /api/v1/personalization-context-stability/reviews/:contextStabilityReviewId/actions`, `GET /api/v1/personalization-context-stability/summary` | `test/personalization-context-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:181`

### GET /api/v1/personalization-context-stability/summary
- Best context: `| `personalization-context-stability` | `POST /api/v1/personalization-context-stability/reviews`, `POST /api/v1/personalization-context-stability/reviews/:contextStabilityReviewId/actions`, `GET /api/v1/personalization-context-stability/summary` | `test/personalization-context-stability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:181`

### POST /api/v1/personalization-ethics/reviews
- Best context: `| `personalization-ethics` | `POST /api/v1/personalization-ethics/reviews`, `POST /api/v1/personalization-ethics/reviews/:ethicsReviewId/actions`, `GET /api/v1/personalization-ethics/summary` | `test/personalization-ethics.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:126`

### POST /api/v1/personalization-ethics/reviews/:ethicsReviewId/actions
- Best context: `| `personalization-ethics` | `POST /api/v1/personalization-ethics/reviews`, `POST /api/v1/personalization-ethics/reviews/:ethicsReviewId/actions`, `GET /api/v1/personalization-ethics/summary` | `test/personalization-ethics.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:126`

### GET /api/v1/personalization-ethics/summary
- Best context: `| `personalization-ethics` | `POST /api/v1/personalization-ethics/reviews`, `POST /api/v1/personalization-ethics/reviews/:ethicsReviewId/actions`, `GET /api/v1/personalization-ethics/summary` | `test/personalization-ethics.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:126`

### POST /api/v1/personalization-explanation-clarity/reviews
- Best context: `| `personalization-explanation-clarity` | `POST /api/v1/personalization-explanation-clarity/reviews`, `POST /api/v1/personalization-explanation-clarity/reviews/:explanationClarityReviewId/actions`, `GET /api/v1/personalization-explanation-clarity/summary` | `test/personalization-explanation-clarity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:191`

### POST /api/v1/personalization-explanation-clarity/reviews/:explanationClarityReviewId/actions
- Best context: `| `personalization-explanation-clarity` | `POST /api/v1/personalization-explanation-clarity/reviews`, `POST /api/v1/personalization-explanation-clarity/reviews/:explanationClarityReviewId/actions`, `GET /api/v1/personalization-explanation-clarity/summary` | `test/personalization-explanation-clarity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:191`

### GET /api/v1/personalization-explanation-clarity/summary
- Best context: `| `personalization-explanation-clarity` | `POST /api/v1/personalization-explanation-clarity/reviews`, `POST /api/v1/personalization-explanation-clarity/reviews/:explanationClarityReviewId/actions`, `GET /api/v1/personalization-explanation-clarity/summary` | `test/personalization-explanation-clarity.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:191`

### POST /api/v1/personalization-feedback-loop/cycles
- Best context: `| `personalization-feedback-loop` | `POST /api/v1/personalization-feedback-loop/cycles`, `POST /api/v1/personalization-feedback-loop/cycles/:feedbackCycleId/actions`, `GET /api/v1/personalization-feedback-loop/summary` | `test/personalization-feedback-loop.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:131`

### POST /api/v1/personalization-feedback-loop/cycles/:feedbackCycleId/actions
- Best context: `| `personalization-feedback-loop` | `POST /api/v1/personalization-feedback-loop/cycles`, `POST /api/v1/personalization-feedback-loop/cycles/:feedbackCycleId/actions`, `GET /api/v1/personalization-feedback-loop/summary` | `test/personalization-feedback-loop.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:131`

### GET /api/v1/personalization-feedback-loop/summary
- Best context: `| `personalization-feedback-loop` | `POST /api/v1/personalization-feedback-loop/cycles`, `POST /api/v1/personalization-feedback-loop/cycles/:feedbackCycleId/actions`, `GET /api/v1/personalization-feedback-loop/summary` | `test/personalization-feedback-loop.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:131`

### POST /api/v1/personalization-governance/reviews
- Best context: `| `personalization-governance` | `POST /api/v1/personalization-governance/reviews`, `POST /api/v1/personalization-governance/reviews/:governanceReviewId/actions`, `GET /api/v1/personalization-governance/summary` | `test/personalization-governance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:121`

### POST /api/v1/personalization-governance/reviews/:governanceReviewId/actions
- Best context: `| `personalization-governance` | `POST /api/v1/personalization-governance/reviews`, `POST /api/v1/personalization-governance/reviews/:governanceReviewId/actions`, `GET /api/v1/personalization-governance/summary` | `test/personalization-governance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:121`

### GET /api/v1/personalization-governance/summary
- Best context: `| `personalization-governance` | `POST /api/v1/personalization-governance/reviews`, `POST /api/v1/personalization-governance/reviews/:governanceReviewId/actions`, `GET /api/v1/personalization-governance/summary` | `test/personalization-governance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:121`

### POST /api/v1/personalization-human-loop-assurance/reviews
- Best context: `| `personalization-human-loop-assurance` | `POST /api/v1/personalization-human-loop-assurance/reviews`, `POST /api/v1/personalization-human-loop-assurance/reviews/:humanLoopReviewId/actions`, `GET /api/v1/personalization-human-loop-assurance/summary` | `test/personalization-human-loop-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:161`

### POST /api/v1/personalization-human-loop-assurance/reviews/:humanLoopReviewId/actions
- Best context: `| `personalization-human-loop-assurance` | `POST /api/v1/personalization-human-loop-assurance/reviews`, `POST /api/v1/personalization-human-loop-assurance/reviews/:humanLoopReviewId/actions`, `GET /api/v1/personalization-human-loop-assurance/summary` | `test/personalization-human-loop-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:161`

### GET /api/v1/personalization-human-loop-assurance/summary
- Best context: `| `personalization-human-loop-assurance` | `POST /api/v1/personalization-human-loop-assurance/reviews`, `POST /api/v1/personalization-human-loop-assurance/reviews/:humanLoopReviewId/actions`, `GET /api/v1/personalization-human-loop-assurance/summary` | `test/personalization-human-loop-assurance.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:161`

### POST /api/v1/personalization-impact-explainability/reviews
- Best context: `| `personalization-impact-explainability` | `POST /api/v1/personalization-impact-explainability/reviews`, `POST /api/v1/personalization-impact-explainability/reviews/:impactExplainabilityReviewId/actions`, `GET /api/v1/personalization-impact-explainability/summary` | `test/personalization-impact-explainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:171`

### POST /api/v1/personalization-impact-explainability/reviews/:impactExplainabilityReviewId/actions
- Best context: `| `personalization-impact-explainability` | `POST /api/v1/personalization-impact-explainability/reviews`, `POST /api/v1/personalization-impact-explainability/reviews/:impactExplainabilityReviewId/actions`, `GET /api/v1/personalization-impact-explainability/summary` | `test/personalization-impact-explainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:171`

### GET /api/v1/personalization-impact-explainability/summary
- Best context: `| `personalization-impact-explainability` | `POST /api/v1/personalization-impact-explainability/reviews`, `POST /api/v1/personalization-impact-explainability/reviews/:impactExplainabilityReviewId/actions`, `GET /api/v1/personalization-impact-explainability/summary` | `test/personalization-impact-explainability.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:171`

### POST /api/v1/personalization-impact/studies
- Best context: `| `personalization-impact` | `POST /api/v1/personalization-impact/studies`, `POST /api/v1/personalization-impact/studies/:personalizationImpactId/actions`, `GET /api/v1/personalization-impact/summary` | `test/personalization-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:116`

### POST /api/v1/personalization-impact/studies/:personalizationImpactId/actions
- Best context: `| `personalization-impact` | `POST /api/v1/personalization-impact/studies`, `POST /api/v1/personalization-impact/studies/:personalizationImpactId/actions`, `GET /api/v1/personalization-impact/summary` | `test/personalization-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:116`

### GET /api/v1/personalization-impact/summary
- Best context: `| `personalization-impact` | `POST /api/v1/personalization-impact/studies`, `POST /api/v1/personalization-impact/studies/:personalizationImpactId/actions`, `GET /api/v1/personalization-impact/summary` | `test/personalization-impact.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:116`

### POST /api/v1/personalization-intent-alignment/reviews
- Best context: `| `personalization-intent-alignment` | `POST /api/v1/personalization-intent-alignment/reviews`, `POST /api/v1/personalization-intent-alignment/reviews/:intentAlignmentReviewId/actions`, `GET /api/v1/personalization-intent-alignment/summary` | `test/personalization-intent-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:166`

### POST /api/v1/personalization-intent-alignment/reviews/:intentAlignmentReviewId/actions
- Best context: `| `personalization-intent-alignment` | `POST /api/v1/personalization-intent-alignment/reviews`, `POST /api/v1/personalization-intent-alignment/reviews/:intentAlignmentReviewId/actions`, `GET /api/v1/personalization-intent-alignment/summary` | `test/personalization-intent-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:166`

### GET /api/v1/personalization-intent-alignment/summary
- Best context: `| `personalization-intent-alignment` | `POST /api/v1/personalization-intent-alignment/reviews`, `POST /api/v1/personalization-intent-alignment/reviews/:intentAlignmentReviewId/actions`, `GET /api/v1/personalization-intent-alignment/summary` | `test/personalization-intent-alignment.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:166`

### POST /api/v1/personalization-intervention-handoff/cycles
- Best context: `| `personalization-intervention-handoff` | `POST /api/v1/personalization-intervention-handoff/cycles`, `POST /api/v1/personalization-intervention-handoff/cycles/:handoffCycleId/actions`, `GET /api/v1/personalization-intervention-handoff/summary` | `test/personalization-intervention-handoff.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:151`

### POST /api/v1/personalization-intervention-handoff/cycles/:handoffCycleId/actions
- Best context: `| `personalization-intervention-handoff` | `POST /api/v1/personalization-intervention-handoff/cycles`, `POST /api/v1/personalization-intervention-handoff/cycles/:handoffCycleId/actions`, `GET /api/v1/personalization-intervention-handoff/summary` | `test/personalization-intervention-handoff.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:151`

### GET /api/v1/personalization-intervention-handoff/summary
- Best context: `| `personalization-intervention-handoff` | `POST /api/v1/personalization-intervention-handoff/cycles`, `POST /api/v1/personalization-intervention-handoff/cycles/:handoffCycleId/actions`, `GET /api/v1/personalization-intervention-handoff/summary` | `test/personalization-intervention-handoff.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:151`

### POST /api/v1/personalization-overfit-guard/reviews
- Best context: `| `personalization-overfit-guard` | `POST /api/v1/personalization-overfit-guard/reviews`, `POST /api/v1/personalization-overfit-guard/reviews/:overfitReviewId/actions`, `GET /api/v1/personalization-overfit-guard/summary` | `test/personalization-overfit-guard.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:176`

### POST /api/v1/personalization-overfit-guard/reviews/:overfitReviewId/actions
- Best context: `| `personalization-overfit-guard` | `POST /api/v1/personalization-overfit-guard/reviews`, `POST /api/v1/personalization-overfit-guard/reviews/:overfitReviewId/actions`, `GET /api/v1/personalization-overfit-guard/summary` | `test/personalization-overfit-guard.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:176`

### GET /api/v1/personalization-overfit-guard/summary
- Best context: `| `personalization-overfit-guard` | `POST /api/v1/personalization-overfit-guard/reviews`, `POST /api/v1/personalization-overfit-guard/reviews/:overfitReviewId/actions`, `GET /api/v1/personalization-overfit-guard/summary` | `test/personalization-overfit-guard.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:176`

### POST /api/v1/personalization-rationale-accuracy/reviews
- Best context: `| `personalization-rationale-accuracy` | `POST /api/v1/personalization-rationale-accuracy/reviews`, `POST /api/v1/personalization-rationale-accuracy/reviews/:rationaleAccuracyReviewId/actions`, `GET /api/v1/personalization-rationale-accuracy/summary` | `test/personalization-rationale-accuracy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:201`

### POST /api/v1/personalization-rationale-accuracy/reviews/:rationaleAccuracyReviewId/actions
- Best context: `| `personalization-rationale-accuracy` | `POST /api/v1/personalization-rationale-accuracy/reviews`, `POST /api/v1/personalization-rationale-accuracy/reviews/:rationaleAccuracyReviewId/actions`, `GET /api/v1/personalization-rationale-accuracy/summary` | `test/personalization-rationale-accuracy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:201`

### GET /api/v1/personalization-rationale-accuracy/summary
- Best context: `| `personalization-rationale-accuracy` | `POST /api/v1/personalization-rationale-accuracy/reviews`, `POST /api/v1/personalization-rationale-accuracy/reviews/:rationaleAccuracyReviewId/actions`, `GET /api/v1/personalization-rationale-accuracy/summary` | `test/personalization-rationale-accuracy.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:201`

### POST /api/v1/personalization-rationale-lineage/reviews
- Best context: `| `personalization-rationale-lineage` | `POST /api/v1/personalization-rationale-lineage/reviews`, `POST /api/v1/personalization-rationale-lineage/reviews/:rationaleLineageReviewId/actions`, `GET /api/v1/personalization-rationale-lineage/summary` | `test/personalization-rationale-lineage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:211`

### POST /api/v1/personalization-rationale-lineage/reviews/:rationaleLineageReviewId/actions
- Best context: `| `personalization-rationale-lineage` | `POST /api/v1/personalization-rationale-lineage/reviews`, `POST /api/v1/personalization-rationale-lineage/reviews/:rationaleLineageReviewId/actions`, `GET /api/v1/personalization-rationale-lineage/summary` | `test/personalization-rationale-lineage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:211`

### GET /api/v1/personalization-rationale-lineage/summary
- Best context: `| `personalization-rationale-lineage` | `POST /api/v1/personalization-rationale-lineage/reviews`, `POST /api/v1/personalization-rationale-lineage/reviews/:rationaleLineageReviewId/actions`, `GET /api/v1/personalization-rationale-lineage/summary` | `test/personalization-rationale-lineage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:211`

### POST /api/v1/personalization-transparency/reviews
- Best context: `| `personalization-transparency` | `POST /api/v1/personalization-transparency/reviews`, `POST /api/v1/personalization-transparency/reviews/:transparencyReviewId/actions`, `GET /api/v1/personalization-transparency/summary` | `test/personalization-transparency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:146`

### POST /api/v1/personalization-transparency/reviews/:transparencyReviewId/actions
- Best context: `| `personalization-transparency` | `POST /api/v1/personalization-transparency/reviews`, `POST /api/v1/personalization-transparency/reviews/:transparencyReviewId/actions`, `GET /api/v1/personalization-transparency/summary` | `test/personalization-transparency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:146`

### GET /api/v1/personalization-transparency/summary
- Best context: `| `personalization-transparency` | `POST /api/v1/personalization-transparency/reviews`, `POST /api/v1/personalization-transparency/reviews/:transparencyReviewId/actions`, `GET /api/v1/personalization-transparency/summary` | `test/personalization-transparency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:146`

### POST /api/v1/personalization-trust-signal/snapshots
- Best context: `| `personalization-trust-signal` | `POST /api/v1/personalization-trust-signal/snapshots`, `POST /api/v1/personalization-trust-signal/snapshots/:trustSignalSnapshotId/actions`, `GET /api/v1/personalization-trust-signal/summary` | `test/personalization-trust-signal.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:136`

### POST /api/v1/personalization-trust-signal/snapshots/:trustSignalSnapshotId/actions
- Best context: `| `personalization-trust-signal` | `POST /api/v1/personalization-trust-signal/snapshots`, `POST /api/v1/personalization-trust-signal/snapshots/:trustSignalSnapshotId/actions`, `GET /api/v1/personalization-trust-signal/summary` | `test/personalization-trust-signal.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:136`

### GET /api/v1/personalization-trust-signal/summary
- Best context: `| `personalization-trust-signal` | `POST /api/v1/personalization-trust-signal/snapshots`, `POST /api/v1/personalization-trust-signal/snapshots/:trustSignalSnapshotId/actions`, `GET /api/v1/personalization-trust-signal/summary` | `test/personalization-trust-signal.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:136`

### POST /api/v1/personalization-uptake/snapshots
- Best context: `| `personalization-uptake` | `POST /api/v1/personalization-uptake/snapshots`, `POST /api/v1/personalization-uptake/snapshots/:uptakeSnapshotId/actions`, `GET /api/v1/personalization-uptake/summary` | `test/personalization-uptake.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:111`

### POST /api/v1/personalization-uptake/snapshots/:uptakeSnapshotId/actions
- Best context: `| `personalization-uptake` | `POST /api/v1/personalization-uptake/snapshots`, `POST /api/v1/personalization-uptake/snapshots/:uptakeSnapshotId/actions`, `GET /api/v1/personalization-uptake/summary` | `test/personalization-uptake.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:111`

### GET /api/v1/personalization-uptake/summary
- Best context: `| `personalization-uptake` | `POST /api/v1/personalization-uptake/snapshots`, `POST /api/v1/personalization-uptake/snapshots/:uptakeSnapshotId/actions`, `GET /api/v1/personalization-uptake/summary` | `test/personalization-uptake.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:111`

### UNSPECIFIED /api/v1/plans?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/plans?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7081`

### GET /api/v1/platform/data-integrity/report?tenant_id=...
- Best context: `7. Run `GET /api/v1/platform/data-integrity/report?tenant_id=...` and clear any remaining auto-repairable scope issues before go-live.`
- Reference: `docs\runbooks\deployment.md:75`

### UNSPECIFIED /api/v1/platform/manifest
- Best context: `api('/api/v1/platform/manifest'),`
- Reference: `services\portal-service\assets\portal-owner.js:3330`
- Other refs: 1

### UNSPECIFIED /api/v1/platform/runtime
- Best context: `6. Verify `/healthz`, `/readyz`, and `/api/v1/platform/runtime` after the first deploy.`
- Reference: `docs\runbooks\deployment.md:56`

### GET /api/v1/platform/runtime
- Best context: `6. Check `GET /api/v1/platform/runtime` for the effective guardrail configuration.`
- Reference: `docs\runbooks\deployment.md:74`

### GET /api/v1/playbook-runs/:playbookRunId
- Best context: `| `playbooks` | `POST /api/v1/playbooks`, `POST /api/v1/playbooks/:playbookId/runs`, `GET /api/v1/playbook-runs/:playbookRunId`, `POST /api/v1/playbooks/integration-drift:run` | `test/playbook-orchestration.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:40`

### POST /api/v1/playbooks
- Best context: `| `playbooks` | `POST /api/v1/playbooks`, `POST /api/v1/playbooks/:playbookId/runs`, `GET /api/v1/playbook-runs/:playbookRunId`, `POST /api/v1/playbooks/integration-drift:run` | `test/playbook-orchestration.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:40`

### POST /api/v1/playbooks/:playbookId/runs
- Best context: `| `playbooks` | `POST /api/v1/playbooks`, `POST /api/v1/playbooks/:playbookId/runs`, `GET /api/v1/playbook-runs/:playbookRunId`, `POST /api/v1/playbooks/integration-drift:run` | `test/playbook-orchestration.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:40`

### POST /api/v1/playbooks/integration-drift:run
- Best context: `| `playbooks` | `POST /api/v1/playbooks`, `POST /api/v1/playbooks/:playbookId/runs`, `GET /api/v1/playbook-runs/:playbookRunId`, `POST /api/v1/playbooks/integration-drift:run` | `test/playbook-orchestration.test.mjs`, `test/enterprise-hardening.test.mjs`, `test/enterprise-downgrade-sequencing.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:40`
- Other refs: 1

### POST /api/v1/playbooks/seed/integration-drift
- Best context: `3. Seed and execute a drift response playbook via `POST /api/v1/playbooks/seed/integration-drift` and `POST /api/v1/playbooks/integration-drift:run`.`
- Reference: `docs\runbooks\deployment.md:81`

### POST /api/v1/policies
- Best context: `| `governance` | `POST /api/v1/policies`, `GET /api/v1/audit/events` | `test/platform-kernel.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:14`

### POST /api/v1/policy-attestations
- Best context: `| `policy-attestations` | `POST /api/v1/policy-attestations`, `POST /api/v1/policy-attestations/:attestationId/void` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:31`

### POST /api/v1/policy-attestations/:attestationId/void
- Best context: `| `policy-attestations` | `POST /api/v1/policy-attestations`, `POST /api/v1/policy-attestations/:attestationId/void` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:31`

### POST /api/v1/policy-compiler/policies
- Best context: `| `policy-compiler` | `POST /api/v1/policy-compiler/policies`, `POST /api/v1/policy-compiler/policies/:policyId/compile` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:66`

### POST /api/v1/policy-compiler/policies/:policyId/compile
- Best context: `| `policy-compiler` | `POST /api/v1/policy-compiler/policies`, `POST /api/v1/policy-compiler/policies/:policyId/compile` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:66`

### POST /api/v1/policy-drift/detectors
- Best context: `| `policy-drift-detector` | `POST /api/v1/policy-drift/detectors`, `POST /api/v1/policy-drift/detectors/:detectorId/alerts` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:78`

### POST /api/v1/policy-drift/detectors/:detectorId/alerts
- Best context: `| `policy-drift-detector` | `POST /api/v1/policy-drift/detectors`, `POST /api/v1/policy-drift/detectors/:detectorId/alerts` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:78`

### POST /api/v1/policy-exceptions
- Best context: `| `policy-exception-review` | `POST /api/v1/policy-exceptions`, `POST /api/v1/policy-exceptions/:exceptionId/reviews` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:106`

### POST /api/v1/policy-exceptions/:exceptionId/reviews
- Best context: `| `policy-exception-review` | `POST /api/v1/policy-exceptions`, `POST /api/v1/policy-exceptions/:exceptionId/reviews` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:106`

### POST /api/v1/policy-lab/simulations
- Best context: `| `policy-simulation-lab` | `POST /api/v1/policy-lab/simulations`, `POST /api/v1/policy-lab/simulations/:simulationId/runs` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:43`

### POST /api/v1/policy-lab/simulations/:simulationId/runs
- Best context: `| `policy-simulation-lab` | `POST /api/v1/policy-lab/simulations`, `POST /api/v1/policy-lab/simulations/:simulationId/runs` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:43`

### POST /api/v1/portfolio-benchmarks
- Best context: `| `portfolio-benchmarking` | `POST /api/v1/portfolio-benchmarks`, `POST /api/v1/portfolio-benchmarks/:benchmarkId/insights` | `test/portfolio-benchmarking.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:47`

### POST /api/v1/portfolio-benchmarks/:benchmarkId/insights
- Best context: `| `portfolio-benchmarking` | `POST /api/v1/portfolio-benchmarks`, `POST /api/v1/portfolio-benchmarks/:benchmarkId/insights` | `test/portfolio-benchmarking.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:47`

### GET /api/v1/portfolio/scenarios
- Best context: `| `portfolio-intelligence` | `GET /api/v1/portfolio/scenarios`, `POST /api/v1/portfolio/scenarios` | `test/portfolio-intelligence.test.mjs`, `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:46`

### POST /api/v1/portfolio/scenarios
- Best context: `| `portfolio-intelligence` | `GET /api/v1/portfolio/scenarios`, `POST /api/v1/portfolio/scenarios` | `test/portfolio-intelligence.test.mjs`, `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:46`

### UNSPECIFIED /api/v1/principals
- Best context: `- `/api/v1/principals``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:96`
- Other refs: 3

### POST /api/v1/principals
- Best context: `| `core-platform` | `POST /api/v1/tenants`, `POST /api/v1/principals` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:13`
- Other refs: 2

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(authState.principal_id)}/access-scopes?tenant_id=${encodeURIComponent(authState.tenant_id)}
- Best context: ``/api/v1/principals/${encodeURIComponent(authState.principal_id)}/access-scopes?tenant_id=${encodeURIComponent(authState.tenant_id)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:9406`
- Other refs: 1

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(createdPrincipal.principal_id)}/roles/${encodeURIComponent(roleId)}
- Best context: ``/api/v1/principals/${encodeURIComponent(createdPrincipal.principal_id)}/roles/${encodeURIComponent(roleId)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:8622`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(ensureWorkspaceValue(workspace.principal_id,
- Best context: ``/api/v1/principals/${encodeURIComponent(ensureWorkspaceValue(workspace.principal_id, 'Principal ID'))}/tasks?${params.toString()}``
- Reference: `services\portal-service\assets\portal-owner.js:9789`
- Other refs: 1

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principal.principal_id)}
- Best context: ``/api/v1/principals/${encodeURIComponent(principal.principal_id)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:4451`
- Other refs: 1

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principal.principal_id)}/password:reset
- Best context: ``/api/v1/principals/${encodeURIComponent(principal.principal_id)}/password:reset`,`
- Reference: `services\portal-service\assets\portal-owner.js:8852`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principal.principal_id)}/roles/${encodeURIComponent(role.role_id)}
- Best context: ``/api/v1/principals/${encodeURIComponent(principal.principal_id)}/roles/${encodeURIComponent(role.role_id)}`,`
- Reference: `services\portal-service\assets\portal.js:3273`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principalId)}/access-scopes?tenant_id=${encodeURIComponent(safeTenantId)}
- Best context: `api(`/api/v1/principals/${encodeURIComponent(principalId)}/access-scopes?tenant_id=${encodeURIComponent(safeTenantId)}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:5279`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principalId)}/roles/${encodeURIComponent(role.role_id)}
- Best context: ``/api/v1/principals/${encodeURIComponent(principalId)}/roles/${encodeURIComponent(role.role_id)}`,`
- Reference: `services\portal-service\assets\portal.js:3223`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principalId)}/roles/${encodeURIComponent(role.role_id)}/revoke
- Best context: ``/api/v1/principals/${encodeURIComponent(principalId)}/roles/${encodeURIComponent(role.role_id)}/revoke`,`
- Reference: `services\portal-service\assets\portal.js:3305`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principalId)}/roles?tenant_id=${encodeURIComponent(safeTenantId)}
- Best context: `api(`/api/v1/principals/${encodeURIComponent(principalId)}/roles?tenant_id=${encodeURIComponent(safeTenantId)}`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:5278`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(principalId)}/sessions
- Best context: `api(`/api/v1/principals/${encodeURIComponent(principalId)}/sessions`).catch(() => ({ items: [] }))`
- Reference: `services\portal-service\assets\portal-owner.js:5280`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedOwner.principal_id)}/owner-lifecycle
- Best context: ``/api/v1/principals/${encodeURIComponent(selectedOwner.principal_id)}/owner-lifecycle`,`
- Reference: `services\portal-service\assets\portal-owner.js:8435`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}
- Best context: ``/api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:8910`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/password:reset
- Best context: ``/api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/password:reset`,`
- Reference: `services\portal-service\assets\portal-owner.js:8945`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/roles/${encodeURIComponent(String(formData.get(
- Best context: ``/api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/roles/${encodeURIComponent(String(formData.get('role_id') || '').trim())}`,`
- Reference: `services\portal-service\assets\portal-owner.js:8989`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/roles/${encodeURIComponent(role.role_id)}/revoke
- Best context: ``/api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/roles/${encodeURIComponent(role.role_id)}/revoke`,`
- Reference: `services\portal-service\assets\portal-owner.js:9050`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/sessions/revoke-all
- Best context: `: `/api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/sessions/revoke-all`;`
- Reference: `services\portal-service\assets\portal-owner.js:9132`

### UNSPECIFIED /api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/sessions/revoke-others
- Best context: `? `/api/v1/principals/${encodeURIComponent(selectedPrincipal.principal_id)}/sessions/revoke-others``
- Reference: `services\portal-service\assets\portal-owner.js:9131`

### PATCH /api/v1/principals/:principalId
- Best context: ``PATCH /api/v1/principals/:principalId` is now blocked when suspending or deactivating a principal would remove the last active tenant-scoped `company_admin`.`
- Reference: `docs\runbooks\owner-admin-continuity.md:97`
- Other refs: 4

### GET /api/v1/principals/:principalId/access-scopes
- Best context: `6. The portal fetches `GET /api/v1/principals/:principalId/access-scopes`.`
- Reference: `docs\runbooks\portal-auth-shell.md:63`

### GET /api/v1/principals/:principalId/children
- Best context: `| `parent-visibility` | `POST /api/v1/guardian-links`, `GET /api/v1/principals/:principalId/children` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:26`

### POST /api/v1/principals/:principalId/owner-lifecycle
- Best context: `- `POST /api/v1/principals/:principalId/owner-lifecycle``
- Reference: `docs\runbooks\owner-system-implementation-phases.md:434`

### POST /api/v1/principals/:principalId/owner-login:unlock
- Best context: `- `POST /api/v1/principals/:principalId/owner-login:unlock``
- Reference: `docs\runbooks\owner-login-strict.md:120`
- Other refs: 1

### POST /api/v1/principals/:principalId/password:reset
- Best context: ``POST /api/v1/principals/:principalId/password:reset` returns `409 RESOURCE_CONFLICT` when the target principal is an explicit owner.`
- Reference: `docs\runbooks\owner-identity-governance.md:69`
- Other refs: 2

### UNSPECIFIED /api/v1/principals/:principalId/roles/:roleId
- Best context: `- `/api/v1/principals/:principalId/roles/:roleId``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:97`

### POST /api/v1/principals/:principalId/roles/:roleId
- Best context: ``POST /api/v1/principals/:principalId/roles/:roleId` returns `409 RESOURCE_CONFLICT` when the target principal is an explicit owner.`
- Reference: `docs\runbooks\owner-identity-governance.md:77`
- Other refs: 1

### UNSPECIFIED /api/v1/principals/:principalId/roles/:roleId/revoke
- Best context: `- `/api/v1/principals/:principalId/roles/:roleId/revoke``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:100`

### POST /api/v1/principals/:principalId/roles/:roleId/revoke
- Best context: ``POST /api/v1/principals/:principalId/roles/:roleId/revoke` is now blocked when revoking a tenant-scoped `company_admin` assignment would:`
- Reference: `docs\runbooks\owner-admin-continuity.md:86`
- Other refs: 3

### GET /api/v1/principals/:principalId/sessions
- Best context: `- `GET /api/v1/principals/:principalId/sessions``
- Reference: `docs\runbooks\owner-session-governance.md:30`

### POST /api/v1/principals/:principalId/sessions/revoke-all
- Best context: `- `POST /api/v1/principals/:principalId/sessions/revoke-all``
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:57`
- Other refs: 1

### POST /api/v1/principals/:principalId/sessions/revoke-others
- Best context: `- `POST /api/v1/principals/:principalId/sessions/revoke-others``
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:58`
- Other refs: 1

### UNSPECIFIED /api/v1/principals?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=200
- Best context: `api(`/api/v1/principals?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=200`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7083`
- Other refs: 1

### POST /api/v1/privacy-attacks/simulations
- Best context: `| `privacy-attack-simulation` | `POST /api/v1/privacy-attacks/simulations`, `POST /api/v1/privacy-attacks/simulations/:simulationId/findings` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:64`

### POST /api/v1/privacy-attacks/simulations/:simulationId/findings
- Best context: `| `privacy-attack-simulation` | `POST /api/v1/privacy-attacks/simulations`, `POST /api/v1/privacy-attacks/simulations/:simulationId/findings` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:64`

### POST /api/v1/privacy-budgets
- Best context: `| `privacy-budget` | `POST /api/v1/privacy-budgets`, `POST /api/v1/privacy-budgets/:budgetId/spend` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:48`

### POST /api/v1/privacy-budgets/:budgetId/spend
- Best context: `| `privacy-budget` | `POST /api/v1/privacy-budgets`, `POST /api/v1/privacy-budgets/:budgetId/spend` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:48`

### POST /api/v1/procurement-optimizer/runs
- Best context: `| `procurement-optimizer` | `POST /api/v1/procurement-optimizer/runs`, `POST /api/v1/procurement-optimizer/runs/:runId/optimize` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:62`

### POST /api/v1/procurement-optimizer/runs/:runId/optimize
- Best context: `| `procurement-optimizer` | `POST /api/v1/procurement-optimizer/runs`, `POST /api/v1/procurement-optimizer/runs/:runId/optimize` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:62`

### GET /api/v1/procurement/requisitions
- Best context: `| `procurement` | `GET /api/v1/vendors`, `GET /api/v1/procurement/requisitions` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:71`

### UNSPECIFIED /api/v1/public/tenants/${encodeURIComponent(tenantCode)}/schools/${encodeURIComponent(schoolCode)}/login-context
- Best context: ``/api/v1/public/tenants/${encodeURIComponent(tenantCode)}/schools/${encodeURIComponent(schoolCode)}/login-context``
- Reference: `services\portal-service\assets\school-login.js:164`

### UNSPECIFIED /api/v1/public/tenants/:tenantCode/schools/:schoolCode/login-context
- Best context: `- `/api/v1/public/tenants/:tenantCode/schools/:schoolCode/login-context``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:52`

### POST /api/v1/question-bank/items
- Best context: `| `question-bank` | `POST /api/v1/question-bank/items`, `GET /api/v1/question-bank/items/:questionItemId` | `test/assessment-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:24`

### GET /api/v1/question-bank/items/:questionItemId
- Best context: `| `question-bank` | `POST /api/v1/question-bank/items`, `GET /api/v1/question-bank/items/:questionItemId` | `test/assessment-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:24`

### POST /api/v1/question-bank/items:draft
- Best context: `| `ai-governance` | `POST /api/v1/ai/runs`, `POST /api/v1/ai/models`, `POST /api/v1/ai/routing-policies`, `POST /api/v1/ai/routing/resolve`, `POST /api/v1/ai/simulation-compliance`, `POST /api/v1/lesson-plans:draft`, `POST /api/v1/question-bank/items:draft` | `test/ai-governance.test.mjs`, `test/ai-routing.test.mjs`, `test/ai-simulation-compliance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-governance.test.mjs`, `test/enterprise-downgrade-sequencing-ai-drafts.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:82`

### GET /api/v1/realtime/alerts
- Best context: `| `realtime-intelligence` | `POST /api/v1/realtime/streams`, `GET /api/v1/realtime/alerts` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:15`

### POST /api/v1/realtime/streams
- Best context: `| `realtime-intelligence` | `POST /api/v1/realtime/streams`, `GET /api/v1/realtime/alerts` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:15`

### POST /api/v1/record-bridge/requests
- Best context: `| `record-bridge` | `POST /api/v1/record-bridge/requests`, `POST /api/v1/record-bridge/requests/:requestId/approve` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:28`

### POST /api/v1/record-bridge/requests/:requestId/approve
- Best context: `| `record-bridge` | `POST /api/v1/record-bridge/requests`, `POST /api/v1/record-bridge/requests/:requestId/approve` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:28`

### POST /api/v1/registrar/graduation-applications/:applicationId/decide
- Best context: `| `higher-ed-registrar` | `POST /api/v1/registrar/programs`, `POST /api/v1/registrar/registrations`, `POST /api/v1/registrar/graduation-applications/:applicationId/decide` | `test/higher-ed-registrar.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:81`

### POST /api/v1/registrar/programs
- Best context: `| `higher-ed-registrar` | `POST /api/v1/registrar/programs`, `POST /api/v1/registrar/registrations`, `POST /api/v1/registrar/graduation-applications/:applicationId/decide` | `test/higher-ed-registrar.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:81`

### POST /api/v1/registrar/registrations
- Best context: `| `higher-ed-registrar` | `POST /api/v1/registrar/programs`, `POST /api/v1/registrar/registrations`, `POST /api/v1/registrar/graduation-applications/:applicationId/decide` | `test/higher-ed-registrar.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:81`

### POST /api/v1/regulatory-change/scans
- Best context: `| `regulatory-change-impact-lab` | `POST /api/v1/regulatory-change/scans`, `POST /api/v1/regulatory-change/scans/:scanId/impacts` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:98`

### POST /api/v1/regulatory-change/scans/:scanId/impacts
- Best context: `| `regulatory-change-impact-lab` | `POST /api/v1/regulatory-change/scans`, `POST /api/v1/regulatory-change/scans/:scanId/impacts` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:98`

### POST /api/v1/regulatory-intelligence/regulations
- Best context: `| `regulatory-intelligence` | `POST /api/v1/regulatory-intelligence/regulations`, `POST /api/v1/regulatory-intelligence/regulations/:regulationId/impacts` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:56`

### POST /api/v1/regulatory-intelligence/regulations/:regulationId/impacts
- Best context: `| `regulatory-intelligence` | `POST /api/v1/regulatory-intelligence/regulations`, `POST /api/v1/regulatory-intelligence/regulations/:regulationId/impacts` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:56`

### POST /api/v1/regulatory-sandboxes/requests
- Best context: `| `regulatory-sandbox-exchange` | `POST /api/v1/regulatory-sandboxes/requests`, `POST /api/v1/regulatory-sandboxes/requests/:requestId/approvals` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:88`

### POST /api/v1/regulatory-sandboxes/requests/:requestId/approvals
- Best context: `| `regulatory-sandbox-exchange` | `POST /api/v1/regulatory-sandboxes/requests`, `POST /api/v1/regulatory-sandboxes/requests/:requestId/approvals` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:88`

### POST /api/v1/regulatory/filings
- Best context: `| `advanced-regulatory-reporting` | `POST /api/v1/regulatory/filings`, `POST /api/v1/regulatory/filings/:filingId/submit` | `test/advanced-regulatory-reporting.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:79`

### POST /api/v1/regulatory/filings/:filingId/submit
- Best context: `| `advanced-regulatory-reporting` | `POST /api/v1/regulatory/filings`, `POST /api/v1/regulatory/filings/:filingId/submit` | `test/advanced-regulatory-reporting.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:79`

### POST /api/v1/remediation/suggestions/:suggestionId/accept
- Best context: `| `remediation` | `POST /api/v1/remediation/suggestions/generate`, `POST /api/v1/remediation/suggestions/:suggestionId/accept` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:35`

### POST /api/v1/remediation/suggestions/generate
- Best context: `| `remediation` | `POST /api/v1/remediation/suggestions/generate`, `POST /api/v1/remediation/suggestions/:suggestionId/accept` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:35`

### POST /api/v1/report-cards
- Best context: `| `report-cards` | `POST /api/v1/report-cards`, `POST /api/v1/report-cards/:reportCardId/publish` | `test/platform-kernel.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:25`

### POST /api/v1/report-cards/:reportCardId/publish
- Best context: `| `report-cards` | `POST /api/v1/report-cards`, `POST /api/v1/report-cards/:reportCardId/publish` | `test/platform-kernel.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:25`

### UNSPECIFIED /api/v1/report-exports
- Best context: `return api('/api/v1/report-exports', {`
- Reference: `services\portal-service\assets\portal-owner.js:10103`
- Other refs: 1

### GET /api/v1/report-exports
- Best context: `| `reporting` | `GET /api/v1/reports/operator-dashboard`, `GET /api/v1/report-exports` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:78`

### UNSPECIFIED /api/v1/report-exports/${encodeURIComponent(reportExport.export_id)}
- Best context: ``/api/v1/report-exports/${encodeURIComponent(reportExport.export_id)}``
- Reference: `services\portal-service\assets\portal-owner.js:7952`
- Other refs: 1

### UNSPECIFIED /api/v1/report-exports?${exportParams.toString()}
- Best context: `api(`/api/v1/report-exports?${exportParams.toString()}`)`
- Reference: `services\portal-service\assets\portal-owner.js:8045`
- Other refs: 2

### UNSPECIFIED /api/v1/report-exports?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id,
- Best context: ``/api/v1/report-exports?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id, 'Tenant ID'))}``
- Reference: `services\portal-service\assets\portal-owner.js:9839`
- Other refs: 1

### UNSPECIFIED /api/v1/report-schedules
- Best context: `return api('/api/v1/report-schedules', {`
- Reference: `services\portal-service\assets\portal-owner.js:10352`
- Other refs: 1

### UNSPECIFIED /api/v1/report-schedules/${encodeURIComponent(scheduleId)}/run
- Best context: ``/api/v1/report-schedules/${encodeURIComponent(scheduleId)}/run`,`
- Reference: `services\portal-service\assets\portal-owner.js:10401`
- Other refs: 1

### UNSPECIFIED /api/v1/report-schedules/run-due
- Best context: `'/api/v1/report-schedules/run-due',`
- Reference: `services\portal-service\assets\portal-owner.js:10415`
- Other refs: 1

### UNSPECIFIED /api/v1/report-schedules?${scheduleParams.toString()}
- Best context: `api(`/api/v1/report-schedules?${scheduleParams.toString()}`),`
- Reference: `services\portal-service\assets\portal-owner.js:8044`
- Other refs: 2

### UNSPECIFIED /api/v1/report-schedules?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id,
- Best context: ``/api/v1/report-schedules?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id, 'Tenant ID'))}``
- Reference: `services\portal-service\assets\portal-owner.js:9832`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/academic-mis?${params.toString()}
- Best context: `return api(`/api/v1/reports/academic-mis?${params.toString()}`);`
- Reference: `services\portal-service\assets\portal-owner.js:9762`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/campuses/${encodeURIComponent(ensureWorkspaceValue(workspace.campus_id,
- Best context: ``/api/v1/reports/campuses/${encodeURIComponent(ensureWorkspaceValue(workspace.campus_id, 'Campus ID'))}/dashboard?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id, 'Tenant ID'))}``
- Reference: `services\portal-service\assets\portal-owner.js:9730`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/finance-mis?${financeScope.toString()}
- Best context: `api(`/api/v1/reports/finance-mis?${financeScope.toString()}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:8041`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/finance-mis?${params.toString()}
- Best context: `return api(`/api/v1/reports/finance-mis?${params.toString()}`);`
- Reference: `services\portal-service\assets\portal-owner.js:9750`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/finance-mis?tenant_id=${encodeURIComponent(tenantId)}
- Best context: `return api(`/api/v1/reports/finance-mis?tenant_id=${encodeURIComponent(tenantId)}`);`
- Reference: `services\portal-service\assets\portal-owner.js:4400`
- Other refs: 1

### GET /api/v1/reports/operator-dashboard
- Best context: `| `reporting` | `GET /api/v1/reports/operator-dashboard`, `GET /api/v1/report-exports` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:78`

### GET /api/v1/reports/operator-dashboard/trends
- Best context: `| `analytics` | `GET /api/v1/analytics/snapshots`, `GET /api/v1/reports/operator-dashboard/trends` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-ops.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:77`

### UNSPECIFIED /api/v1/reports/operator-dashboard?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id,
- Best context: ``/api/v1/reports/operator-dashboard?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id, 'Tenant ID'))}``
- Reference: `services\portal-service\assets\portal-owner.js:9716`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/operator-dashboard?tenant_id=${encodeURIComponent(focusedTenantId)}
- Best context: `? api(`/api/v1/reports/operator-dashboard?tenant_id=${encodeURIComponent(focusedTenantId)}`).catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:3333`

### UNSPECIFIED /api/v1/reports/operator-dashboard?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `? api(`/api/v1/reports/operator-dashboard?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:7073`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/ops-alerts?${params.toString()}
- Best context: `return api(`/api/v1/reports/ops-alerts?${params.toString()}`);`
- Reference: `services\portal-service\assets\portal-owner.js:9773`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/schools/${encodeURIComponent(ensureWorkspaceValue(workspace.school_id,
- Best context: ``/api/v1/reports/schools/${encodeURIComponent(ensureWorkspaceValue(workspace.school_id, 'School ID'))}/dashboard?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id, 'Tenant ID'))}``
- Reference: `services\portal-service\assets\portal-owner.js:9723`
- Other refs: 1

### UNSPECIFIED /api/v1/reports/schools/${encodeURIComponent(selectedSchoolId)}/dashboard?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `? api(`/api/v1/reports/schools/${encodeURIComponent(selectedSchoolId)}/dashboard?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null)`
- Reference: `services\portal-service\assets\portal-owner.js:7600`
- Other refs: 1

### POST /api/v1/resilience/plans
- Best context: `| `resilience-assurance` | `POST /api/v1/resilience/plans`, `POST /api/v1/resilience/plans/:planId/exercises` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:50`

### POST /api/v1/resilience/plans/:planId/exercises
- Best context: `| `resilience-assurance` | `POST /api/v1/resilience/plans`, `POST /api/v1/resilience/plans/:planId/exercises` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:50`

### POST /api/v1/revocations/lists
- Best context: `| `revocation-network` | `POST /api/v1/revocations/lists`, `POST /api/v1/revocations/lists/:listId/entries` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:35`

### POST /api/v1/revocations/lists/:listId/entries
- Best context: `| `revocation-network` | `POST /api/v1/revocations/lists`, `POST /api/v1/revocations/lists/:listId/entries` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:35`

### POST /api/v1/rights/requests
- Best context: `| `rights-fulfillment` | `POST /api/v1/rights/requests`, `POST /api/v1/rights/requests/:requestId/actions` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:47`

### POST /api/v1/rights/requests/:requestId/actions
- Best context: `| `rights-fulfillment` | `POST /api/v1/rights/requests`, `POST /api/v1/rights/requests/:requestId/actions` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:47`

### POST /api/v1/risk/registers
- Best context: `| `risk-intelligence` | `POST /api/v1/risk/registers`, `GET /api/v1/risk/registers/:registerId/insights` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:63`

### GET /api/v1/risk/registers/:registerId/insights
- Best context: `| `risk-intelligence` | `POST /api/v1/risk/registers`, `GET /api/v1/risk/registers/:registerId/insights` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:63`

### UNSPECIFIED /api/v1/roles
- Best context: `- `/api/v1/roles``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:95`
- Other refs: 1

### POST /api/v1/roles
- Best context: `- `POST /api/v1/roles``
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:53`
- Other refs: 1

### UNSPECIFIED /api/v1/roles/${encodeURIComponent(role.role_id)}/permissions
- Best context: ``/api/v1/roles/${encodeURIComponent(role.role_id)}/permissions`,`
- Reference: `services\portal-service\assets\portal-owner.js:9025`

### POST /api/v1/roles/:roleId/permissions
- Best context: `- `POST /api/v1/roles/:roleId/permissions``
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:54`

### UNSPECIFIED /api/v1/roles?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/roles?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7082`
- Other refs: 1

### POST /api/v1/rubrics
- Best context: `| `rubrics` | `POST /api/v1/rubrics`, `POST /api/v1/rubrics/:rubricId/versions` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:33`

### POST /api/v1/rubrics/:rubricId/versions
- Best context: `| `rubrics` | `POST /api/v1/rubrics`, `POST /api/v1/rubrics/:rubricId/versions` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:33`

### POST /api/v1/safety-command/incidents
- Best context: `| `safety-command` | `POST /api/v1/safety-command/incidents`, `POST /api/v1/safety-command/readiness` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:54`

### POST /api/v1/safety-command/readiness
- Best context: `| `safety-command` | `POST /api/v1/safety-command/incidents`, `POST /api/v1/safety-command/readiness` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:54`

### POST /api/v1/safety-risk/cases
- Best context: `| `student-safety-risk-net` | `POST /api/v1/safety-risk/cases`, `POST /api/v1/safety-risk/cases/:caseId/responses` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:89`

### POST /api/v1/safety-risk/cases/:caseId/responses
- Best context: `| `student-safety-risk-net` | `POST /api/v1/safety-risk/cases`, `POST /api/v1/safety-risk/cases/:caseId/responses` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:89`

### POST /api/v1/safety-triage/cases
- Best context: `| `student-safety-ai-triage` | `POST /api/v1/safety-triage/cases`, `POST /api/v1/safety-triage/cases/:caseId/recommendations` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:99`

### POST /api/v1/safety-triage/cases/:caseId/recommendations
- Best context: `| `student-safety-ai-triage` | `POST /api/v1/safety-triage/cases`, `POST /api/v1/safety-triage/cases/:caseId/recommendations` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:99`

### GET /api/v1/safety/drills
- Best context: `| `safety-health` | `GET /api/v1/safety/drills`, `GET /api/v1/clinic/visits` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:75`

### UNSPECIFIED /api/v1/school-launch/checklists
- Best context: `'/api/v1/school-launch/checklists',`
- Reference: `services\portal-service\assets\portal-owner.js:8316`

### UNSPECIFIED /api/v1/school-launch/portfolio?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/school-launch/portfolio?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:7076`

### UNSPECIFIED /api/v1/schools
- Action: Create School
- Best context: `const data = await runAction('Create School', () => api('/api/v1/schools', {`
- Reference: `services\portal-service\assets\portal-owner.js:9887`
- Other refs: 1

### POST /api/v1/schools
- Best context: `| `institution-structure` | `POST /api/v1/schools`, `POST /api/v1/campuses` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:16`
- Other refs: 1

### UNSPECIFIED /api/v1/schools/${encodeURIComponent(ensureWorkspaceValue(workspace.school_id,
- Best context: ``/api/v1/schools/${encodeURIComponent(ensureWorkspaceValue(workspace.school_id, 'School ID'))}/plan:assign`,`
- Reference: `services\portal-service\assets\portal-owner.js:9941`
- Other refs: 3

### UNSPECIFIED /api/v1/schools/${encodeURIComponent(selectedSchoolId)}/launch-checklists?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=20
- Best context: `? api(`/api/v1/schools/${encodeURIComponent(selectedSchoolId)}/launch-checklists?tenant_id=${encodeURIComponent(workspace.tenant_id)}&limit=20`).catch(() => ({ items: [] }))`
- Reference: `services\portal-service\assets\portal-owner.js:7089`

### UNSPECIFIED /api/v1/schools?${params.toString()}
- Best context: `const response = await api(`/api/v1/schools?${params.toString()}`);`
- Reference: `services\portal-service\assets\portal-owner.js:7658`
- Other refs: 1

### UNSPECIFIED /api/v1/schools?tenant_id=${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/schools?tenant_id=${encodeURIComponent(workspace.tenant_id)}`).catch(() => ({ items: appState.organization.schools })),`
- Reference: `services\portal-service\assets\portal-owner.js:7078`

### GET /api/v1/search/documents
- Best context: `| `data-intelligence` | `GET /api/v1/search/documents`, `POST /api/v1/knowledge/questions` | `test/search-knowledge-brain.test.mjs`, `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-intelligence.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:69`

### UNSPECIFIED /api/v1/sessions/${encodeURIComponent(authState.session_id)}/scope:select
- Best context: ``/api/v1/sessions/${encodeURIComponent(authState.session_id)}/scope:select`,`
- Reference: `services\portal-service\assets\portal-owner.js:9690`
- Other refs: 1

### UNSPECIFIED /api/v1/sessions/${encodeURIComponent(authState.session_id)}/step-up
- Best context: ``/api/v1/sessions/${encodeURIComponent(authState.session_id)}/step-up`,`
- Reference: `services\portal-service\assets\portal-owner.js:8520`

### UNSPECIFIED /api/v1/sessions/${encodeURIComponent(authState.session_id)}/step-up:challenge
- Best context: `const data = await apiRequest(`/api/v1/sessions/${encodeURIComponent(authState.session_id)}/step-up:challenge`, {`
- Reference: `services\portal-service\assets\portal-owner.js:2849`

### UNSPECIFIED /api/v1/sessions/${encodeURIComponent(session.session_id)}
- Best context: ``/api/v1/sessions/${encodeURIComponent(session.session_id)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:9086`

### UNSPECIFIED /api/v1/sessions/${encodeURIComponent(sessionId)}
- Best context: `await apiRequest(`/api/v1/sessions/${encodeURIComponent(sessionId)}`, {`
- Reference: `services\portal-service\assets\portal-owner.js:9444`
- Other refs: 1

### POST /api/v1/sessions/7784a807-8bb1-43cd-b04c-e743eb549bba/step-up
- Best context: `- paragraph [ref=e856]: POST /api/v1/sessions/7784a807-8bb1-43cd-b04c-e743eb549bba/step-up • reason Invalid-Password • principal Owner User`
- Reference: `.playwright-cli\page-2026-03-24T06-56-14-240Z.yml:781`

### DELETE /api/v1/sessions/:sessionId
- Best context: `- `DELETE /api/v1/sessions/:sessionId` when revoking another session`
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:59`
- Other refs: 2

### POST /api/v1/sessions/:sessionId/scope:select
- Best context: `- `POST /api/v1/sessions/:sessionId/scope:select``
- Reference: `docs\runbooks\portal-auth-shell.md:74`

### POST /api/v1/sessions/:sessionId/step-up
- Best context: `2. `POST /api/v1/sessions/:sessionId/step-up` with `password`, `challenge_id`, and `webauthn_response``
- Reference: `docs\runbooks\owner-login-strict.md:132`
- Other refs: 5

### POST /api/v1/sessions/:sessionId/step-up:challenge
- Best context: `1. `POST /api/v1/sessions/:sessionId/step-up:challenge``
- Reference: `docs\runbooks\owner-login-strict.md:131`
- Other refs: 2

### UNSPECIFIED /api/v1/sessions/refresh
- Best context: `const data = await apiRequest('/api/v1/sessions/refresh', {`
- Reference: `services\portal-service\assets\portal-owner.js:2880`
- Other refs: 1

### POST /api/v1/simulation/approvals
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/approvals/run-due
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/comparisons
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/briefings
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/briefings
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/briefings/:briefingId/exports
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/control-tower
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/monitor-runs
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/monitors
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/monitors
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/monitors/:monitorId/run
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/monitors/run-due
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/outliers/:runId/triage
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/playbooks
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/playbooks
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/playbooks/:playbookId/activate
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/playbooks/effectiveness
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/portfolio
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/response-scorecards
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/governance/response-scorecards/exports
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/risk-heatmap
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/risk-outliers
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/governance/risk-trends
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/policies
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/policies/:policyId/assign-default
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/policies/:policyId/versions
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/policy-assignments
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### GET /api/v1/simulation/policy-evaluations
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/scenarios/:scenarioId/batches
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/simulation/templates
- Best context: `| `simulation-studio` | `POST /api/v1/simulation/policies`, `POST /api/v1/simulation/policies/:policyId/versions`, `POST /api/v1/simulation/policies/:policyId/assign-default`, `GET /api/v1/simulation/policy-assignments`, `GET /api/v1/simulation/policy-evaluations`, `POST /api/v1/simulation/approvals/run-due`, `GET /api/v1/simulation/governance/portfolio`, `GET /api/v1/simulation/governance/risk-heatmap`, `GET /api/v1/simulation/governance/risk-trends`, `GET /api/v1/simulation/governance/risk-outliers`, `POST /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks`, `GET /api/v1/simulation/governance/playbooks/effectiveness`, `GET /api/v1/simulation/governance/control-tower`, `POST /api/v1/simulation/governance/briefings`, `GET /api/v1/simulation/governance/briefings`, `POST /api/v1/simulation/governance/briefings/:briefingId/exports`, `POST /api/v1/simulation/governance/monitors`, `GET /api/v1/simulation/governance/monitors`, `POST /api/v1/simulation/governance/monitors/run-due`, `POST /api/v1/simulation/governance/monitors/:monitorId/run`, `GET /api/v1/simulation/governance/monitor-runs`, `GET /api/v1/simulation/governance/response-scorecards`, `POST /api/v1/simulation/governance/response-scorecards/exports`, `POST /api/v1/simulation/governance/playbooks/:playbookId/activate`, `POST /api/v1/simulation/governance/playbooks/:playbookId/outcomes`, `POST /api/v1/simulation/governance/outliers/:runId/triage`, `POST /api/v1/simulation/templates`, `POST /api/v1/simulation/scenarios/:scenarioId/batches`, `POST /api/v1/simulation/comparisons`, `POST /api/v1/simulation/approvals` | `test/simulation-studio.test.mjs`, `test/simulation-studio-governance.test.mjs`, `test/simulation-studio-policy.test.mjs`, `test/simulation-studio-policy-lifecycle.test.mjs`, `test/simulation-studio-approval-workflow.test.mjs`, `test/simulation-studio-governance-ledger.test.mjs`, `test/simulation-studio-approval-sla.test.mjs`, `test/simulation-studio-governance-portfolio.test.mjs`, `test/simulation-studio-governance-heatmap.test.mjs`, `test/simulation-studio-governance-trends.test.mjs`, `test/simulation-studio-governance-outliers.test.mjs`, `test/simulation-studio-governance-playbooks.test.mjs`, `test/simulation-studio-governance-playbook-effectiveness.test.mjs`, `test/simulation-studio-governance-control-tower.test.mjs`, `test/simulation-studio-governance-briefings.test.mjs`, `test/simulation-studio-governance-monitors.test.mjs`, `test/simulation-studio-governance-response-scorecards.test.mjs`, `test/simulation-studio-governance-response-scorecards-export.test.mjs`, `test/enterprise-downgrade-sequencing-simulation-studio.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:68`

### POST /api/v1/sovereign-ai/models
- Best context: `| `sovereign-ai-registry` | `POST /api/v1/sovereign-ai/models`, `POST /api/v1/sovereign-ai/models/:modelId/approve` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:38`

### POST /api/v1/sovereign-ai/models/:modelId/approve
- Best context: `| `sovereign-ai-registry` | `POST /api/v1/sovereign-ai/models`, `POST /api/v1/sovereign-ai/models/:modelId/approve` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:38`

### POST /api/v1/sovereign-audit/requests
- Best context: `| `sovereign-audit-exchange` | `POST /api/v1/sovereign-audit/requests`, `POST /api/v1/sovereign-audit/requests/:requestId/decisions` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:76`

### POST /api/v1/sovereign-audit/requests/:requestId/decisions
- Best context: `| `sovereign-audit-exchange` | `POST /api/v1/sovereign-audit/requests`, `POST /api/v1/sovereign-audit/requests/:requestId/decisions` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:76`

### POST /api/v1/sovereign-billing/contracts
- Best context: `| `sovereign-billing` | `POST /api/v1/sovereign-billing/contracts`, `POST /api/v1/sovereign-billing/contracts/:contractId/statements` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:17`

### POST /api/v1/sovereign-billing/contracts/:contractId/statements
- Best context: `| `sovereign-billing` | `POST /api/v1/sovereign-billing/contracts`, `POST /api/v1/sovereign-billing/contracts/:contractId/statements` | `test/frontier-expansion-wave1.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:17`

### POST /api/v1/sovereign-transfers/requests
- Best context: `| `sovereign-transfer-orchestrator` | `POST /api/v1/sovereign-transfers/requests`, `POST /api/v1/sovereign-transfers/requests/:requestId/decisions` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:66`

### POST /api/v1/sovereign-transfers/requests/:requestId/decisions
- Best context: `| `sovereign-transfer-orchestrator` | `POST /api/v1/sovereign-transfers/requests`, `POST /api/v1/sovereign-transfers/requests/:requestId/decisions` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:66`

### UNSPECIFIED /api/v1/staff
- Action: Create Staff
- Best context: `const data = await runAction('Create Staff', () => api('/api/v1/staff', {`
- Reference: `services\portal-service\assets\portal-owner.js:10002`
- Other refs: 1

### POST /api/v1/staff
- Best context: `| `staff-management` | `POST /api/v1/staff`, `POST /api/v1/staff/:staffId/assignments` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:18`

### UNSPECIFIED /api/v1/staff-assignments/${encodeURIComponent(assignmentId)}
- Best context: ``/api/v1/staff-assignments/${encodeURIComponent(assignmentId)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:10067`
- Other refs: 1

### UNSPECIFIED /api/v1/staff-assignments/${encodeURIComponent(assignmentId)}/${operation}
- Best context: `() => api(`/api/v1/staff-assignments/${encodeURIComponent(assignmentId)}/${operation}`, {`
- Reference: `services\portal-service\assets\portal-owner.js:10081`
- Other refs: 1

### GET /api/v1/staff-attendance/records
- Best context: `| `hr-payroll` | `GET /api/v1/payroll/plans`, `GET /api/v1/staff-attendance/records` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:76`

### UNSPECIFIED /api/v1/staff/${encodeURIComponent(ensureWorkspaceValue(workspace.staff_id,
- Best context: ``/api/v1/staff/${encodeURIComponent(ensureWorkspaceValue(workspace.staff_id, 'Staff ID'))}/assignments``
- Reference: `services\portal-service\assets\portal-owner.js:9777`
- Other refs: 3

### POST /api/v1/staff/:staffId/assignments
- Best context: `| `staff-management` | `POST /api/v1/staff`, `POST /api/v1/staff/:staffId/assignments` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:18`

### UNSPECIFIED /api/v1/staff?${staffParams.toString()}
- Best context: `api(`/api/v1/staff?${staffParams.toString()}`)`
- Reference: `services\portal-service\assets\portal-owner.js:7602`
- Other refs: 1

### POST /api/v1/standards/:standardId/links
- Best context: `| `standards-alignment` | `POST /api/v1/standards/frameworks`, `POST /api/v1/standards/:standardId/links` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:34`

### POST /api/v1/standards/frameworks
- Best context: `| `standards-alignment` | `POST /api/v1/standards/frameworks`, `POST /api/v1/standards/:standardId/links` | `test/competency-learning-record.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:34`

### POST /api/v1/student-agency/reflections
- Best context: `| `student-agency` | `POST /api/v1/student-agency/reflections`, `POST /api/v1/student-agency/reflections/:reflectionId/actions`, `GET /api/v1/student-agency/summary` | `test/student-agency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:106`

### POST /api/v1/student-agency/reflections/:reflectionId/actions
- Best context: `| `student-agency` | `POST /api/v1/student-agency/reflections`, `POST /api/v1/student-agency/reflections/:reflectionId/actions`, `GET /api/v1/student-agency/summary` | `test/student-agency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:106`

### GET /api/v1/student-agency/summary
- Best context: `| `student-agency` | `POST /api/v1/student-agency/reflections`, `POST /api/v1/student-agency/reflections/:reflectionId/actions`, `GET /api/v1/student-agency/summary` | `test/student-agency.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:106`

### POST /api/v1/student-success/cohorts
- Best context: `| `student-success-command` | `POST /api/v1/student-success/cohorts`, `POST /api/v1/student-success/intervention-plans` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:49`

### POST /api/v1/student-success/intervention-plans
- Best context: `| `student-success-command` | `POST /api/v1/student-success/cohorts`, `POST /api/v1/student-success/intervention-plans` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:49`

### POST /api/v1/student-voice/feedback
- Best context: `| `student-voice` | `POST /api/v1/student-voice/feedback`, `POST /api/v1/student-voice/feedback/:feedbackId/actions`, `GET /api/v1/student-voice/summary` | `test/student-voice.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:101`

### POST /api/v1/student-voice/feedback/:feedbackId/actions
- Best context: `| `student-voice` | `POST /api/v1/student-voice/feedback`, `POST /api/v1/student-voice/feedback/:feedbackId/actions`, `GET /api/v1/student-voice/summary` | `test/student-voice.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:101`

### GET /api/v1/student-voice/summary
- Best context: `| `student-voice` | `POST /api/v1/student-voice/feedback`, `POST /api/v1/student-voice/feedback/:feedbackId/actions`, `GET /api/v1/student-voice/summary` | `test/student-voice.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:101`

### GET /api/v1/students/:studentId/attendance
- Best context: `| `attendance` | `POST /api/v1/attendance/mark`, `GET /api/v1/students/:studentId/attendance` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:21`

### POST /api/v1/students/:studentId/support-plans
- Best context: `| `student-support` | `POST /api/v1/students/:studentId/support-plans`, `POST /api/v1/support-plans/:planId/progress-logs` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:29`

### GET /api/v1/students/:studentId/timetable
- Best context: `| `timetable` | `POST /api/v1/timetable-entries`, `GET /api/v1/students/:studentId/timetable` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:20`

### POST /api/v1/students/from-application
- Best context: `| `student-lifecycle` | `POST /api/v1/applications`, `POST /api/v1/students/from-application` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:17`

### POST /api/v1/supply-chain/disruption-scenarios
- Best context: `| `supply-chain-intelligence` | `POST /api/v1/supply-chain/vendors`, `POST /api/v1/supply-chain/disruption-scenarios` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:53`

### POST /api/v1/supply-chain/vendors
- Best context: `| `supply-chain-intelligence` | `POST /api/v1/supply-chain/vendors`, `POST /api/v1/supply-chain/disruption-scenarios` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:53`

### POST /api/v1/support-plans/:planId/progress-logs
- Best context: `| `student-support` | `POST /api/v1/students/:studentId/support-plans`, `POST /api/v1/support-plans/:planId/progress-logs` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:29`

### POST /api/v1/support-tickets
- Best context: `| `support` | `POST /api/v1/support-tickets`, `POST /api/v1/support-tickets/:ticketId/resolve` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:28`

### POST /api/v1/support-tickets/:ticketId/resolve
- Best context: `| `support` | `POST /api/v1/support-tickets`, `POST /api/v1/support-tickets/:ticketId/resolve` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:28`

### POST /api/v1/sustainability/records
- Best context: `| `sustainability-ledger` | `POST /api/v1/sustainability/records`, `POST /api/v1/sustainability/reports` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:61`

### POST /api/v1/sustainability/reports
- Best context: `| `sustainability-ledger` | `POST /api/v1/sustainability/records`, `POST /api/v1/sustainability/reports` | `test/enterprise-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:61`

### POST /api/v1/synthetic-data/requests
- Best context: `| `synthetic-data-governance` | `POST /api/v1/synthetic-data/requests`, `POST /api/v1/synthetic-data/requests/:requestId/approvals` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:41`

### POST /api/v1/synthetic-data/requests/:requestId/approvals
- Best context: `| `synthetic-data-governance` | `POST /api/v1/synthetic-data/requests`, `POST /api/v1/synthetic-data/requests/:requestId/approvals` | `test/frontier-expansion-wave4.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:41`

### UNSPECIFIED /api/v1/tasks/automation/from-alerts
- Best context: `return api('/api/v1/tasks/automation/from-alerts', {`
- Reference: `services\portal-service\assets\portal-owner.js:9804`
- Other refs: 1

### GET /api/v1/tasks?tenant_id=...&school_id=...
- Best context: `4. Confirm playbook task fan-out is visible in `GET /api/v1/tasks?tenant_id=...&school_id=...`.`
- Reference: `docs\runbooks\deployment.md:82`

### UNSPECIFIED /api/v1/tenant-billing/contracts
- Best context: `return api('/api/v1/tenant-billing/contracts', {`
- Reference: `services\portal-service\assets\portal-owner.js:10275`
- Other refs: 1

### UNSPECIFIED /api/v1/tenant-billing/contracts?${contractParams.toString()}
- Best context: `api(`/api/v1/tenant-billing/contracts?${contractParams.toString()}`),`
- Reference: `services\portal-service\assets\portal-owner.js:8042`
- Other refs: 2

### UNSPECIFIED /api/v1/tenant-billing/contracts?tenant_id=${encodeURIComponent(tenantId)}&limit=100
- Best context: `return api(`/api/v1/tenant-billing/contracts?tenant_id=${encodeURIComponent(tenantId)}&limit=100`);`
- Reference: `services\portal-service\assets\portal-owner.js:4402`

### UNSPECIFIED /api/v1/tenant-billing/statements
- Best context: `return api('/api/v1/tenant-billing/statements', {`
- Reference: `services\portal-service\assets\portal-owner.js:10327`
- Other refs: 1

### UNSPECIFIED /api/v1/tenant-billing/statements/${encodeURIComponent(statement.tenant_billing_statement_id)}
- Best context: ``/api/v1/tenant-billing/statements/${encodeURIComponent(statement.tenant_billing_statement_id)}``
- Reference: `services\portal-service\assets\portal-owner.js:7895`
- Other refs: 1

### UNSPECIFIED /api/v1/tenant-billing/statements/${encodeURIComponent(statementId)}/settle
- Best context: ``/api/v1/tenant-billing/statements/${encodeURIComponent(statementId)}/settle`,`
- Reference: `services\portal-service\assets\portal-owner.js:10382`
- Other refs: 1

### UNSPECIFIED /api/v1/tenant-billing/statements?${statementParams.toString()}
- Best context: `api(`/api/v1/tenant-billing/statements?${statementParams.toString()}`),`
- Reference: `services\portal-service\assets\portal-owner.js:8043`
- Other refs: 2

### UNSPECIFIED /api/v1/tenant-metering/snapshots
- Best context: `return api('/api/v1/tenant-metering/snapshots', {`
- Reference: `services\portal-service\assets\portal-owner.js:10305`
- Other refs: 1

### UNSPECIFIED /api/v1/tenant-metering/usage?${usageParams.toString()}
- Best context: `const usage = await api(`/api/v1/tenant-metering/usage?${usageParams.toString()}`).catch(() => null);`
- Reference: `services\portal-service\assets\portal-owner.js:8061`
- Other refs: 2

### UNSPECIFIED /api/v1/tenant-metering/usage?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id,
- Best context: ``/api/v1/tenant-metering/usage?tenant_id=${encodeURIComponent(ensureWorkspaceValue(workspace.tenant_id, 'Tenant ID'))}``
- Reference: `services\portal-service\assets\portal-owner.js:9737`
- Other refs: 1

### UNSPECIFIED /api/v1/tenants
- Best context: `const payload = await api('/api/v1/tenants').catch(() => ({ items: [] }));`
- Reference: `services\portal-service\assets\portal-owner.js:6654`

### POST /api/v1/tenants
- Best context: `| `core-platform` | `POST /api/v1/tenants`, `POST /api/v1/principals` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:13`

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(tenantId)}
- Best context: ``/api/v1/tenants/${encodeURIComponent(tenantId)}`,`
- Reference: `services\portal-service\assets\portal-owner.js:9166`
- Other refs: 2

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(tenantId)}/features/${encodeURIComponent(featureKey)}/disable
- Best context: `? `/api/v1/tenants/${encodeURIComponent(tenantId)}/features/${encodeURIComponent(featureKey)}/disable``
- Reference: `services\portal-service\assets\portal-owner.js:9255`

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(tenantId)}/features/${encodeURIComponent(featureKey)}/enable
- Best context: `: `/api/v1/tenants/${encodeURIComponent(tenantId)}/features/${encodeURIComponent(featureKey)}/enable`;`
- Reference: `services\portal-service\assets\portal-owner.js:9256`

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(tenantId)}/recovery-checklist:sign-off
- Best context: ``/api/v1/tenants/${encodeURIComponent(tenantId)}/recovery-checklist:sign-off`,`
- Reference: `services\portal-service\assets\portal-owner.js:4786`

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}
- Best context: `api(`/api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:7079`
- Other refs: 1

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}/school-leadership-coverage
- Best context: `api(`/api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}/school-leadership-coverage`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7086`
- Other refs: 1

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}/school-login-posture
- Best context: `api(`/api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}/school-login-posture`).catch(() => ({ items: [] })),`
- Reference: `services\portal-service\assets\portal-owner.js:7087`

### UNSPECIFIED /api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}/session-security
- Best context: `api(`/api/v1/tenants/${encodeURIComponent(workspace.tenant_id)}/session-security`).catch(() => null),`
- Reference: `services\portal-service\assets\portal-owner.js:7080`

### PATCH /api/v1/tenants/:tenantId
- Best context: `These are saved through `PATCH /api/v1/tenants/:tenantId`.`
- Reference: `docs\runbooks\owner-access-security.md:41`
- Other refs: 4

### POST /api/v1/tenants/:tenantId/features/:featureKey/disable
- Best context: `- `POST /api/v1/tenants/:tenantId/features/:featureKey/disable``
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:49`

### POST /api/v1/tenants/:tenantId/features/:featureKey/enable
- Best context: `- `POST /api/v1/tenants/:tenantId/features/:featureKey/enable``
- Reference: `docs\runbooks\owner-sensitive-action-step-up.md:48`

### POST /api/v1/tenants/:tenantId/recovery-checklist:sign-off
- Best context: `- `POST /api/v1/tenants/:tenantId/recovery-checklist:sign-off``
- Reference: `docs\runbooks\owner-access-security.md:70`
- Other refs: 1

### GET /api/v1/tenants/:tenantId/school-leadership-coverage
- Best context: `- `GET /api/v1/tenants/:tenantId/school-leadership-coverage``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:83`

### GET /api/v1/tenants/:tenantId/school-login-posture
- Best context: `- `GET /api/v1/tenants/:tenantId/school-login-posture``
- Reference: `docs\runbooks\school-admin-school-governance-phases.md:84`

### GET /api/v1/tenants/:tenantId/session-security
- Best context: `- `GET /api/v1/tenants/:tenantId/session-security``
- Reference: `docs\runbooks\owner-access-security.md:69`
- Other refs: 4

### POST /api/v1/threat-intel/feeds
- Best context: `| `threat-intel-exchange` | `POST /api/v1/threat-intel/feeds`, `POST /api/v1/threat-intel/feeds/:feedId/events` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:29`

### POST /api/v1/threat-intel/feeds/:feedId/events
- Best context: `| `threat-intel-exchange` | `POST /api/v1/threat-intel/feeds`, `POST /api/v1/threat-intel/feeds/:feedId/events` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:29`

### POST /api/v1/timetable-entries
- Best context: `| `timetable` | `POST /api/v1/timetable-entries`, `GET /api/v1/students/:studentId/timetable` | `test/starter-growth-coverage.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:20`

### POST /api/v1/transparency/reports
- Best context: `| `trust-transparency-hub` | `POST /api/v1/transparency/reports`, `POST /api/v1/transparency/reports/:transparencyReportId/disclosures`, `GET /api/v1/transparency/summary` | `test/trust-transparency-hub.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:87`

### POST /api/v1/transparency/reports/:transparencyReportId/disclosures
- Best context: `| `trust-transparency-hub` | `POST /api/v1/transparency/reports`, `POST /api/v1/transparency/reports/:transparencyReportId/disclosures`, `GET /api/v1/transparency/summary` | `test/trust-transparency-hub.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:87`

### GET /api/v1/transparency/summary
- Best context: `| `trust-transparency-hub` | `POST /api/v1/transparency/reports`, `POST /api/v1/transparency/reports/:transparencyReportId/disclosures`, `GET /api/v1/transparency/summary` | `test/trust-transparency-hub.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:87`

### GET /api/v1/transport/control-tower/board
- Best context: `| `transport` | `GET /api/v1/transport/vehicles`, `GET /api/v1/transport/control-tower/board` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:73`

### GET /api/v1/transport/vehicles
- Best context: `| `transport` | `GET /api/v1/transport/vehicles`, `GET /api/v1/transport/control-tower/board` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:73`

### POST /api/v1/trust-calibrations
- Best context: `| `trust-calibration-lab` | `POST /api/v1/trust-calibrations`, `POST /api/v1/trust-calibrations/:calibrationId/runs` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:90`

### POST /api/v1/trust-calibrations/:calibrationId/runs
- Best context: `| `trust-calibration-lab` | `POST /api/v1/trust-calibrations`, `POST /api/v1/trust-calibrations/:calibrationId/runs` | `test/frontier-expansion-wave8.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:90`

### POST /api/v1/trust-frameworks
- Best context: `| `trust-framework` | `POST /api/v1/trust-frameworks`, `POST /api/v1/trust-frameworks/:frameworkId/controls` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:56`

### POST /api/v1/trust-frameworks/:frameworkId/controls
- Best context: `| `trust-framework` | `POST /api/v1/trust-frameworks`, `POST /api/v1/trust-frameworks/:frameworkId/controls` | `test/frontier-expansion-wave5.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:56`

### POST /api/v1/trust-radars
- Best context: `| `trust-anomaly-radar` | `POST /api/v1/trust-radars`, `POST /api/v1/trust-radars/:radarId/detections` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:92`

### POST /api/v1/trust-radars/:radarId/detections
- Best context: `| `trust-anomaly-radar` | `POST /api/v1/trust-radars`, `POST /api/v1/trust-radars/:radarId/detections` | `test/frontier-expansion-wave9.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:92`

### POST /api/v1/trust-repairs
- Best context: `| `trust-repair-orchestrator` | `POST /api/v1/trust-repairs`, `POST /api/v1/trust-repairs/:repairId/actions` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:108`

### POST /api/v1/trust-repairs/:repairId/actions
- Best context: `| `trust-repair-orchestrator` | `POST /api/v1/trust-repairs`, `POST /api/v1/trust-repairs/:repairId/actions` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:108`

### POST /api/v1/trust-signal/sources
- Best context: `| `trust-signal-fusion` | `POST /api/v1/trust-signal/sources`, `POST /api/v1/trust-signal/sources/:sourceId/fusions` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:79`

### POST /api/v1/trust-signal/sources/:sourceId/fusions
- Best context: `| `trust-signal-fusion` | `POST /api/v1/trust-signal/sources`, `POST /api/v1/trust-signal/sources/:sourceId/fusions` | `test/frontier-expansion-wave7.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:79`

### POST /api/v1/trust/scores
- Best context: `| `trust-score` | `POST /api/v1/trust/scores`, `POST /api/v1/trust/scores/:scoreId/signals` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:25`

### POST /api/v1/trust/scores/:scoreId/signals
- Best context: `| `trust-score` | `POST /api/v1/trust/scores`, `POST /api/v1/trust/scores/:scoreId/signals` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:25`

### GET /api/v1/vendors
- Best context: `| `procurement` | `GET /api/v1/vendors`, `GET /api/v1/procurement/requisitions` | `test/enterprise-surface-gating.test.mjs`, `test/enterprise-downgrade-sequencing-services.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:71`

### POST /api/v1/verifiable-claims
- Best context: `| `verifiable-claims` | `POST /api/v1/verifiable-claims`, `POST /api/v1/verifiable-claims/:claimId/disclosures` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:24`

### POST /api/v1/verifiable-claims/:claimId/disclosures
- Best context: `| `verifiable-claims` | `POST /api/v1/verifiable-claims`, `POST /api/v1/verifiable-claims/:claimId/disclosures` | `test/frontier-expansion-wave2.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:24`

### POST /api/v1/wellbeing-forecasts
- Best context: `| `student-wellbeing-forecast-lab` | `POST /api/v1/wellbeing-forecasts`, `POST /api/v1/wellbeing-forecasts/:forecastId/alerts` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:104`

### POST /api/v1/wellbeing-forecasts/:forecastId/alerts
- Best context: `| `student-wellbeing-forecast-lab` | `POST /api/v1/wellbeing-forecasts`, `POST /api/v1/wellbeing-forecasts/:forecastId/alerts` | `test/frontier-expansion-wave10.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:104`

### POST /api/v1/wellbeing/check-ins
- Best context: `| `wellbeing-pulse` | `POST /api/v1/wellbeing/check-ins`, `POST /api/v1/wellbeing/check-ins/:wellbeingCheckinId/actions`, `GET /api/v1/wellbeing/summary` | `test/wellbeing-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:95`

### POST /api/v1/wellbeing/check-ins/:wellbeingCheckinId/actions
- Best context: `| `wellbeing-pulse` | `POST /api/v1/wellbeing/check-ins`, `POST /api/v1/wellbeing/check-ins/:wellbeingCheckinId/actions`, `GET /api/v1/wellbeing/summary` | `test/wellbeing-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:95`

### GET /api/v1/wellbeing/summary
- Best context: `| `wellbeing-pulse` | `POST /api/v1/wellbeing/check-ins`, `POST /api/v1/wellbeing/check-ins/:wellbeingCheckinId/actions`, `GET /api/v1/wellbeing/summary` | `test/wellbeing-pulse.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:95`

### POST /api/v1/workforce/forecasts
- Best context: `| `workforce-intelligence` | `POST /api/v1/workforce/forecasts`, `POST /api/v1/workforce/recommendations` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:52`

### POST /api/v1/workforce/recommendations
- Best context: `| `workforce-intelligence` | `POST /api/v1/workforce/forecasts`, `POST /api/v1/workforce/recommendations` | `test/enterprise-frontier-expansion.test.mjs` |`
- Reference: `docs\plans\enterprise-readiness-matrix.md:52`

### POST /api/v1/zero-trust/grants
- Best context: `| `zero-trust-access` | `POST /api/v1/zero-trust/grants`, `POST /api/v1/zero-trust/grants/:grantId/checks` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:33`

### POST /api/v1/zero-trust/grants/:grantId/checks
- Best context: `| `zero-trust-access` | `POST /api/v1/zero-trust/grants`, `POST /api/v1/zero-trust/grants/:grantId/checks` | `test/frontier-expansion-wave3.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:33`

### POST /api/v1/zk-credentials
- Best context: `| `zero-knowledge-credential` | `POST /api/v1/zk-credentials`, `POST /api/v1/zk-credentials/:credentialId/proofs` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:63`

### POST /api/v1/zk-credentials/:credentialId/proofs
- Best context: `| `zero-knowledge-credential` | `POST /api/v1/zk-credentials`, `POST /api/v1/zk-credentials/:credentialId/proofs` | `test/frontier-expansion-wave6.test.mjs` |`
- Reference: `docs\plans\frontier-readiness-matrix.md:63`
