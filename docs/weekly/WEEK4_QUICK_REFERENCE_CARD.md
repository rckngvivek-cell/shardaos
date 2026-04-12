# WEEK 4 QUICK REFERENCE CARD

**Print this. Keep it handy. Reference daily.**

---

## 📋 WEEK 4 AT A GLANCE

```
Week:     May 6-10, 2026
Phase:    Foundation & Infrastructure (FINAL WEEK)
Goal:     Production-ready APIs + frontend + monitoring live
Status:   5 PRs → 47 tests → 82% coverage → Pilot schools ready

Daily:    9:00 AM standup (15 min)
EOD:      Update dashboard (5 min)
```

---

## 5 PRs TO DELIVER

| PR | Day | What | Owner | Tests | Success |
|----|-----|------|-------|-------|---------|
| #1 | Mon | API routes (5 endpoints) | Backend | 15+ | Deployed to staging |
| #2 | Tue | Firestore integration | Backend | 15+ | Connected to real DB |
| #3 | Wed | Security rules (RBAC) | Backend | 6+ | Unauthorized rejected |
| #4 | Tue-Wed | Frontend auth UI | Frontend | 5+ | Login works |
| #5 | Thu | Docs + monitoring | You + Backend | 0 | Production observable |

---

## MANDATORY: PRI PROCESS FOR EACH PR

```
1️⃣ PLAN (30 min)
   └─ Write WEEK4_[FEATURE]_PLAN.md
   └─ List all files to change
   └─ Define test cases
   └─ Post in PR draft

2️⃣ REVIEW (15 min)
   └─ Lead reviews plan
   └─ Approved? → code now
   └─ Rejected? → iterate plan

3️⃣ IMPLEMENT (2-3 hours)
   └─ Code exactly as planned
   └─ Write tests as you code
   └─ 80%+ coverage required
   └─ Push PR to GitHub

4️⃣ TEST & VERIFY (15 min)
   └─ Lead code review
   └─ All tests pass?
   └─ CI/CD green?
   └─ Merge to main

⚠️  NO CODING WITHOUT PLAN APPROVAL
⚠️  NO MERGE WITHOUT TESTS PASSING
⚠️  NO EXCEPTIONS
```

---

## DAILY STANDUP TEMPLATE

**Time:** 9:00 AM (15 min max)

**Each person answers:**
1. ✅ What did you finish yesterday?
2. 🎯 What are you working on today?
3. 🚦 Any blockers?

**Example (Backend Engineer):**
```
✅ Finished: API plan document (PR #1 draft)
🎯 Today: Implement 5 API routes + write tests
🚦 Blocker: None
```

**Lead (You) Action Items:**
- [ ] Review plan document today
- [ ] Approve or request changes (by EOD)
- [ ] Unblock any issues
- [ ] Update progress dashboard

---

## ENDPOINTS TO BUILD

### PR #1 (Monday)

```
POST /api/v1/schools
├─ Create school
├─ Body: { name, email, city }
└─ Returns: { id, name, email, city }

GET /api/v1/schools/{id}
├─ Get school details
└─ Returns: { id, name, email, city }

POST /api/v1/schools/{id}/students
├─ Add student to school
├─ Body: { name, email, class }
└─ Returns: { id, name, email, class }

GET /api/v1/schools/{id}/students
├─ List students in school
└─ Returns: [{ id, name, email, class }]

POST /api/v1/schools/{id}/attendance
├─ Mark attendance
├─ Body: { studentId, date, status }
└─ Returns: { id, studentId, date, status }
```

---

## KEY ERRORS TO AVOID

❌ **Skip planning** - Write plan document first!  
❌ **Code without tests** - Write tests AS you code  
❌ **Forget auth middleware** - All endpoints need bearer token check  
❌ **No error handling** - Return proper error codes (400/401/404/500)  
❌ **Hard-code secrets** - Use `.env` files  
❌ **Merge without review** - Lead must approve  
❌ **Miss deadline** - Each PR due same day it's assigned  

---

## TEST COVERAGE TARGET

**For PR #1 (15 tests):**
```
POST /schools           → 3 tests
  ✅ Create valid school
  ✅ Invalid input rejected  
  ✅ Auth required

GET /schools/{id}      → 3 tests
  ✅ Returns school
  ✅ 404 if not found
  ✅ Auth required

POST /schools/{id}/students → 3 tests
GET /schools/{id}/students  → 3 tests
POST /schools/{id}/attendance → 3 tests
```

**Coverage target:** 80%+ (measure line coverage)

---

## GIT WORKFLOW

```bash
# Before you start
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/week4-pr1-apis

# Make changes
# ...write code...
# Run tests
npm test
npm run lint

# Push to GitHub
git push origin feat/week4-pr1-apis

# Create PR via GitHub UI
# - Add title: "feat: Add 5 core API endpoints"
# - Add description: link to WEEK4_API_PLAN.md
# - Request review: [Your Name] (Lead)

# After approval, merge (don't push directly to main!)
# When PR is merged, GitHub Actions auto-deploys to staging
```

---

## CODE REVIEW CHECKLIST

**Lead: Use this when reviewing PRs**

- [ ] Plan document exists + is comprehensive?
- [ ] Tests written + comprehensive?
- [ ] Auth middleware used on all endpoints?
- [ ] Error handling for all cases (400/401/404/500)?
- [ ] No secrets in code?
- [ ] TypeScript strict mode compliant?
- [ ] Code formatted (ESLint pass)?
- [ ] Coverage > 80%?

