# Mobile App Release Runbook

**Version:** 1.0  
**Status:** OPERATIONAL (Week 5)  
**Last Updated:** April 14, 2026  
**On-Call:** DevOps Agent  
**Escalation:** Lead Architect

---

## Overview

This runbook covers iOS and Android app releases through TestFlight (beta) and App Store / Play Store (production).

**Key Points:**
- All releases automated via Fastlane + GitHub Actions
- Manual approval required before production release
- Typical release time: 20-30 minutes (automation) + 1-24 hours (store review)
- Hotfix process available for critical bugs

---

## Release Types

### 1. **Beta Release** (Develop Branch)
- **Trigger:** Merge to `develop` branch
- **Action:** Auto-deploy to TestFlight (iOS) and Play Console internal (Android)
- **Time:** ~20 minutes
- **Audience:** QA + pilot schools (10-50 testers)

### 2. **Production Release** (Git Tag)
- **Trigger:** Create git tag `v1.2.3`
- **Action:** Manual: triggered via GitHub Actions > Run workflow
- **Time:** ~30 minutes (build) + 1-24 hours (App Store review + Play Store auto-approval)
- **Audience:** All users (100k+ when available)

### 3. **Hotfix Release** (Critical Bugs)
- **Trigger:** Create `hotfix/` branch from latest tag
- **Process:** Fix → Merge to main → Create new tag
- **Time:** ~1 hour total
- **Audience:** All users

---

## Pre-Release Checklist (30 minutes before)

### Code Validation
- [ ] All tests passing locally
  ```bash
  cd apps/mobile && npm run test -- --passWithNoTests
  # Expected: PASS
  ```

- [ ] No lint errors
  ```bash
  npm run lint:mobile
  # Expected: 0 errors, 0 warnings
  ```

- [ ] No TypeScript errors
  ```bash
  npm run typecheck:mobile
  # Expected: 0 type errors
  ```

### Version Control
- [ ] Latest code pulled from origin
  ```bash
  git checkout develop && git pull origin develop
  ```

- [ ] No uncommitted changes
  ```bash
  git status
  # Expected: "working tree clean"
  ```

### Environment Setup
- [ ] Fastlane installed locally
  ```bash
  cd apps/mobile && gem list | grep fastlane
  # Expected: fastlane (version 2.x+)
  ```

- [ ] iOS certificates current
  ```bash
  fastlane ios certs
  # Expected: "Certificates are up to date"
  ```

- [ ] Android keystore accessible
  ```bash
  ls -la $ANDROID_KEYSTORE_PATH
  # Expected: keystore file exists
  ```

### Credentials
- [ ] GitHub Secrets configured
  - Visit: https://github.com/YOUR_ORG/school-erp/settings/secrets/actions
  - Verify: APPLE_ID, APPLE_PASSWORD, ANDROID_JSON_KEY present

---

## Beta Release (Automatic)

### Trigger Beta Release

**Automatic (No Action Required):**
1. Merge PR to `develop` branch
2. GitHub Actions workflow triggers automatically
3. Workflow name: `Mobile CI > beta-release`

**Monitor Deployment:**
```bash
# Watch GitHub Actions
# https://github.com/YOUR_ORG/school-erp/actions?query=workflow%3A%22Mobile+CI%22

# Or use CLI
gh run list --workflow=mobile-ci.yml --status=in_progress
```

### Beta Release Workflow Steps

1. **Lint & Test** (~5 min)
   - Run ESLint, TypeScript check, Jest tests
   - Status: ![check] PASS or ![fail] FAIL
   
2. **Build iOS** (~12 min, macOS runner)
   - Sync code signing certificates
   - Build for App Store
   - Generate .ipa file
   
3. **Build Android** (~15 min, Linux runner)
   - Solve dependencies
   - Build via Gradle
   - Generate .aab file

4. **Upload to Beta** (~3 min)
   - Upload to TestFlight (iOS)
   - Upload to Play Console internal testing (Android)
   - Notify QA team via Slack

### After Beta Release

