# Week 1 QUICK START CHECKLIST

**Duration:** April 15-19, 2026 (Mon-Fri)  
**Goal:** Infrastructure ready, first code deployed  
**Team:** You + 1 contract backend engineer (starting Day 1)  

---

## PRE-WEEK PREP (Do by Friday April 11)

### Legal & Admin
- [ ] Company registered (Pvt Ltd) 
- [ ] PAN + TAN applied for
- [ ] Company email set up (you@schoolerp.in)
- [ ] Stripe account (for future payment processing)

### GCP Setup
- [ ] Google Cloud account created
- [ ] Billing account with credit card added
- [ ] GCP free tier ₹25,000 credit claimed
- [ ] Project created: `school-erp-prod`
- [ ] Service account created (for Cloud Run, Firestore)
- [ ] Service account key downloaded (JSON) → stored securely

### GitHub
- [ ] GitHub organization created: schoolerperp (or similar)
- [ ] Repo initialized: `school-erp-api` (private)
- [ ] Branch protection: main branch (require PR review, tests pass)

### Firebase
- [ ] Firebase project linked to GCP project
- [ ] Firestore database created (region: asia-south1)
- [ ] Storage bucket created
- [ ] Authentication enabled (Google OAuth)

### Recruiting
- [ ] Backend engineer (Node.js + GCP experience) offer sent
- [ ] Frontend engineer (React + Firebase) interviews scheduled
- [ ] Start date: April 15 (or ASAP)

---

## WEEK 1 DRY RUN (Optional: Do by Tuesday April 12)

**Try this locally to validate everything is set up:**

```bash
# Clone the starter template
git clone https://github.com/google-cloud-samples/nodejs-express-firebase-intro.git
cd nodejs-express-firebase-intro

# Install deps
npm install

# Start Firestore emulator
firebase emulators:start

# In another terminal, start app
npm start

# Test API
curl http://localhost:8080/health
# Should return: { "status": "ok" }
```

If this works, you're ready for Day 1.

---

## DAY 1: MONDAY, APRIL 15

### Morning (Team Meeting)

**Attendees:** You, backend engineer

**Agenda (1 hour):**
1. Welcome + big picture (10 mins)
2. Overview: 24-week timeline, all 8 modules (10 mins)
3. Architecture: Firestore, Cloud Run, React (10 mins)
4. Week 1 task: Build `/health` endpoint on Cloud Run (10 mins)
5. Tools: GitHub, GCP, Slack (10 mins)

**Outputs:**
- [ ] Engineer has GCP project access
- [ ] Engineer has GitHub repo access
- [ ] Engineer has Slack/email invite
- [ ] Engineer has shared credentials doc (securely)

### Afternoon (Setup)

**Backend engineer:**
- [ ] Clone repo locally
- [ ] Install Node.js 18 LTS
- [ ] Create `.env` file with GCP credentials
- [ ] Run `npm install`
- [ ] Start Firestore emulator: `firebase emulators:start`
- [ ] Try: `npm start` (should start on port 8080)
- [ ] Test: `curl http://localhost:8080/health`

**You:**
- [ ] Set up developer tools (VSCode, GitHub Desktop, Slack)
- [ ] Create onboarding checklist for frontend engineer (starting next week)
- [ ] Email first customer (St. Xavier, Patna): "Hi principal, we're building you a free pilot ERP. First school to go live gets special founder rate ₹10K. Interested?"

**Success Criteria:**
- Engine can run code locally
- `/health` endpoint returns `{ "status": "ok" }`
- Repo has initial commit with boilerplate

---

## DAY 2: TUESDAY, APRIL 16

### Morning (Architecture Deep Dive)

**Agenda (1 hour):**
1. Firestore schema walkthrough (main 10 collections) (15 mins)
2. API design: REST endpoints, auth flow (15 mins)
3. Cloud Run deployment process (10 mins)
4. Monitoring: Cloud Logging + Errors (10 mins)
5. Testing: Jest framework setup (10 mins)

