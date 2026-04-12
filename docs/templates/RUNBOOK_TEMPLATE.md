# Runbook: [Title]

**Last Updated:** [YYYY-MM-DD]  
**Runbook ID:** RB-XXX  
**Severity Level:** [Critical/High/Medium/Low]  
**Owner:** [Team/Person]  
**Escalation Contact:** [Name - Phone/Slack]

---

## 📋 Purpose

**What is this runbook for?**  
Brief description of when and why this runbook is used.

**When to use this:**
- Trigger condition 1
- Trigger condition 2
- Trigger condition 3

**When NOT to use this:**  
- Situation 1
- Situation 2

---

## ✅ Prerequisites

Before executing this runbook, verify you have:

- [ ] Required access/permissions (list them)
- [ ] Required tools installed (list them)
- [ ] Required documentation available (links)
- [ ] Stakeholders notified (who to notify)
- [ ] Backup procedures verified (if applicable)

**Estimated Duration:** [X minutes]  
**Risk Level:** [Low/Medium/High]

---

## 🔧 Step-by-Step Procedure

### Phase 1: Assessment (2-5 minutes)

**Step 1.1:** [First action]
- Command: `command here`
- Expected output: `expected result`
- ✅ Success: How do you know it worked?
- ❌ Failed: What to do if it fails?

**Step 1.2:** [Second action]
- Command: `command here`
- Expected output: `expected result`
- ✅ Success: How do you know it worked?
- ❌ Failed: What to do if it fails?

### Phase 2: Execution (5-15 minutes)

**Step 2.1:** [Action]
- Command: `command here`
- Expected output: `expected result`
- ⚠️ Important: Any gotchas or warnings?

**Step 2.2:** [Action]
- Command: `command here`
- Expected output: `expected result`
- ⏱️ Timeout: How long to wait?

### Phase 3: Verification (2-5 minutes)

**Step 3.1:** Verify success condition
- Check: `how to verify`
- Expected: `what should we see`
- Pass criteria: `success looks like this`

**Step 3.2:** Rollback if necessary
- Rollback command: `if needed, how to undo`
- Validation: `how to confirm rollback worked`

---

## 🐛 Troubleshooting

### Issue 1: [Common problem]
**Symptoms:** What does the error look like?
```
Error message or log output
```
**Root Cause:** Why does this happen?
**Resolution:**
1. Step 1
2. Step 2
3. Step 3

**Verification:** How to confirm it's fixed?

---

### Issue 2: [Another common problem]
**Symptoms:** What does the error look like?
```
Error message or log output
```
**Root Cause:** Why does this happen?
**Resolution:**
1. Step 1
2. Step 2

---

## 📞 Escalation

**If stuck after 5 minutes:**
- 🔴 Critical: Page on-call immediately
  - On-call Slack: @on-call-devops
  - PagerDuty: [Link]
  - Phone: [Number]

**If stuck after 15 minutes:**
- 🟠 Escalate to Lead Architect + Backend Lead
  - Names: [Team members]
  - Email: [group@company.com]

**If incident ongoing 30+ minutes:**
- 🟡 Activate incident response
  - War room: [Zoom/Slack link]
  - Stakeholders: [Teams to notify]

---

## 📝 Runbook Execution Log

Use this section to track when and who executed this runbook:

| Date | Time | Executed By | Issue | Status | Duration |
|------|------|------------|-------|--------|----------|
| YYYY-MM-DD | HH:MM | [Name] | [Issue] | ✅ Success / ❌ Failed | X min |
| | | | | | |

---

## 📚 Related Documentation

- Related runbook: [RB-XXX]
- Related ADR: [ADR-XXX]
- External docs: [Link]

---

## ✏️ Maintenance Notes

**Last reviewed:** [Date]  
**Review frequency:** Every [X] months  
**Known issues:** List any known gaps

**To update this runbook:**
1. Edit this file
2. Test procedures with actual scenario
3. Update execution log
4. Notify team of changes
