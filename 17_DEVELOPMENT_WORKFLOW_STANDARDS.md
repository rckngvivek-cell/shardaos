# DEVELOPMENT WORKFLOW STANDARDS
## Plan → Review → Implement (PRI Framework)

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** MANDATORY for all engineers  

---

# 🎯 THE PRI FRAMEWORK (MANDATORY)

Every feature, bug fix, refactor, or task MUST follow this workflow:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  STEP 1: PLAN                                                │
│  ├─ Break task into subtasks                                 │
│  ├─ Identify dependencies                                    │
│  ├─ List files to modify                                     │
│  └─ Estimate time                                            │
│         ↓                                                    │
│  STEP 2: REVIEW PLAN                                         │
│  ├─ Self-review: "Is this the best approach?"               │
│  ├─ Check: "Are there edge cases I'm missing?"              │
│  ├─ Team review: Ask for feedback on plan (not code)        │
│  └─ Iterate: Refine plan based on feedback                  │
│         ↓                                                    │
│  STEP 3: IMPLEMENT                                           │
│  ├─ Code exactly as planned                                 │
│  ├─ Run tests after each file                               │
│  ├─ Follow linting rules                                    │
│  └─ Commit with descriptive messages                        │
│         ↓                                                    │
│  STEP 4: TEST & VERIFY                                       │
│  ├─ Run full test suite                                     │
│  ├─ Manual testing of feature                               │
│  ├─ Check edge cases                                        │
│  └─ Get code review before submitting PR                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# PART 1: STEP 1 - DETAILED PLANNING

## What Makes a Good Plan?

```
❌ BAD PLAN:
  "Add authentication to the API"
  Time: 2 hours
  Files: auth.ts

✅ GOOD PLAN:
  Task: Implement JWT token validation middleware
  
  Context:
    - Why: Secure API endpoints from unauthorized access
    - Related: Existing login endpoint at POST /auth/login
    - Depends on: Firebase Admin SDK (already installed)
  
  Subtasks:
    1. Create validateToken middleware
       - Extract token from Authorization header
       - Verify with Firebase Admin SDK
       - Handle errors: missing token, invalid token, expired token
       
    2. Update authentication middleware
       - Add to all protected routes (28 routes)
       - Skip for public routes (3 routes: /health, /auth/login, /auth/register)
       
    3. Update error responses
       - Return 401 for invalid/expired tokens
       - Return 403 for insufficient permissions
       
    4. Write tests
       - Unit test: Valid token ✓
       - Unit test: Expired token ✓
       - Integration test: API with valid token ✓
       - Integration test: API with invalid token ✓
  
  Files to modify:
    - src/middleware/auth.ts (new file)
    - src/middleware/validator.ts (update)
    - src/routes/*.ts (28 protected routes)
    - src/__tests__/auth.spec.ts (new file)
    - src/errors.ts (add new error responses)
  
  Risks & Mitigations:
    - Risk: Break existing login flow
      → Mitigation: Create backup of current middleware first
      
    - Risk: InvalidToken error logs flood
      → Mitigation: Add rate limiting on error logs
  
  Time estimate:
    - Planning: 30 min (DONE)
    - Implementation: 2 hours
    - Testing: 1 hour
    - Code review: 30 min
    - TOTAL: 4 hours
```

## Planning Template (Use This!)

```
TASK: [Task name]
ESTIMATED TIME: [X hours]

1. CONTEXT
   - Why are we doing this?
   - What triggered this task?
   - Any related work?

2. SUBTASKS
   - [ ] Subtask 1 with exact scope
   - [ ] Subtask 2 with exact scope
   - [ ] Test subtask 1
   - [ ] Test subtask 2

3. FILES TO MODIFY
   - [ ] src/file1.ts (what will change)
   - [ ] src/file2.ts (what will change)
   - [ ] src/__tests__/file1.spec.ts (new tests)

4. ARCHITECTURE
   - Add diagram if complex
   - Show dependencies
   - Show data flow

5. EDGE CASES & ERROR HANDLING
   - What if X happens?
   - What if Y is null?
   - What if network fails?

6. TESTING STRATEGY
   - Unit tests: [list what to test]
   - Integration tests: [list what to test]
   - Manual testing: [steps to verify]

7. RISKS & MITIGATIONS
   - Risk: [something could go wrong]
     Mitigation: [how to prevent/handle]
```

