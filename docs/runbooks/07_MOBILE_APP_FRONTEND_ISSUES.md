# Mobile App Frontend Issues Runbook

**Status:** ACTIVE  
**Last Updated:** April 10, 2026  
**Maintained By:** Frontend Agent  
**Audience:** Support team, School IT, App users

---

## Quick Diagnosis

**"App crashes on startup"**
→ Check: Cache clear (Section 1.1), Version check (Section 1.2)

**"Login fails / shows blank screen"**
→ Check: Network connectivity (Section 2.1), Auth status (Section 2.2)

**"Grades/attendance data not updating"**
→ Check: Sync status (Section 3.1), Offline mode (Section 3.2)

**"App is running slow / laggy"**
→ Check: Memory/battery usage (Section 4.1), Offline data size (Section 4.2)

**"Data disappeared after reopening app"**
→ Check: Offline cache (Section 3.3), Unexpected logout (Section 2.3)

---

## Section 1: App Installation & Startup

### 1.1 Clear Cache (Common Fix)

**Most issues resolve after cache clear:**

**iOS:**
```
1. Settings → General → iPhone Storage → SchoolERP
2. Tap "Offload App" (keeps data) or "Delete App" (removes everything)
3. Reinstall from App Store
4. Log in again
```

**Android:**
```
1. Settings → Apps → SchoolERP
2. Storage → Clear Cache (keeps data) or Clear Storage (removes everything)
3. Restart app
```

**Note:** After clear cache, you'll need to re-log in

### 1.2 Check App Version

**Is app up-to-date?**

```
iOS:
1. App Store → Search "SchoolERP"
2. If "Update" button shows → Update required
3. If "Open" button shows → Already latest

Android:
1. Google Play → Search "SchoolERP"
2. If "Update" button shows → Update available
3. If "Open" button shows → Already latest
```

**If old version (>2 weeks old):**
```
❌ ISSUE: Old versions may not work with new backend APIs
✓ ACTION: Update from store immediately

How to force update:
├─ iOS: Delete app + reinstall from App Store
├─ Android: Play Store > SchoolERP > Update
``` 

### 1.3 Crash on Startup

**If app crashes immediately after opening:**

**Symptom: "App opens then closes immediately"**

```
Checklist:
1. Clear cache (see 1.1)
2. Restart phone
3. Update app (see 1.2)
4. Reinstall app completely:
   ├─ Delete app
   ├─ Restart phone
   └─ Reinstall from store

If still crashing:
└─ Report to support with device details
   ├─ Device: iPhone/Android
   ├─ OS version: iOS 14.5 or Android 11
   └─ App version: Check in settings
```

---

## Section 2: Login & Authentication

### 2.1 Network Connectivity Check

**Is device online?**

```
iOS/Android:
1. Open browser (Chrome/Safari)
2. Visit: www.google.com
3. Can you see Google homepage?

If YES: Internet working
If NO: Fix your WiFi/mobile data first

Troubleshooting network:
├─ WiFi: Settings → WiFi → Forget network → Rejoin
├─ Mobile data: Airplane mode → OFF
└─ Restart phone
```

**App offline mode:**

```
If network is offline but app shows "Loading...":
├─ App can't reach server
├─ Switch to offline mode:
│  └─ Tap settings icon → Offline mode → ON
└─ View cached data from previous session
```

### 2.2 Check Login Status

**Can't log in? Error message says what?**

**Error: "Invalid credentials"**
```
Cause: Wrong email or password
ACTION:
1. Verify email/password (ask parent for hint)
2. If forgotten password:
   └─ Tap "Forgot Password" on login screen
   └─ System sends password reset link via email
3. Check spam folder for reset email
4. Create new password and try again
```

**Error: "Account not found"**
```
Cause: Email not registered in school
ACTION:
1. Verify email is correct
2. Contact school principal to confirm student recordis in system
3. If student record exists, school should send activation email
4. Check spam folder
```

**Error: "Too many login attempts"**
```
Cause: Rate limit hit (5 failed attempts)
ACTION:
1. Wait 15 minutes
2. Try again
3. If system allows: Use "Forgot Password" instead
```

**Error: "Server error" / "Can't reach server"**
```
Cause: Backend temporarily down or network issue
ACTION:
1. Check network connectivity (see 2.1)
2. Wait 2 minutes and retry
3. If persists: Contact support
   └─ Backend team investigating
```

### 2.3 Unexpected Logout

**User logged out without their action:**

```
Common cause: Session timeout or password reset by school

Check:
├─ Did school reset your password? (check email)
├─ Is app version very old? (see 1.2)
├─ Did you use same account on multiple devices?
└─ Is school's network accessible from your location?

Action:
├─ Log in again (if password known)
├─ If can't remember password: Use "Forgot Password" flow
├─ If account disabled by school: Contact principal
```

---

## Section 3: Data Sync & Offline Mode