**If any NO:** Request changes (don't merge)  
**If all YES:** Approve ✅

---

## MONITORING CHECKLIST (PR #5 - Thursday)

**Before EOD Thursday, confirm:**

- [ ] Cloud Logging dashboard live
- [ ] Can see API requests in logs
- [ ] Can see errors in logs
- [ ] Alerts configured:
  - [ ] Error rate > 1%
  - [ ] Response time > 1000ms
  - [ ] No errors for 24h (success log)
- [ ] Runbooks written:
  - [ ] How to deploy
  - [ ] How to rollback
  - [ ] How to debug errors

---

## PILOT SCHOOL OUTREACH

**Do this daily (5-10 min in parallel with coding):**

```
Day 1-2 (Mon-Tue):
├─ Email 3-5 schools
├─ "Hi, we're building a free school ERP pilot"
├─ "Interested in 4-week free trial + ₹10K/year pricing?"

Day 3-4 (Wed-Thu):
├─ Follow up on replies
├─ Schedule demo calls (Sat 10-11 AM and Sun 2-3 PM)
├─ Prepare demo script

Day 5 (Fri):
├─ Demo calls (Sat/Sun)
├─ Answer questions
├─ Get pilot school commitments
```

**Demo Script (15 min):**
```
5 min:  "Here's your dashboard"
3 min:  "Here's how to add students"
3 min:  "Here's how to mark attendance"
2 min:  "Questions? What can we improve?"
2 min:  "Let's sign up!" (collect agreement)
```

---

## DEPLOYMENT TO STAGING

**Automatic (happens when PR is merged):**
```
You merge PR to main
    ↓
GitHub Actions triggers
    ↓
Cloud Build runs tests (npm test)
    ↓
Tests pass? → Docker build → Cloud Run deploy to staging
Tests fail? → Build stops (fix code + retry)
```

**Manual check (after auto-deploy):**
```bash
# Verify staging deployment worked
curl https://school-erp-api-staging-xyz.run.app/health
# Should return: { "status": "ok", "timestamp": "2026-05-06T09:30:00Z" }
```

---

## BLOCKERS: WHAT TO DO

**Firestore auth failing?**
```
→ Check Firebase Admin SDK initialized
→ Check .env has GOOGLE_APPLICATION_CREDENTIALS
→ Restart Firestore emulator: firebase emulators:start
```

**Tests not running?**
```
→ npm install
→ npm test
→ Check Node.js version (must be 18+)
```

**Deploy failing?**
```
→ Check Cloud Build logs (GCP Console)
→ Usually: missing environment variable or GitHub token expired
```

**Performance slow?**
```
→ Check Cloud Logging for query times
→ Might be missing Firestore index
→ Run: firebase emulators:export backup
```

**Need help immediately?**
```
Slack: @lead (me)
Response time: <30 min
Escalation: @lead-architect
```

---

## FRIDAY EOD CHECKLIST

✅ **Must have before you leave Friday:**

- [ ] All 5 PRs created
- [ ] All 5 PRs merged to main
- [ ] 47 tests passing (100%)
- [ ] 82%+ code coverage
- [ ] Main branch builds successfully
- [ ] Staging deployment healthy (0 errors)
- [ ] Documentation complete (4+ files)
- [ ] Monitoring dashboard live
- [ ] Pilot school demos scheduled (Sat/Sun)
- [ ] WEEK4_SIGN_OFF.md created

**If anything missing:** Work through Friday evening or Saturday morning.

---

## WEEK 4 SUCCESS METRICS

| Metric | Target | How to Check |
|--------|--------|-------------|
| **APIs** | 5 deployed | curl vs staging |
| **Tests** | 47 passing | npm test |
| **Coverage** | 82%+ | Coverage report |
| **Latency p95** | <500ms | Load test |
| **Uptime** | 100% | Cloud Monitoring |
| **Errors** | 0 critical | Cloud Logging |
| **PRs** | 5 merged | GitHub log |
| **Docs** | 4+ files | Count in docs/ |
| **Pilots** | 3 identified | Spreadsheet |

---

## QUICK LINKS

**Ready to start? Here's what to read first:**

1. **This card** (you're reading it ✓)
2. `WEEK4_EXECUTIVE_SUMMARY.md` ← Full overview
3. `WEEK4_KICKOFF_PLAN.md` ← Step-by-step
4. `WEEK4_PRI_ENFORCEMENT_CHECKLIST.md` ← For each PR
5. `WEEK4_DAILY_PROGRESS_DASHBOARD.md` ← Update daily

---

## MONDAY MORNING CHECKLIST

**Before standup at 9:00 AM:**

- [ ] Environment ready (clone, npm install done)
- [ ] Firestore emulator running (`firebase emulators:start`)
- [ ] Local server starts (`npm start`)
- [ ] Tests pass locally (`npm test`)
- [ ] Read WEEK4_KICKOFF_PLAN.md (Monday section)
- [ ] Know what you're building today

**After standup:**

- Backend: Start PR #1 planning
- Frontend: Set up environment
- Lead (You): Start reviewing plan documents

---

**WEEK 4 STARTS: Monday May 6, 2026**  
**Let's go! 🚀**