**Activity:**
- [ ] Engineer reads Firestore schema doc → asks questions
- [ ] You review Cloud Run deployment guide → create checklist

### Afternoon (First Real Features)

**Backend engineer task: Build Student API foundation**

```bash
# Create routes/students.js
# GET /api/v1/schools/{schoolId}/students (returns empty array)
# POST /api/v1/schools/{schoolId}/students (creates dummy record)

# Create tests/students.test.js
# Test: POST creates student
# Test: GET lists students
```

**Your task: Cloud Run setup**

```bash
# Update Dockerfile
# Update cloudbuild.yaml for auto-deploy on git push
# Deploy boilerplate to Cloud Run staging

gcloud run deploy school-erp-api \
  --source . \
  --platform managed \
  --region asia-south1
```

**Success Criteria:**
- [ ] Engineer has 2 passing tests
- [ ] API deployed to Cloud Run (returns health status)
- [ ] You can call API from terminal: `curl https://school-erp-api-xyz.run.app/health`

**End of Day:** First PR (student routes) created → reviewed by you

---

## DAY 3: WEDNESDAY, APRIL 17

### Morning (Security & Monitoring)

**Agenda (1 hour):**
1. Firebase Auth: How login works (10 mins)
2. Firestore Security Rules: Access control (10 mins)
3. Cloud Logging: View logs (10 mins)
4. Alerts: Set up monitoring (10 mins)
5. Backup strategy (10 mins)

**Activity:**
- [ ] Engineer implements Firebase Auth middleware
- [ ] You set up Firestore security rules (basic)
- [ ] Both set up Cloud Logging alerts

### Afternoon (More Coding)

**Backend engineer:** 
- [ ] Add Firebase Auth to all endpoints
- [ ] Fix any security issues
- [ ] Write 5+ tests (targeting 80% coverage)

**You:**
- [ ] Finalize GCP billing alerts (alert if > ₹5,000/month)
- [ ] Create architecture diagrams (Firestore collections, API flows)
- [ ] Start frontend engineer onboarding doc

**Success Criteria:**
- [ ] All endpoints require auth token
- [ ] Tests run automatically on PR (CI/CD)
- [ ] Monitoring dashboard shows 0 errors

**Code committed:** `feat: Add Firebase Auth to all endpoints`

---

## DAY 4: THURSDAY, APRIL 18

### Morning (Code Review & Planning)

**Standup (15 mins):**
- Engineer: "Built Student CRUD, wrote 8 tests, everything green"
- You: "Cloud Run running, monitoring set up, frontend engineer joins Monday"
- Decisions: Any blockers? (No) Ship to staging? (Yes!)

### Afternoon (Polish & Docs)

**Backend engineer:**
- [ ] Write API documentation (Swagger.yaml) ← Document all endpoints
- [ ] Create README for new developers
- [ ] Profile code (time: cold start, latency, memory)
- [ ] Any bugs? Fix them before EOD

**You:**
- [ ] Create onboarding slides (10 slides max)
- [ ] Record 5-minute video walkthrough of codebase structure
- [ ] Email frontend engineer: "Here's the architecture, start with React setup"

**Success Criteria:**
- [ ] `/api/v1/schools/{schoolId}/students` works end-to-end
- [ ] Code deployed to Cloud Run staging (separate from prod)
- [ ] Zero bugs reported
- [ ] Documentation complete

**Code committed:** `docs: Add API documentation + README`

---

## DAY 5: FRIDAY, APRIL 19

### Morning (Demo & Retrospective)

**Demo (30 mins):**
- [ ] Show `/health` endpoint returns status
- [ ] Show Student CRUD working (create, list, get)
- [ ] Show API docs (Swagger)
- [ ] Show Cloud Run dashboard
- [ ] Show test coverage (8 tests, 80%+)

**Retrospective (15 mins):**
- What went well? (Hiring was smooth, GCP setup easy)
- What was hard? (Firestore learning curve)
- What do we improve? (Need clearer error messages)

### Afternoon (Planning & Celebrate)