### 3.1 Check Sync Status

**Is data up-to-date?**

```
In app:
1. Scroll to top (pull-to-refresh)
2. Blue loading indicator appears
3. Wait for data to refresh
4. "Last synced: just now" should appear

If not syncing:
├─ Check network (online?)
├─ Wait 30 seconds
└─ Try again (pull-to-refresh)
```

**Manual sync:**

```
iOS/Android:
1. Tap settings icon (⚙️ in top-right)
2. Tap "Sync Now"
3. Wait for green checkmark ✓
4. Return to main screen data refreshed
```

### 3.2 Offline Mode

**App works offline (no internet needed):**

```
What works offline:
✓ View grades (cached from last sync)
✓ View timetable (cached)
✓ View attendance history (cached)
✓ View announcements (cached)

What doesn't work offline:
✗ Can't log in (first time ever)
✗ Can't submit new information
✗ Can't see data updated by others (only your cached version)

How to activate offline mode:
1. Tap settings (⚙️)
2. Toggle "Offline Mode" ON
3. App switches to local cached data
```

### 3.3 Cached Data

**How cache works:**

```
Every time you view data in app:
├─ Data synced from server
├─ Stored locally on phone
└─ Available offline for 24 hours

Storage used: ~30-50MB (manageable)

Cache expires after:
├─ Grades: 6 hours
├─ Timetable: 24 hours
├─ Attendance: 12 hours
├─ Announcements: 24 hours

When cache expires:
└─ Must reconnect to internet to see fresh data
```

**Clear cache without losing app:**

```
iOS:
1. Settings → General → iPhone Storage → SchoolERP
2. Tap "Offload App" (keeps login)
3. Tap "Reinstall App" (restores from store)

Android:
1. Settings → Apps → SchoolERP
2. Storage → Clear Cache
3. Restart app
```

---

## Section 4: Performance & Battery

### 4.1 App is Slow / Laggy

**Checklist:**

```
1. Close other apps (free up memory)
   └─ Kill unused apps from background

2. Check available storage
   └─ Settings → Storage
   └─ If <1GB free: Delete photos/videos
   
3. Restart phone
   └─ Power off → Wait 10 seconds → Power on
   
4. Check app version (old versions slower)
   └─ Update from App Store/Play Store
   
5. Check internet speed
   └─ Open browser, test speed on speedtest.net
   └─ Should be >5 Mbps for smooth loading
```

### 4.2 High Battery Drain

**If battery drains quickly:**

```
Normal battery impact:
├─ Active use (grades, attendance entry): 5-10% per hour
├─ Idle with app open: 1-2% per hour
└─ Offline mode: 0% (no network activity)

If draining >15% per hour:
1. Close app and restart (may have background sync issue)
2. Check background app settings:
   └─ iOS: Settings → Battery
   └─ Android: Settings → Battery → Battery Saver
3. Turn off location tracking (if enabled):
   └─ App menu → Settings → Location → OFF
4. Update app (old versions less optimized)
```

### 4.3 Storage Usage

**App size breakdown:**

```
Typical usage:
├─ App binary: 142 MB (iOS) / 52 MB (Android)
├─ Cached data: 30-50 MB
├─ Offline data: 20-30 MB
└─ Total: ~200 MB

If using >500 MB:
1. Clear cache (see 3.3)
2. Clear offline data:
   └─ App settings → Storage → Clear Offline Data
3. Review old downloads (photos, documents)
```

---

## Section 5: UI/Display Issues

### 5.1 Blank Screen or "Loading..."

**If app shows nothing for >10 seconds:**

```
Checklist:
1. Check network connectivity
   └─ Can you open browser? Load Google?
   
2. Wait longer (first load can be slow)
   └─ Give it 30 seconds if on slow network
   
3. Pull-to-refresh (force reload)
   └─ Scroll up and hold until blue spinner
   
4. Restart app
   └─ Close completely, reopen
   
5. If still blank:
   └─ Check app logs
   └─ Report to support with:
      ├─ Device type (iPhone/Android)
      ├─ App version
      └─ Time issue started
```

### 5.2 Text/Language Display Issues

**If text is garbled or in wrong language:**

```
Solution 1: Change app language
1. Settings (⚙️) → Language
2. Select: English, Hindi, Gujarati, etc.
3. App restarts with new language

Solution 2: Update app
1. Old app versions had language bugs
2. Update from App Store/Play Store
3. Settings → Check for update
```

### 5.3 Images Won't Load

**If photos of students, teachers not showing:**

```
Checklist:
1. Check internet (images load over network)
2. Pull-to-refresh to reload page
3. If in offline mode: Images won't work (need internet)
   └─ Toggle offline mode OFF
4. Restart app

If persists:
└─ May be security setting blocking certain file types
└─ Report to support
```

---

## Section 6: Data Entry Issues

### 6.1 Can't Submit Grades/Attendance

**If submit button greyed out or doesn't respond:**