---

# PART 2: STEP 2 - PLAN REVIEW CHECKLIST

Before writing ANY code, verify your plan:

## Self-Review Questions

```
□ CLARITY
  ☐ Can I explain this plan in 2 minutes?
  ☐ Are subtasks concrete (not vague)?
  ☐ Does each subtask have a clear start/end?

□ COMPLETENESS
  ☐ Have I identified all files to modify?
  ☐ Are there any files I'm missing?
  ☐ Did I account for backward compatibility?
  ☐ Do I need database migrations?

□ ARCHITECTURE
  ☐ Is this the simplest solution?
  ☐ Could this be done differently/better?
  ☐ Does this follow existing patterns in codebase?
  ☐ Is there DRY violation (repeated code)?

□ EDGE CASES
  ☐ What happens if input is null/undefined?
  ☐ What happens if network fails?
  ☐ What happens if database is slow?
  ☐ What about concurrent requests?
  ☐ What about different user roles?

□ TESTING
  ☐ Can I test all subtasks?
  ☐ Are test cases clear?
  ☐ Do I need fixtures/mock data?
  ☐ Will tests run in CI/CD?

□ TIME ESTIMATE
  ☐ Is 2-3 hour estimate realistic?
  ☐ Did I add buffer (usually +30%)?
  ☐ Are there blocking dependencies?

□ RISK ASSESSMENT
  ☐ What could go wrong?
  ☐ Are there any breaking changes?
  ☐ Do I need to notify others?
```

## Team Plan Review

```
BEFORE CODE: Share plan in PR/issue

Reviewer should verify:
☐ Plan is clear and achievable
☐ Subtasks are in logical order
☐ Edge cases are considered
☐ Tests are sufficient
☐ No better approach exists
☐ Doesn't conflict with other work

Feedback: "APPROVED ✓" or "NEEDS REVISION"

If revision needed:
  - Engineer updates plan
  - Resubmit to reviewer
  - DO NOT START CODING until approved
```

---

# PART 3: STEP 3 - IMPLEMENTATION DISCIPLINE

## Implementation Rules

```
RULE 1: Code EXACTLY as planned
  If you deviate, stop and update the plan first
  Review the changes with team if significant

RULE 2: One subtask = one commit
  Each logical piece = one small commit
  Revert = one commit undo

RULE 3: Test after each file
  Don't write 3 files then test
  Write file → test → commit → repeat

RULE 4: Follow the coding standards
  ✓ ESLint must pass
  ✓ Prettier formatting required
  ✓ Type safety (no `any` types)
  ✓ Error handling (try/catch)
  ✓ Comments for complex logic

RULE 5: Don't add scope creep
  Only implement what was planned
  If you find a related bug → create new task
  Don't fix "while you're at it"
```

## Commit Message Format

```
Format: <type>(<scope>): <subject>

Examples:

[PLAN-APPROVED] feat(auth): add JWT validation middleware
├─ Subtask 1/4: Create validateToken middleware
├─ File: src/middleware/auth.ts (new)
└─ Tests: 4 passed

[IMPLEMENTING] refactor(students): optimize query with indexes
├─ Subtask 2/3: Add indexes to Firestore
├─ File: src/services/students.service.ts
└─ Tests: 12 passed

[COMPLETE] test(attendance): add attendance calculation tests
├─ Subtask 4/4 FINAL: Complete test suite
├─ Files: src/__tests__/attendance.spec.ts
└─ Tests: 28/28 passed (100% coverage for module)
```

---

# PART 4: IMPLEMENTATION CHECKLIST

As you code, track progress:

```typescript
// At top of your workspace, create: WORK_IN_PROGRESS.md

## Task: Add JWT authentication middleware
**Status:** 🟡 IN PROGRESS (3/4 subtasks complete)
**Plan Approved:** ✓ 2026-04-09 10:00 AM
**Started:** 2026-04-09 10:30 AM
**Expected Done:** 2026-04-09 02:30 PM

### Subtasks:
- [x] 1. Create validateToken middleware
  - File: src/middleware/auth.ts
  - Tests: 4/4 passed
  - Commit: abc1234

- [x] 2. Update protected routes
  - Files: 28 routes updated
  - Tests: 28/28 passed
  - Commit: def5678

- [x] 3. Error handling & responses
  - File: src/errors.ts
  - Tests: 8/8 passed
  - Commit: ghi9012

- [ ] 4. Integration tests (IN PROGRESS)
  - File: src/__tests__/integration/auth.spec.ts
  - Tests: 12/15 passing (1 flaky, 2 failing)
  - Blocked: Waiting for test data setup

### Issues Found:
- Issue #1: Token refresh not implemented (add to future task)
- Issue #2: Admin routes not all updated (will fix in next commit)

### Next Step:
Fix 2 failing integration tests, then request code review
```

---

# PART 5: STEP 4 - TESTING & VERIFICATION

Before submitting PR:

```
Manual Checklist:
□ npm run build → 0 errors
□ npm run lint → 0 warnings
□ npm run test → all tests pass
□ npm run test:coverage → > 80% coverage
  
Feature Testing:
□ Happy path works (normal use case)
□ Invalid input handled (null, empty, wrong type)
□ Error cases trigger correct responses
□ Edge cases work (concurrent, timeout, etc)

Integration Testing:
□ Works with related features
□ Database queries efficient (no N+1)
□ API responses under 500ms
□ No console errors/warnings

Code Review Checklist:
□ Code readable & well-commented
□ No dead code or commented code
□ No security vulnerabilities
□ No performance issues
□ Follows team patterns & conventions
□ Tests are meaningful (not just coverage)
```

---

# PART 6: WHEN THINGS GO WRONG

## If plan doesn't work during implementation:

```
STOP CODING ⛔

Then:
1. Analyze what went wrong
2. Document the issue
3. Propose solution
4. Get team approval BEFORE continuing
5. Update plan with new approach

Example:
  Original plan: "Optimize query with index on (schoolId, class)"
  
  Issue found: Firestore doesn't support compound indexes on 
               this combination in free tier. Need different approach.
  
  New plan A: Add caching layer (Redis)
  New plan B: Denormalize data structure
  New plan C: Fetch data and filter in app
  
  Team votes: A wins
  Timeline updated: +2 hours
  Continue coding with new plan...
```

---

# PART 7: EXAMPLE: REAL DEVELOPMENT SESSION

## Task: Add attendance offline sync

### Step 1: PLANNING (30 min)

```
TASK: Implement offline attendance sync
ESTIMATED TIME: 4 hours

CONTEXT:
- Mobile app doesn't work offline currently
- Teachers marked 500 attendances while app was offline
- Need async queue that syncs when connection returns

SUBTASKS:
1. Analyze attendance endpoint requirements ✓
2. Create local storage schema for pending attendance
3. Implement sync queue service
4. Add network listener to trigger sync
5. Test with offline scenario
6. Test with network interruptions
7. Integration test: multiple offline sessions

FILES:
- services/sync.ts (new)
- services/attendance.ts (update)
- hooks/useNetworkStatus.ts (update)
- __tests__/sync.integration.spec.ts (new)

EDGE CASES:
- What if user submits same attendance twice?
- What if attendance was already synced from another device?
- What if sync takes > 5 minutes?
```

### Step 2: PLAN REVIEW (15 min)

