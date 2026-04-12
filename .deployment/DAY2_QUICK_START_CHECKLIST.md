# ✅ WEEK 7 DAY 2 - QUICK START CHECKLIST
## For Project Head + All 8 Team Members

**Read this first. Takes 2 minutes.**

---

# 🎯 YOUR ROLE (Project Head)

**Do these 5 things TODAY:**

```
[ ] 1. Send briefing documents to 8 team members
      └─ Point them to: .deployment/AGENT*_*_BRIEF.md files

[ ] 2. Run 9:00 AM standup
      └─ Read: .deployment/WEEK7_DAY2_KICKOFF.md aloud

[ ] 3. Monitor progress (every hour)
      └─ Update: .deployment/WEEK7_DAY2_LIVE_TRACKER.md

[ ] 4. Escalate blockers (if anyone stuck >30 min)
      └─ Contact: Lead Architect (Agent 0)

[ ] 5. Collect reports at 5 PM
      └─ Fill: .deployment/DAY2_FINAL_REPORT_TEMPLATE.md
```

**Expected Time:** 30 minutes of active management throughout day

---

# 🎯 EACH TEAM MEMBER'S ROLE

## Agent 0: Lead Architect
```
YOUR MISSION: Approve all Code Reviews

[ ] 1. Read: .deployment/AGENT0_LEAD_ARCHITECT_BRIEF.md
[ ] 2. Open GitHub + PR review system
[ ] 3. Wait for Backend PR (~3 PM)
[ ] 4. Review + approve within 2 hours
[ ] 5. Repeat for Frontend PR (~3:30 PM)
[ ] 6. Report status to Project Head at 5 PM

DELIVERABLE: All PRs approved + production stable
```

## Agent 1: Backend Engineer
```
YOUR MISSION: Implement 4 Real Endpoints

[ ] 1. Read: .deployment/AGENT1_BACKEND_ENGINEER_BRIEF.md
[ ] 2. Start Firestore client setup (9:30 AM)
[ ] 3. Implement POST /api/v1/exams (create)
[ ] 4. Implement GET /api/v1/exams (list)
[ ] 5. Implement POST /api/v1/submissions (submit)
[ ] 6. Implement GET /api/v1/results (results)
[ ] 7. Write 12 unit tests
[ ] 8. Push PR by 3:00 PM
[ ] 9. Report status to Project Head at 5 PM

DELIVERABLE: 4 working endpoints + 12 tests
```

## Agent 2: Frontend Engineer
```
YOUR MISSION: Integrate 3 Components to Backend

[ ] 1. Read: .deployment/AGENT2_FRONTEND_ENGINEER_BRIEF.md
[ ] 2. Create examApi.ts (RTK Query/axios)
[ ] 3. Create examSlice.ts (Redux)
[ ] 4. Connect ExamList → GET /exams
[ ] 5. Connect ExamAnswerer → POST /submissions
[ ] 6. Connect ResultsViewer → GET /results
[ ] 7. Write 18+ component tests
[ ] 8. Push PR by 3:30 PM
[ ] 9. Report status to Project Head at 5 PM

DELIVERABLE: 3 integrated components + 18 tests
```

## Agent 3: Data Engineer
```
YOUR MISSION: Stream Data to Analytics

[ ] 1. Read: .deployment/AGENT3_DATA_ENGINEER_BRIEF.md
[ ] 2. Create BigQuery datasets (10:00 AM)
[ ] 3. Run DDL scripts for 5 tables
[ ] 4. Create Pub/Sub topics (11:00 AM)
[ ] 5. Deploy Firestore triggers (1:00 PM)
[ ] 6. Deploy Dataflow pipeline (2:00 PM)
[ ] 7. Create Data Studio dashboards (3:00 PM)
[ ] 8. Verify end-to-end latency (4:00 PM)
[ ] 9. Report status to Project Head at 5 PM

DELIVERABLE: Live data streaming to BigQuery
```

