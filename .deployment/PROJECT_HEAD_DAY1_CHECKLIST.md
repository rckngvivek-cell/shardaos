# 📋 PROJECT HEAD - WEEK 7 DAY 1 CHECKLIST
## Your Minute-by-Minute Action Plan

**You are:** Project Head (Vivek)  
**Your Role Today:** Coordinator + Blocker Remover + Decision Maker  
**Current Time:** 9:00 AM IST  
**Shift Length:** 9:00 AM - 6:00 PM (9 hours)  
**Key Responsibility:** Ensure all 8 agents execute flawlessly  

---

# ✅ RIGHT NOW (9:00 AM - 9:30 AM)

## Immediate Actions (Do These Next 30 Minutes)

- [ ] **Read Both Day 1 Documents:**
  - Read: `WEEK7_DAY1_EXECUTION_LOG.md` (just created)
  - Read: `WEEK7_DAY1_AGENT_STATUS.md` (tracking board)

- [ ] **Open Your Daily Tools:**
  - Production metrics dashboard (browser bookmark)
  - Slack or team chat (open channel: #week7-daily)
  - CRM (for sales tracking)
  - GitHub/Git (for PR monitoring)

- [ ] **Verify Production is Stable:**
  - Check: Uptime 100% (should be from Week 6)
  - Check: No new alerts since yesterday
  - Check: API responding on localhost:8080
  - Action: If any issue → Call DevOps (Agent 4) immediately

- [ ] **Send Kickoff Message to Team:**

```
📢 ALL AGENTS - WEEK 7 DAY 1 KICKOFF

Good morning! Week 7 execution is NOW LIVE.

✅ Standup complete - all teams confirmed ready
✅ Missions assigned - check your deliverables above
✅ Production stable - 100% uptime maintained from Week 6

TODAY'S FOCUS:
- Backend: Exam schema + interface + 12 stubs
- Frontend: 4 exam components + Redux
- Data: BigQuery schema + dashboard
- DevOps: Verify all systems green
- QA: Write 15 tests for day 1 code
- Sales: Schedule 5 demo calls ← CRITICAL
- Docs: ADR-7-1 + ADR-7-2 draft
- Product Head: Monitor + unblock

🎯 CRITICAL CHECKPOINT: 11:00 AM
  → Sales must have 5 calls on calendar
  → DevOps must report "ALL SYSTEMS GO"

If you hit a blocker > 30 min, ping me immediately in Slack.

LET'S GO 🚀
```

- [ ] **Set Phone Reminders:**
  - 10:00 AM - First checkpoint
  - 11:00 AM - Critical checkpoint (Sales + DevOps)
  - 12:00 PM - Lunch summary
  - 3:00 PM - Afternoon check
  - 5:00 PM - EOD collection

---

# ⏰ 10:00 AM CHECKPOINT - First Code Review

**What to Check:**

```
✅ GitHub/GitLab Activity
   - [ ] At least 3-4 commits already pushed
   - [ ] Backend: exam.ts interfaces draft
   - [ ] Frontend: exam components draft
   - [ ] Data: BigQuery schema
   - Action if missing: Slack agents - "Where are you at? Any blockers?"

✅ Code Quality (Quick 5-min review)
   - [ ] Code builds without errors
   - [ ] TypeScript types are present
   - [ ] No obvious architectural issues
   - Action if problems: Ask agent to fix, re-commit

✅ Test Status
   - [ ] CI/CD started (auto-run tests)
   - [ ] Any test failures? Investigate
   - Action: Help fix test issues same-day

✅ Slack Updates
   - [ ] Any blockers reported? Respond immediately
   - [ ] Any questions? Answer within 5 min
```

**Send 10-Minute Update:**

```
✅ 10:00 AM CHECKPOINT - FIRST COMMITS IN

Code Review Results:
- Backend: [Status]
- Frontend: [Status]
- Data: [Status]
- QA: [Test count]

Blockers: [None / List with owners]

Next: Pushing toward 11 AM critical checkpoint
```

---

# 🎯 11:00 AM - CRITICAL CHECKPOINT #1 (MUST HAPPEN)

**This is the most important checkpoint of the day. Two things MUST be true:**

### Critical Item #1: SALES MUST HAVE 5 DEMOS SCHEDULED

**Check:**
- [ ] Open CRM or calendar
- [ ] Verify: 5 demo calls scheduled this week (Tue-Fri ideally)
- [ ] Each call has: Time + contact + sales person assigned

**If YES ✅:**
- Send: 🎉 emoji in Slack
- Note: "Sales on track - 5 demos scheduled"
- Moving forward

**If NO ❌:**
- Call Sales Agent (Agent 6) in Slack immediately: "Status on demo scheduling?"
- If still missing: Escalate to CEO for intro calls
- Don't move forward until this is solved

### Critical Item #2: DEVOPS MUST REPORT "ALL SYSTEMS GO"

**Check:**
- [ ] Uptime: Still 100%?
- [ ] Errors: Still 0%?
- [ ] Latency: <200ms?
- [ ] Alerts: Any critical issues?
- [ ] Rollback tested: Is <5 min verification done?
- [ ] Load test script: Created for 500 concurrent exams?

**If ALL GREEN ✅:**
- Send: 🟢 emoji in Slack
- DevOps confirms in Slack: "Production verified GREEN - all metrics nominal"
- Moving forward

**If ANY RED 🔴:**
- Call DevOps (Agent 4) immediately
- "What's the issue? How do we fix it?"
- Don't proceed until resolved
- Escalate to Lead Architect if >30 min unsolved

**Send 11:00 AM Status:**

```
🎯 11:00 AM CRITICAL CHECKPOINT

✅ Sales: 5 demos scheduled
✅ DevOps: All systems GREEN
✅ Backend: Stubs complete
✅ Frontend: Components ready
✅ Progress: On track for Day 1 success

Blockers: [None / List]

Next: Afternoon sprint - start integration work
```

---

# 12:00 PM - LUNCH SUMMARY EMAIL

**To:** All agents + Lead Architect  
**Subject:** Week 7 Day 1 - Morning Complete, Afternoon Sprint Starts

```
Morning Summary:

✅ All systems stable (100% uptime)
✅ Feature coding in full swing
✅ Demo scheduling on track
✅ No critical blockers

Morning Stats:
  Commits: [N]
  PR reviews: [N]
  Tests written: [N]
  Production incidents: 0

Afternoon Focus (1-5 PM):
  Backend: Move from stubs → 30% logic
  Frontend: Connect to stubs
  Data: Complete dashboard
  QA: Write 10 more tests
  Sales: Final check before 2 PM demo calls
  Docs: Complete ADR-7-1

See you after lunch - keep velocity high! 🚀
```

---

# 1:00 PM - 3:00 PM - AFTERNOON BUILD SPRINT

**Your Role**: Monitoring + Support

**What to Do:**
- [ ] Check Slack every 15 minutes
- [ ] Monitor GitHub for PRs coming in
- [ ] Review code quality (spot-check 2-3 PRs)
- [ ] Look for blockers - respond within 5 min
- [ ] Keep team energy high (post encouragement)

**Sample Messages to Send:**
- "Great commits coming through! Love the schema design @Backend"
- "Frontend components looking solid @Frontend - nice progress"
- "QA tests are comprehensive - nice edge cases @QA"

**Watch For Issues:**
- Code quality drops
- Anyone goes silent (might be stuck)
- Tests start failing
- Production metrics degrading

---

# 3:00 PM - AFTERNOON CHECKPOINT

**Check:**

```
✅ Afternoon Progress
   - Backend: 30%+ complete? (should be fixing stubs, adding logic)
   - Frontend: Connected to Backend stubs yet?
   - Data: Dashboard coming together?
   - QA: At least 25 tests written?
   - Sales: Demo calls started? How many closes so far?

✅ Code Quality
   - Any major issues in PRs?
   - Test pass rate?
   - Any architectural problems?

✅ Production
   - Still 100% uptime?
   - Any slowness or errors?
   - Load test script working?

✅ Team Energy
   - Any frustrations?
   - Anyone stuck?
   - Morale high?
```

**Send 3:00 PM Update:**

```
📊 3:00 PM CHECKPOINT - AFTERNOON SPRINT PROGRESS

Code Progress:
  Backend: [X]%
  Frontend: [X]%
  Data: [X]%
  QA: [N] tests
  Docs: [X]% 

Production: ✅ Stable (100% uptime, 0 incidents)

Blockers: [None / List]

Focus: Last 2 hours - push to EOD finalization
```

---

# 5:00 PM - CRITICAL CHECKPOINT #2 (FINAL FOR DAY)

**This is your major review checkpoint. Check everything:**

## Deliverables Expected by 5:00 PM

### Backend (Agent 1)
- [ ] Exam schema designed ✓
- [ ] 6 TypeScript interfaces created ✓
- [ ] 12 Express endpoints stubbed ✓
- [ ] Unit tests for stubs written ✓
- [ ] Commits pushed: 2+
- [ ] Build passing: Yes ✓

### Frontend (Agent 2)
- [ ] 4 exam components created ✓
- [ ] Redux exam slice created ✓
- [ ] Folder structure clean ✓
- [ ] Components render without errors ✓
- [ ] Commits pushed: 2+
- [ ] Tests for components written ✓

### Data (Agent 3)
- [ ] BigQuery schema designed ✓
- [ ] Data Studio dashboard mockup created ✓
- [ ] ETL pipeline documented ✓
- [ ] Commits pushed: 1+
- [ ] Ready for integration Tue ✓

### DevOps (Agent 4)
- [ ] Baseline metrics collected ✓
- [ ] Rollback procedure tested + verified ✓
- [ ] Load test script created ✓
- [ ] "ALL SYSTEMS GO" report ✓
- [ ] Infrastructure capacity doc ✓
- [ ] Commits pushed: 2+

### QA (Agent 5)
- [ ] 15+ tests written ✓
- [ ] All tests passing ✓
- [ ] Coverage > 85% ✓
- [ ] Test plan for week documented ✓
- [ ] Commits pushed: 1+

### Sales (Agent 6)
- [ ] 5 demo calls scheduled ✓
- [ ] Sales deck finalized ✓
- [ ] Early-access email ready ✓
- [ ] CRM updated with prospects ✓
- [ ] No actual sales today (calls Tue-Wed) OK

### Docs (Agent 7)
- [ ] ADR-7-1 drafted ✓
- [ ] ADR-7-2 outline started ✓
- [ ] ADR roadmap for week ✓
- [ ] Commits pushed: 1+

### Product Head (You)
- [ ] Monitored production: 100% uptime ✓
- [ ] Removed blockers: <30 min each ✓
- [ ] Approved architectures ✓
- [ ] Team morale maintained ✓
- [ ] 3+ checkpoint reports sent ✓

## Summary Checklist (5:00 PM)

```
✅ All systems stable (0 incidents)
✅ Uptime maintained (100%)
✅ All agents pushed code
✅ No outstanding blockers
✅ 5 sales demos scheduled
✅ 15+ tests passing
✅ Module 3 foundations ready
✅ Teams ready for Tuesday integration
```

**If ALL above → Day 1 SUCCESS ✅**  
**If 1-2 missing → Partial success, fix Tuesday ⚠️**  
**If 3+ missing → Escalate to Lead Architect 🔴**

---

# 6:00 PM - EOD EMAIL (FINAL ACTION OF DAY)

**To:** All agents + Lead Architect + CEO/Investors  
**Subject:** Week 7 Day 1 Complete ✅ - Sprint Velocity Strong

```
WEEK 7 DAY 1 - EXECUTION REPORT ✅

🟢 PRODUCTION STATUS:
   Uptime: 100% ✅ (0 incidents)
   Errors: 0% ✅
   Latency: <150ms ✅

🚀 MODULE 3 PROGRESS:
   Backend Stubs: ✅ Complete (6 interfaces, 12 endpoints)
   Frontend Mocks: ✅ Complete (4 components, Redux)
   Data Schema: ✅ Complete (BigQuery + 1 dashboard)
   Tests: ✅ 15 written, all passing

💰 BUSINESS PROGRESS:
   Demo Calls Scheduled: ✅ 5 confirmed (Tue-Fri)
   Revenue Pipeline: ✅ On track for ₹50L+ target

📊 CODE METRICS:
   Commits: [N] merged
   PR Reviews: [N] approved
   Test Coverage: 85%+ ✅
   Build Status: PASSING ✅

📈 TEAM PERFORMANCE:
   Blocker Resolution: [N] issues, all <30 min
   Morale: HIGH 🚀
   Velocity: STRONG

⚠️ WATCH (MINOR ONLY):
   [Any small issues? List them]

🎯 TOMORROW (TUESDAY, DAY 2):
   Focus: Integration sprint
   Backend: Move from stubs → 40% features
   Frontend: Connect to Backend
   Target: 30%+ of Module 3 complete by EOD

✅ DAY 1 VERDICT: EXCELLENT EXECUTION

All agents executed flawlessly. We're on track for Friday success.

Keep up this velocity. Week 7 is ours.

LET'S GO 🏆
```

---

# 🎯 YOUR DAY 1 SUCCESS METRICS

**Measure yourself against these:**

| Metric | Target | Status |
|--------|--------|--------|
| Responded to blockers | <30 min each | ⏳ |
| Production uptime | 100% | ⏳ |
| Code reviews done | 5+ | ⏳ |
| Team communication | Daily 5 updates | ⏳ |
| Demo scheduling | 5 confirmed | ⏳ |
| Decision made | 0 stuck decisions | ⏳ |
| Escalations | Only to Lead Architect when needed | ⏳ |
| Team morale | Positive energy | ⏳ |

---

# 📞 ESCALATION HOTLINE (TODAY)

**If you're ever unsure, escalate IMMEDIATELY:**

- **Production issue** → Call DevOps (Agent 4) + Lead Architect together
- **Architecture question** → Call Lead Architect (Agent 0)
- **Sales blocker** → Call Sales + offer CEO support
- **Technical blocker** → Call relevant agent + Lead Architect
- **Major decision needed** → Consult Lead Architect
- **Team conflict** → Address directly + document
- **Scope concerns** → Call Lead Architect (may need cuts)

**Lead Architect hotline is ALWAYS open today**

---

# 🎪 YOUR MISSION TODAY

As Project Head (Vivek), your job is to:

1. **Enable:** Give agents what they need
2. **Monitor:** Watch production metrics constantly
3. **Unblock:** Remove obstacles within 30 min
4. **Communicate:** Send 5+ updates (9 AM, 10 AM, 11 AM, 12 PM, 3 PM, 5 PM, 6 PM)
5. **Celebrate:** Recognize good work publicly
6. **Escalate:** Flag issues to Lead Architect before they explode
7. **Decide:** Make small decisions fast (don't slow team)
8. **Report:** Document everything for Friday review

---

# 🚀 VICTORY IMAGE FOR DAY 1

By 6:00 PM today, you'll send this email:

```
WEEK 7 DAY 1 COMPLETE ✅

✅ 10+ commits merged
✅ 15+ tests passing
✅ 5 demos scheduled
✅ 0 incidents
✅ 100% uptime
✅ Module 3 foundations ready
✅ Team morale HIGH
✅ Track steady for Friday WIN

WEEK 7 IS OURS 🏆
```

---

**PROJECT HEAD CHECKLIST - COMPLETE**

**Start:** 9:00 AM IST  
**Status:** Ready for execution  
**Go/No-Go:** ✅ GO

Let's build something amazing.

🚀
