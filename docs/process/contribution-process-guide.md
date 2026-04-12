# Contribution Process Guide

All work follows `Plan -> Review -> Implement`.

## Validated Baseline

The root workspace is currently verified:

1. `npm run typecheck`
2. `npm run test`
3. `npm run build`
4. `npm run lint`

Use that as the entry condition for any new slice.

## Rules

1. Write a short plan before coding.
2. Review the plan for scope, dependencies, edge cases, and tests.
3. Implement only what was approved.
4. Add or update tests with the change.
5. Keep changes small enough to review in one pass.
6. Rerun the root validation commands after each completed slice.

## Branch and PR Discipline

1. Use one branch per task.
2. Keep the PR title scoped to the vertical slice or fix.
3. Include what changed, how it was tested, and any gaps.
4. Do not merge speculative cleanup into a feature PR.

## Definition of Done

1. Code builds locally.
2. Lint and tests pass.
3. The change is documented if it affects setup, workflow, or behavior.
4. Any follow-up work is captured as a separate task.
5. The next slice is explicitly named before implementation starts.