**Email QA Team:**
```
Subject: [BETA] iOS v1.2.3 & Android v1.2.3 available

Hi QA Team,

New mobile app builds ready for testing:
- iOS: TestFlight link
- Android: Play Console Internal Testing link

Build Date: 2026-04-14, 10:30 UTC
Changes since v1.2.2: 
  ✅ SMS notifications fixed
  ✅ Performance improved
  ✅ 5 bugs fixed

Please test on:
- 3 pilot school accounts
- Multiple network conditions (WiFi, 4G, Offline)
- Both landscape and portrait orientation

Report issues to: #qateam Slack channel
```

---

## Production Release (Manual Approval)

### Before Production Release

**Security & QA Sign-Off:**
- [ ] QA team approved beta version (≥3 days testing)
- [ ] No critical bugs reported
- [ ] All PRs merged and reviewed
- [ ] Security audit passed
- [ ] Performance tests passed (p95 <3s startup)
- [ ] Product sign-off (new feature or fix approved)

### Step 1: Bump Version in Code

```bash
# 1. Create feature branch
git checkout -b release/v1.2.3

# 2. Edit version in package.json
vim apps/mobile/package.json
# Change: "version": "1.2.2" → "1.2.3"

# 3. Update CHANGELOG
vim CHANGELOG.md
# Add entry:
## [1.2.3] - 2026-04-15
### Added
- SMS notifications for attendance alerts
### Fixed
- App crash on offline mode
### Changed
- Improved launch time by 500ms

# 4. Commit and push
git add -A
git commit -m "chore: bump version to v1.2.3"
git push origin release/v1.2.3
```

### Step 2: Create Release PR

```bash
# Create PR for version bump
# Title: "Release: v1.2.3"
# Body:
# - [ ] Lead Architect approved
# - [ ] QA sign-off
# - [ ] Changelog updated
# - [ ] No breaking changes
#
# Merge strategy: Squash merge to main
```

**Wait for Approval:**
- Lead Architect reviews version + changelog
- Merge to main when approved
- Branch auto-deletes after merge

### Step 3: Create Git Tag & Release

```bash
# 1. Switch to main and pull latest
git checkout main && git pull origin main

# 2. Create annotated tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# 3. Push tag (triggers production release workflow)
git push origin v1.2.3

# Verify tag pushed
git tag -l v1.2.3
```

### Step 4: Monitor Production Release

**GitHub Actions Workflow:**
- Visit: https://github.com/YOUR_ORG/school-erp/actions
- Find: `Mobile CI > production-release` workflow
- Status: In Progress → Complete

**Build Phase (~30 min):**
```
✓ Checkout code (1 min)
✓ Lint & Test (5 min)
✓ Build iOS (12 min)
  └─ Check: .ipa file generated
✓ Build Android (15 min)
  └─ Check: .aab file generated
```

**Upload Phase (~3 min):**
```
✓ Upload iOS to App Store
  └─ Review needed: 24-48 hours (Apple review process)
✓ Upload Android to Play Store
  └─ Auto-published: Usually within 1 hour
```

**Monitor Uploads:**
```bash
# Watch Actions logs in real-time
gh run watch --exit-status

# Or check manually
# iOS: https://appstoreconnect.apple.com
# Android: https://play.google.com/console
```

### Step 5: Verify Release

**Once Stores Approve:**

```bash
# iOS - Check App Store
# URL: https://apps.apple.com/in/app/school-erp/id1234567890
# Expected: v1.2.3 visible

# Android - Check Play Store  
# URL: https://play.google.com/store/apps/details?id=com.schoolerp.app
# Expected: v1.2.3 visible

# Monitor crash rates (first hour)
# Dashboard: https://console.firebase.google.com/project/school-erp/crashlytics
# Expected: <1% crash rate vs. baseline
```

**Team Notification:**
```
Subject: 🚀 [RELEASED] Mobile App v1.2.3

Hi Team,

Mobile app v1.2.3 released to production:
✅ iOS: Published to App Store
✅ Android: Published to Play Store

Release Notes:
- SMS notifications for attendance
- Fixed offline mode crash
- 500ms faster app launch

Metrics (First Hour):
- Installs: 42 (pilot schools)
- Crash Rate: 0.1%
- Avg Rating: 4.8/5

Issues? Contact #production-on-call
```

---

## Hotfix Release (Critical Bugs)

### Trigger Hotfix Process