## Agent 4: DevOps Engineer
```
YOUR MISSION: Maintain SLA + Deploy Staging

[ ] 1. Read: .deployment/AGENT4_DEVOPS_ENGINEER_BRIEF.md
[ ] 2. Start production monitoring (9:30 AM - continuous)
[ ] 3. Check uptime every 30 minutes
[ ] 4. Prepare staging deployment (~1:00 PM)
[ ] 5. Deploy Phase 2 to staging (3:30 PM)
[ ] 6. Run smoke tests (4:00 PM)
[ ] 7. Verify infrastructure (4:30 PM)
[ ] 8. Report status to Project Head at 5 PM

DELIVERABLE: 99.95%+ uptime + staging live
```

## Agent 5: QA Engineer
```
YOUR MISSION: Write + Run 80+ Tests

[ ] 1. Read: .deployment/AGENT5_QA_ENGINEER_BRIEF.md
[ ] 2. Write 5 integration tests (10:00 AM)
[ ] 3. Update 10 component tests (1:00 PM)
[ ] 4. Create 1 E2E test (3:00 PM)
[ ] 5. Run regression suite (4:00 PM)
[ ] 6. Check coverage (92%+ target)
[ ] 7. Push PR with all tests (4:30 PM)
[ ] 8. Report status to Project Head at 5 PM

DELIVERABLE: 80+ tests, 92%+ coverage
```

## Agent 6: Sales Manager
```
YOUR MISSION: Close 1-2 Schools

[ ] 1. Read: .deployment/AGENT6_SALES_PRODUCT_BRIEF.md
[ ] 2. Confirm attendees for 2 PM call (by 12 PM)
[ ] 3. Confirm attendees for 3 PM call (by 12 PM)
[ ] 4. Run Demo Call #1 @ 2:00 PM
[ ] 5. Log outcome in CRM (2:15 PM)
[ ] 6. Send contract if closed (2:20 PM)
[ ] 7. Run Demo Call #2 @ 3:00 PM
[ ] 8. Log outcome in CRM (3:15 PM)
[ ] 9. Send contract if closed (3:20 PM)
[ ] 10. Report status to Project Head at 5 PM

DELIVERABLE: ₹10-15L revenue locked
```

## Agent 7: Documentation Engineer
```
YOUR MISSION: Write 2 ADRs + 4 Runbooks

[ ] 1. Read: .deployment/AGENT7_DOCUMENTATION_BRIEF.md
[ ] 2. Write ADR-7-3 (Analytics Pipeline) (10:00 AM)
[ ] 3. Write ADR-7-4 (Grading Algorithm) (11:00 AM)
[ ] 4. Write Runbook 1 (Implementation) (1:00 PM)
[ ] 5. Write Runbook 2 (BigQuery) (2:00 PM)
[ ] 6. Write Runbook 3 (Staging) (3:00 PM)
[ ] 7. Write Runbook 4 (Troubleshooting) (4:00 PM)
[ ] 8. Push all docs to repo (4:30 PM)
[ ] 9. Report status to Project Head at 5 PM

DELIVERABLE: 2 ADRs + 4 runbooks merged
```

---

# 📅 TIMELINE (Every Agent Follows This)

```
9:00 AM   ← Standup (Project Head reads KICKOFF)
9:30 AM   ← All agents START their missions
10:30 AM  ← First checkpoint (30% work done?)
11:30 AM  ← Second checkpoint (50% work done?)
12:00 PM  ← LUNCH (1 hour)
1:00 PM   ← Afternoon sprint starts
2:00 PM   ← Sales Call #1 (Agent 6 on call)
3:00 PM   ← Sales Call #2 (Agent 6 on call)
3:30 PM   ← Code review phase starts
4:00 PM   ← Merge + verification phase
5:00 PM   ← EOD Reports collected
```

---

# 📊 SUCCESS METRICS (Check at 5 PM)

**Target: 7-8 of these pass**