**Week 2 Planning (30 mins):**
- [ ] Confirm backend engineer continues
- [ ] Brief frontend engineer on Week 2 plan
- [ ] Finalize MVP scope (all 8 modules, 24 weeks)
- [ ] Set Week 2 goals: Attendance API ready

**Celebrate! 🎉**
- [ ] End-of-week team call (15 mins)
- [ ] Share wins: "First API live, tests passing, 0 bugs"
- [ ] Thank engineer for hard work
- [ ] Recap: 4 weeks until Attendance module complete

---

## SUCCESS METRICS FOR WEEK 1

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Code Quality** | 80%+ test coverage | TBD | ✓/✗ |
| **Performance** | API latency <200ms | TBD | ✓/✗ |
| **Uptime** | 100% (no outages) | TBD | ✓/✗ |
| **Documentation** | API docs complete | TBD | ✓/✗ |
| **Team** | Backend engineer productive | TBD | ✓/✗ |
| **Deployment** | Code on Cloud Run | TBD | ✓/✗ |
| **Customer** | First pilot school interest email sent | TBD | ✓/✗ |

---

## WEEK 2 PREVIEW

**Goal:** Student + Attendance API ready (both modules ~30% done)

**Monday:**
- [ ] Frontend engineer starts
- [ ] Attendance API design review
- [ ] React boilerplate created

**Tuesday-Thursday:**
- Backend: Build Attendance mark + sync API
- Frontend: Build StudentForm + AttendanceWidget
- You: Reach out to 5 potential pilot schools

**Friday:**
- Demo: Create student, mark attendance, see it on web app
- Retrospective

---

## RESOURCES TO SEND DAY 1

Share these links with backend engineer on Day 1:

1. **GCP Documentation**
   - Cloud Run: https://cloud.google.com/run/docs
   - Firestore: https://firebase.google.com/docs/firestore/quickstart
   - BigQuery: https://cloud.google.com/bigquery/docs/quickstarts

2. **Code Style**
   - ESLint config: https://eslint.org/docs/user-guide/getting-started
   - Prettier: https://prettier.io/docs/en/index.html

3. **Testing**
   - Jest: https://jestjs.io/docs/getting-started
   - Supertest: https://github.com/visionmedia/supertest

4. **Your Docs**
   - Pan-India_School_ERP_Complete_Plan.md (business context)
   - Technical_Architecture_Setup.md (architecture)
   - 24Week_Sprint_Roadmap.md (timeline)

5. **Firestore Emulator**
   - https://firebase.google.com/docs/emulator-suite/install_and_configure

---

## DAILY CHECKLIST TEMPLATE (Print & Post)

### Monday
- [ ] Team meeting (architecture overview)
- [ ] Engineer: Clone repo, run locally
- [ ] You: Email first pilot school
- [ ] **EOD:** `/health` endpoint working

### Tuesday
- [ ] Architecture deep dive
- [ ] Engineer: Build Student CRUD API
- [ ] You: Deploy to Cloud Run
- [ ] **EOD:** CI/CD pipeline working

### Wednesday
- [ ] Security & Monitoring review
- [ ] Engineer: Add auth, write tests
- [ ] You: Set up monitoring alerts
- [ ] **EOD:** All endpoints authenticated

### Thursday
- [ ] Code review + planning
- [ ] Engineer: Write docs
- [ ] You: Onboard frontend engineer
- [ ] **EOD:** Zero bugs, ready to ship

### Friday
- [ ] Demo to team
- [ ] Retrospective
- [ ] Plan Week 2
- [ ] **EOD:** Celebrate! 🎉

---

## EMERGENCY NUMBERS (If Blocked)

**GCP Issues:** Google Cloud Support (check your plan)  
**Git Issues:** GitHub Support docs  
**Firebase Issues:** Firebase Slack community  
**Your Co-founder:** (add your phone)  

---

**Status:** Week 1 = Foundation. You're not coding the product yet; you're setting up the factory that will build it.

**Next milestone:** By end of Week 2, you have Student + Attendance APIs working together. Real feature!

Good luck! 💪