**Scenario:** Critical bug found in production (e.g., app crash on login)

### Step 1: Create Hotfix Branch

```bash
# Create branch from latest release tag
git checkout -b hotfix/v1.2.4 v1.2.3

# Apply fix(es)
# ... edit files ...

# Test locally
npm run test:mobile

# Commit fix
git commit -m "fix: prevent crash on login screen"

# Push to origin
git push origin hotfix/v1.2.4
```

### Step 2: Fast-Track Review

```bash
# Create PR targeting main
# Title: "[HOTFIX] v1.2.4 - Login crash"
# Priority: CRITICAL
# Mention: @lead-architect

# Lead Architect approves hotfix PR
# Merge directly to main (no develop merge needed)
```

### Step 3: Release

```bash
# Tag and release immediately
git checkout main && git pull
git tag -a v1.2.4 -m "Hotfix: Login crash"
git push origin v1.2.4

# Monitor release (same as production release above)
```

**Affected Users:**
- Only new installs get v1.2.4 immediately
- Existing users prompted to update ~15 min after App Store approval
- Pilot schools get notification in-app: "Critical update available"

---

## Troubleshooting

### Build Failure: "Certificate not found"

**Symptom:**
```
[!] Provisioning profile wasn't properly downloaded.
    Error: Certificate not found
```

**Resolution:**
```bash
cd apps/mobile

# 1. Verify Apple Developer credentials
echo $FASTLANE_USER
# Expected: valid Apple ID

# 2. Sync certificates manually
fastlane ios certs(force: true)

# 3. Retry build
fastlane ios build_for_testing
```

**If it persists:**
- Contact: Apple Developer Support
- Action: Manually revoke + recreate certificate on developer.apple.com

---

### Build Failure: "gradle sync failed"

**Symptom:**
```
FAILURE: Build failed with an exception.
What went wrong:
  Could not resolve all dependencies
```

**Resolution:**
```bash
cd apps/mobile/android

# 1. Clear gradle cache
./gradlew clean

# 2. Update dependencies
./gradlew build --refresh-dependencies

# 3. Retry
cd .. && fastlane android build_apk
```

---

### App Store Rejection: "Needs privacy details"

**Symptom:**
```
Guideline 5.1.1 - Legal

Your app requests user data but does not have a valid privacy policy.
```

**Resolution:**
1. Ensure privacy policy URL configured in App Store Connect
2. Update privacy policy at https://schoolerp.com/privacy
3. Update Fastlane metadata:
   ```ruby
   # fastlane/metadata/en-US/privacy_url.txt
   https://schoolerp.com/privacy
   ```
4. Re-submit build

---

## Monitoring Post-Release

### First Hour Alerts

Monitor these metrics for first 60 minutes after release:

```bash
# Firebase Crashlytics
# Expected: Crash rate <1% of baseline

# Cloud Run metrics
# Expected: Error rate <0.5%, latency <500ms

# Analytics (`school_erp:track_app_version`)
# Expected: Installs detected within 15 min

# Slack #production channel
# Monitor: Any "ERROR" logs from production
```

**If Spike Detected:**
1. Immediately notify #production-on-call
2. Initiate incident response (see next section)
3. Consider rollback if necessary

---

## Rollback Procedure

**If critical issue post-release:**

```bash
# 1. Create rollback branch from previous stable version
git checkout -b rollback/v1.2.2 v1.2.2

# 2. Make tag
git tag -a v1.2.2-rollback -m "Rollback"

# 3. Push (triggers rollback workflow)
git push origin v1.2.2-rollback

# 4. Notify team
# Slack: @channel Rolled back to v1.2.2 due to [issue]
```

**Communication:**
- Users: "Update available - critical stability fix"
- Team: Root cause analysis in postmortem

---

## Release Calendar

```
| Week | Monday | Wednesday | Friday |
|------|--------|-----------|--------|
| *   | Code freeze | Beta on develop | Prod release v1.2.X |
|     | Release planning | QA testing | Store approval pending |
```

---

## Emergency Contacts

- **on-call:** Check #production-on-call Slack
- **DevOps Lead:** @devops-lead
- **Lead Architect:** @lead-architect
- **Escalation:** team-leads@schoolerp.com

---