```
Agent 0 (Lead Architect)
  ✅ All PRs reviewed + approved same-day
  ✅ 0 production incidents
  ✅ 99.95%+ uptime maintained

Agent 1 (Backend)
  ✅ 4 endpoints implemented (real code)
  ✅ 12 unit tests passing
  ✅ PR merged by 3:30 PM

Agent 2 (Frontend)
  ✅ 3 components integrated
  ✅ 18+ tests passing
  ✅ PR merged by 4:00 PM

Agent 3 (Data)
  ✅ BigQuery tables live
  ✅ Pub/Sub streaming
  ✅ Data Studio dashboards working

Agent 4 (DevOps)
  ✅ 99.95%+ uptime
  ✅ 0 incidents
  ✅ Staging deployed + tested

Agent 5 (QA)
  ✅ 80+ tests total
  ✅ 92%+ coverage
  ✅ All tests passing

Agent 6 (Sales)
  ✅ 1-2 schools closed
  ✅ ₹10-15L revenue locked
  ✅ Contracts signed

Agent 7 (Docs)
  ✅ 2 ADRs written
  ✅ 4 runbooks merged
  ✅ All docs in repo
```

---

# 🚀 HOW TO LAUNCH TODAY

## For Project Head

**5 minutes before 9:00 AM:**
1. Send Slack message to #day2-execution
2. Message all 8 agents: "Briefs are in .deployment/ - read yours now"
3. Open Zoom/Teams for standup

**At 9:00 AM:**
1. Dial in all 8 agents
2. Open: `.deployment/WEEK7_DAY2_KICKOFF.md`
3. Read the "DAY 2 MISSION STATEMENT" section (5 min)
4. Get each agent's 1-word status: "Ready?"
5. Say: "Execution begins. Let's go!" 🚀

**During Day (9:30 AM - 5:00 PM):**
1. Monitor: `.deployment/WEEK7_DAY2_LIVE_TRACKER.md`
2. Update every hour with agent status
3. Watch for RED FLAGS (blockers)
4. If agent stuck >30 min → escalate to Lead Architect

**At 5:00 PM:**
1. Ask each agent:
   - "What's your final status?"
   - "Did you complete your mission?"
   - "Any blockers for tomorrow?"
2. Fill in: `DAY2_FINAL_REPORT_TEMPLATE.md`
3. Copy-paste to email + send to yourself

---

# 📧 HOW TO EMAIL REPORT

**When you have final report filled in:**

1. **Copy the full content**
2. **Open Gmail/Outlook**
3. **New Email**
4. **Paste content**
5. **Send to yourself**

**Example subject line:**
```
Day 2 Execution Report - [Date] - [Status: Complete/Partial/Issues]
```

---

# 🎯 THE ABSOLUTE MOST IMPORTANT THING

**Read this before standup:**

```
"This isn't about me (Claude) executing tasks.

This is about YOUR TEAM executing Day 2.

I've given your team:
- Detailed role briefs
- Clear success criteria
- Timeline
- Dependencies
- Monitoring tools

NOW YOUR TEAM MUST DO THE WORK.

Your job: Coordinate them, remove blockers, celebrate wins."
```

---

# ✅ PRE-EXECUTION CHECKLIST

**Before 9:00 AM, make sure this is DONE:**

```
[ ] All 14 documents exist in .deployment/
[ ] Each of 8 team members has their briefing
[ ] Slack channel #day2-execution created
[ ] 9:00 AM standup scheduled in calendar
[ ] Zoom/Teams link tested
[ ] Production monitoring dashboard open (DevOps)
[ ] Firestore emulator ready (Backend)
[ ] GitHub access verified (all agents)
[ ] Sales confirmed attendees for calls
[ ] CRM system accessible (Sales)
[ ] GCP project access confirmed (Data)
[ ] You've read this entire checklist
```

**If even ONE ☐ is unchecked → Fix it before 9 AM**

---

# 📞 EMERGENCY CONTACTS (During Day)

**If something breaks:**
- **Code issue?** → Contact Agent 1 (Backend) or Agent 2 (Frontend)
- **Infrastructure issue?** → Contact Agent 4 (DevOps)
- **Test failure?** → Contact Agent 5 (QA)
- **Sales issue?** → Contact Agent 6 (Sales)
- **Architectural question?** → Contact Agent 0 (Lead Architect)
- **Everything is broken?** → You (Project Head) make the call

---

# 🎪 FINAL THOUGHT

**This is a game.**

Your team wins if **7-8 agents complete their missions** by 5 PM.

Your team loses if **5 or fewer agents complete missions**.

**Today determines if Week 7 succeeds or needs pivoting.**

**Let's win.** 💪

---

**START AT 9:00 AM SHARP**

**EXECUTION BEGINS NOW**

🚀