**Self-Review:**
```
☐ CLARITY: Yes, very clear
☐ COMPLETENESS: Wait, what about error handling? ✓ Added to plan
☐ ARCHITECTURE: Should I use IndexedDB instead of AsyncStorage? 
                 → Checked: AsyncStorage is simpler for this
☐ EDGE CASES: What triggers sync? Network state? Time interval?
              → Both. Checked with team.
☐ TESTING: Can I test offline mode in Jest? → Yes, mock NetInfo
```

**Team Review:**
```
Engineer: "Plan ready for review"
Reviewer: "Looks good. Question on #2 - 
           what if timestamp is stale?"
Engineer: "Good catch! Added timestamp validation to plan"
Reviewer: "APPROVED ✓"
```

### Step 3: IMPLEMENT (3 hours)

```
Subtask 1: Local storage schema
  Code: services/sync.ts
  Commit: "feat(sync): add local storage schema for pending attendance"
  Tests: 3/3 passed ✓

Subtask 2: Sync queue service
  Code: services/sync.ts (continued)
  Commit: "feat(sync): implement sync queue with retry logic"
  Tests: 7/7 passed ✓

Subtask 3: Network listener
  Code: hooks/useNetworkStatus.ts
  Commit: "feat(sync): add network listener to trigger sync"
  Tests: 5/5 passed ✓

Subtask 4: Integration tests
  Code: __tests__/sync.integration.spec.ts
  Commit: "test(sync): add offline sync integration tests"
  Tests: 12/12 passed ✓
```

### Step 4: VERIFY & SUBMIT (1 hour)

```
✓ npm run build → 0 errors
✓ npm run lint → 0 warnings
✓ npm run test → 95 tests passed
✓ npm run test:coverage → 87% coverage

Manual testing:
✓ Mark attendance online → syncs immediately
✓ Mark attendance offline → queued
✓ Go offline during sync → queue paused
✓ Network returns → sync resumes
✓ Force quit app mid-sync → resumes on restart

Code review: 2 minor comments → fixed
MERGED ✓
```

---

# PART 8: ENFORCEMENT & ACCOUNTABILITY

## Consequences for Not Following PRI Framework

```
If engineer skips planning and dives into code:

🔴 FIRST VIOLATION: Code review rejection
   "Plan not provided. Please document plan first."
   → Engineer must write plan retroactively
   → 1-hour delay

🔴 SECOND VIOLATION: PR blocked
   "Multiple PRI violations this sprint."
   → All PRs must have documented plan approval
   → 1-on-1 with tech lead

🔴 THIRD VIOLATION: Performance review impact
   "Not following team standards."
   → Mentioned in quarterly review
   → May affect promotion/raise

For APPROVED violations (i.e., plan said A but did B):
   → Team votes on if new approach is better
   → If YES: update practices for future
   → If NO: revert and follow original plan
```

---

# PART 9: TOOLS TO SUPPORT PRI FRAMEWORK

## Git Hook for Plan Enforcement

```bash
# .husky/pre-commit
# Prevents committing code without plan

if ! grep -q "PLAN" WORK_IN_PROGRESS.md; then
  echo "❌ ERROR: No plan found in WORK_IN_PROGRESS.md"
  echo "Please document your plan before committing."
  exit 1
fi
```

## GitHub PR Template

```markdown
## 📋 PLAN REFERENCE
Link to plan discussion: [GitHub issue #123]
Plan approved by: @tech-lead
Plan approval time: 2026-04-09 10:00 AM

## ✅ CHECKLIST
- [ ] Plan was documented before coding
- [ ] Plan was reviewed & approved by team
- [ ] Implementation matches plan 100%
- [ ] All tests pass (coverage > 80%)
- [ ] Code review comments addressed

## 🔄 DEVIATIONS (if any)
Any changes from approved plan? Describe why:
- [ ] No deviations
- [ ] Minor: [describe]
- [ ] Major: [describe & link to discussion]

## 📊 METRICS
- Files modified: 5
- Lines changed: 342
- Tests added: 12
- Coverage impact: +3%
```

---

**The PRI Framework ensures every engineer writes perfect code by thinking FIRST, discussing SECOND, and coding THIRD.** 🎯