```
Checklist:
1. Verify all required fields filled
   └─ Different entry types have different fields
   └─ Check help for required fields
   
2. Check data format
   └─ Grades should be 0-100 (not letters)
   └─ Attendance should be "Present" or "Absent"
   
3. Check network (submission requires internet)
   └─ Must be online to submit
   
4. Try again after 5 seconds
   └─ May be processing
```

### 6.2 "Submit Error" Message

**Common error messages:**

| Error | Meaning | Fix |
|-------|---------|-----|
| "Network error" | Can't reach server | Check WiFi/mobile data |
| "Permission denied" | Not authorized to edit | Contact principal |
| "Invalid value" | Data format wrong | Check format (grade 0-100) |
| "Server error" | Backend issue | Try in 5 minutes |

---

## Section 7: Specific Feature Issues

### 7.1 Grades Feature

**Issue: "Can't see my grades"**
```
Checklist:
1. Grades only visible if loaded by school
2. Check if dates show (e.g., "Grades for April 2026")
3. If no dates: School hasn't uploaded grades yet
4. Contact school to upload grades

Issue: "Grades seem incorrect"
1. Double-check calculation locally
2. Contact teacher/school
3. Grades are read-only (can't edit from app)
```

**Issue: "Grades showing old data"**
```
Solution:
1. Pull-to-refresh (top of screen)
2. Wait for data to reload
3. Close app and reopen
4. If still old: Data cached, will refresh in 6 hours
```

### 7.2 Timetable Feature

**Issue: "Timetable is blank"**
```
Checklist:
1. Check date selected (Are you viewing today?)
2. Select different day (Try Monday)
3. If week view: Swipe between weeks
4. If still blank: School hasn't published timetable
5. Contact principal
```

**Issue: "Timetable shows conflicts"**
```
This shouldn't happen (server validates).
If you see this:
1. Note specific conflict (which periods)
2. Report to support
3. Backend team will investigate/fix
```

### 7.3 Attendance Feature

**Issue: "Attendance not updating in real-time"**
```
Normal behavior:
├─ Attendance marks when roll call submitted
├─ Visible immediately in app (refreshed locally)
├─ Sync to server in background
└─ Visible in school admin within 1 minute

This is working as designed.
```

**Issue: "I'm marked absent but I was present"**
```
Action:
1. Don't edit from app (read-only)
2. Contact teacher/principal immediately
3. Provide:
   ├─ Date
   ├─ Time (period)
   ├─ Your name
4. Teacher will fix manually in admin panel
```

---

## Section 8: Data Privacy & Security

### 8.1 App Permissions

**Why app asks for permissions:**

```
Location: To show nearby campus buildings (optional)
├─ Allow: Help with campus navigation
└─ Deny: No impact, just won't show location features

Contacts: To quickly call/message school (optional)
├─ Allow: Faster communication with school
└─ Deny: No impact, can still manually enter phone

Camera: For optional photo uploads (future feature)
├─ Allow: Enables photo feature when available
└─ Deny: No impact for now
```

### 8.2 Account Security

**Protecting your account:**

```
✓ DO:
├─ Use strong password (>8 chars, mixed case, numbers)
├─ Don't share password with anyone
├─ Log out after each use on shared phones
├─ Update app regularly (security patches)

✗ DON'T:
├─ Use same password as other apps
├─ Tell anyone your password
├─ Use public WiFi for sensitive tasks
├─ Download app from unofficial source
```

### 8.3 Logout

**Log out from app:**

```
1. Tap settings (⚙️)
2. Scroll down
3. Tap "Logout"
4. Confirm

After logout:
└─ All local data cleared (for security)
└─ Must log in again to use app
```

---

## Section 9: Contacts & Escalation

| Issue | Contact | Response Time |
|-------|---------|---|
| App crashes | Support chat | 30 min |
| Login not working | Support chat | 15 min |
| Data not syncing | Support chat | 30 min |
| Data incorrect | School principal | 1-2 days |
| Performance issue | Frontend Agent | 2 hours |
| Security concern | Lead Architect | Immediate |

**Support Chat:** In-app menu → Help → Chat with support

---

## FAQ

**Q: Why does app keep logging me out?**
A: Server session expires after 7 days. Log in again. Longer session time coming in future version.

**Q: Can I use app on multiple devices?**
A: Yes, same account on up to 3 devices. If 4th device: Automatic logout on oldest device.

**Q: Does app work internationally?**
A: Yes, works anywhere with internet. Designed for India, adapted for global use.

**Q: Why is offline mode so limited?**
A: Offline data is read-only for security. Can't accidentally submit wrong data. Once online, full functionality restored.

**Q: How do I report a bug?**
A: Settings → About → Send Feedback. Describe issue and steps to reproduce. Screenshots helpful.

**Q: Can I delete my account?**
A: Account managed by school. Contact principal for deletion. Data retained per school policy.

