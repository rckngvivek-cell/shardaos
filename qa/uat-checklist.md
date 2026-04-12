# QA UAT CHECKLIST - WEEK 6 PRE-LAUNCH

**Date:** April 9-18, 2026  
**QA Lead:** QA Agent  
**Testing Phase:** Pre-Launch Validation  
**Status:** Ready for Execution

---

## PORTAL LOGIN & AUTHENTICATION

### ☐ Portal Login - Email Verification
- **Test Case:** Verify parent can login with valid email credentials
- **Steps:**
  1. Navigate to portal login page
  2. Enter email: parent@school.edu
  3. Enter password: SecurePassword123
  4. Click Login button
- **Expected:** Dashboard displays, session created, welcome message shown
- **Status:** Not Tested
- **Notes:**

### ☐ Portal Login - Invalid Credentials
- **Test Case:** Verify error handling for invalid credentials
- **Steps:**
  1. Enter invalid email or password
  2. Click Login
- **Expected:** Error message displayed, no session created
- **Status:** Not Tested
- **Notes:**

### ☐ Portal Session Management
- **Test Case:** Verify session persists and times out appropriately
- **Steps:**
  1. Login successfully
  2. Keep portal open for extended period
  3. Verify auto-logout after 30 minutes of inactivity
- **Expected:** Session timeout warning, redirect to login
- **Status:** Not Tested
- **Notes:**

---

## PORTAL DASHBOARD

### ☐ Dashboard Load - Data Display
- **Test Case:** Verify all child data displays on dashboard load
- **Steps:**
  1. Login as parent
  2. Wait for dashboard to fully load
  3. Verify all children listed
  4. Verify quick stats visible
- **Expected:** Full dashboard with children list, no missing data, load time < 2 seconds
- **Status:** Not Tested
- **Notes:**

### ☐ Dashboard - Child Selection
- **Test Case:** Verify switching between children works correctly
- **Steps:**
  1. Click child selector dropdown
  2. Select different child
  3. Verify data updates
- **Expected:** Dashboard updates with selected child's data, no lag
- **Status:** Not Tested
- **Notes:**

---

## ATTENDANCE MODULE

### ☐ Attendance View - Data Accuracy
- **Test Case:** Verify attendance records are accurate and complete
- **Steps:**
  1. Navigate to Attendance section
  2. View current month attendance
  3. Verify all dates present
  4. Check attendance percentage calculation
- **Expected:** All attendance records visible, percentage correct
- **Status:** Not Tested
- **Notes:**

### ☐ Attendance - Date Range Filter
- **Test Case:** Verify filtering by date range works
- **Steps:**
  1. Click Filter button
  2. Select date range (e.g., last 7 days)
  3. Verify only matching records shown
- **Expected:** Filtered records match selection, count accurate
- **Status:** Not Tested
- **Notes:**

### ☐ Attendance - Status Legend
- **Test Case:** Verify attendance status colors/icons correct
- **Steps:**
  1. Check for Present indicator
  2. Check for Absent indicator
  3. Check for Leave indicator
  4. Check for Late indicator
- **Expected:** All status types clearly visible and color-coded
- **Status:** Not Tested
- **Notes:**

---

## GRADES MODULE

### ☐ Grades View - All Subjects Display
- **Test Case:** Verify all subject grades visible
- **Steps:**
  1. Navigate to Grades section
  2. Scroll through all subjects
  3. Verify marks and grades visible
- **Expected:** All subjects with marks/grades displayed
- **Status:** Not Tested
- **Notes:**

### ☐ Grades - Percentage & GPA Calculation
- **Test Case:** Verify grade calculations are correct
- **Steps:**
  1. Check average marks calculation
  2. Verify GPA calculation accuracy
  3. Check grade letter assignment
- **Expected:** All calculations accurate, match expected values
- **Status:** Not Tested
- **Notes:**

### ☐ Grades - Subject Filter & Search
- **Test Case:** Verify ability to find specific subjects
- **Steps:**
  1. Use search box to find subject
  2. Type partial subject name
  3. Verify results filtered correctly
- **Expected:** Search returns matching subjects only
- **Status:** Not Tested
- **Notes:**

### ☐ Grades - Trend Indicators
- **Test Case:** Verify grade trend visualization
- **Steps:**
  1. Check for grade improvement/decline indicators
  2. Verify trend accuracy
- **Expected:** Trends displayed correctly, reflect actual data
- **Status:** Not Tested
- **Notes:**

---

## MESSAGES MODULE

### ☐ Messages - Compose & Send
- **Test Case:** Verify messaging functionality
- **Steps:**
  1. Click Compose button
  2. Select recipient (teacher/principal)
  3. Type message
  4. Click Send
- **Expected:** Message sent successfully, confirmation shown
- **Status:** Not Tested
- **Notes:**

### ☐ Messages - Read & Reply
- **Test Case:** Verify message reading and reply
- **Steps:**
  1. Open received message
  2. Click Reply
  3. Type response
  4. Send
- **Expected:** Reply sent, thread updated
- **Status:** Not Tested
- **Notes:**

### ☐ Messages - Notification
- **Test Case:** Verify message notifications work
- **Steps:**
  1. Receive new message in system
  2. Check for notification
  3. Click notification
- **Expected:** Notification displays, click navigates to message
- **Status:** Not Tested
- **Notes:**

---

## ANNOUNCEMENTS MODULE

### ☐ Announcements - List Display
- **Test Case:** Verify all announcements visible
- **Steps:**
  1. Navigate to Announcements
  2. Scroll through list
  3. Verify dates and titles shown
- **Expected:** All announcements listed, ordered by date (newest first)
- **Status:** Not Tested
- **Notes:**

### ☐ Announcements - Read Details
- **Test Case:** Verify announcement details readable
- **Steps:**
  1. Click announcement
  2. View full content
  3. Read attachments if any
- **Expected:** Full text visible, images/attachments load
- **Status:** Not Tested
- **Notes:**

### ☐ Announcements - Search & Filter
- **Test Case:** Verify search functionality
- **Steps:**
  1. Use search to find keyword
  2. Verify results filtered
- **Expected:** Only matching announcements shown
- **Status:** Not Tested
- **Notes:**

---

## SETTINGS MODULE

### ☐ Settings - Profile View
- **Test Case:** Verify profile information displays correctly
- **Steps:**
  1. Navigate to Settings
  2. Click Profile
  3. Verify all information visible
- **Expected:** Name, email, phone, address all visible
- **Status:** Not Tested
- **Notes:**

### ☐ Settings - Update Profile
- **Test Case:** Verify profile editing works
- **Steps:**
  1. Edit phone number
  2. Click Save
  3. Reload page
  4. Verify change persisted
- **Expected:** Changes saved and persisted
- **Status:** Not Tested
- **Notes:**

### ☐ Settings - Notification Preferences
- **Test Case:** Verify notification settings work
- **Steps:**
  1. Toggle email notifications ON/OFF
  2. Toggle SMS notifications ON/OFF
  3. Save preferences
  4. Verify setting persists
- **Expected:** Preferences saved, notifications follow settings
- **Status:** Not Tested
- **Notes:**

### ☐ Settings - Password Change
- **Test Case:** Verify password change functionality
- **Steps:**
  1. Click Change Password
  2. Enter current password
  3. Enter new password (2x)
  4. Click Update
  5. Logout and login with new password
- **Expected:** Password updated, old password no longer works
- **Status:** Not Tested
- **Notes:**

---

## MOBILE APP

### ☐ Mobile - Installation
- **Test Case:** Verify app installs cleanly
- **Steps:**
  1. Install app on Android device
  2. Install app on iOS device
- **Expected:** Installation successful, app launches
- **Status:** Not Tested
- **Notes:**

### ☐ Mobile - Authentication
- **Test Case:** Verify login on mobile
- **Steps:**
  1. Launch app
  2. Enter credentials
  3. Click Login
- **Expected:** Login successful, dashboard displays
- **Status:** Not Tested
- **Notes:**

### ☐ Mobile - Dashboard Display
- **Test Case:** Verify mobile dashboard responsive
- **Steps:**
  1. View dashboard
  2. Rotate device (portrait/landscape)
  3. Verify layout adapts
- **Expected:** Dashboard readable in all orientations
- **Status:** Not Tested
- **Notes:**

---

## REPORTING MODULE

### ☐ Reporting - Templates
- **Test Case:** Verify all 20 report templates generate
- **Steps:**
  1. Loop through each template:
     - Attendance
     - Grades
     - Fees
     - Leave
     - Performance
     - Enrollment
     - Staff Directory
     - Timetable
     - Event Calendar
     - Progress Report
     - Conduct Report
     - Assessment Report
     - Fee Assessment Report
     - Exam Result Report
     - Health Record Report
     - Transport Report
     - Library Issue Report
     - Lab Usage Report
     - Extra Curricular Report
     - Discipline Report
  2. Generate each report
  3. Verify generated successfully
- **Expected:** All 20 templates generate without errors
- **Status:** Not Tested
- **Notes:**

### ☐ Reporting - PDF Export
- **Test Case:** Verify PDF export functionality
- **Steps:**
  1. Generate report
  2. Click Export as PDF
  3. Download file
  4. Open PDF
- **Expected:** PDF downloads, opens correctly, contains data
- **Status:** Not Tested
- **Notes:**

### ☐ Reporting - Excel Export
- **Test Case:** Verify Excel export functionality
- **Steps:**
  1. Generate report
  2. Click Export as Excel
  3. Download file
  4. Open in Excel
  5. Verify formulas work
- **Expected:** Excel file downloads, opens, formulas calculate
- **Status:** Not Tested
- **Notes:**

### ☐ Reporting - CSV Export
- **Test Case:** Verify CSV export functionality
- **Steps:**
  1. Generate report
  2. Click Export as CSV
  3. Download file
  4. Verify data structure
- **Expected:** CSV downloads with correct data structure
- **Status:** Not Tested
- **Notes:**

### ☐ Reporting - Custom Columns
- **Test Case:** Verify custom column selection
- **Steps:**
  1. Generate report
  2. Click column selector
  3. Deselect some columns
  4. Export
- **Expected:** Export contains only selected columns
- **Status:** Not Tested
- **Notes:**

### ☐ Reporting - Schedule Reports
- **Test Case:** Verify scheduled report delivery
- **Steps:**
  1. Set up report to send weekly
  2. Verify scheduling confirmed
  3. Wait for scheduled time
  4. Verify email received
- **Expected:** Reports deliver on schedule
- **Status:** Not Tested
- **Notes:**

---

## PERFORMANCE & SECURITY

### ☐ Performance - Page Load Time
- **Test Case:** Verify pages load within 2 seconds
- **Steps:**
  1. Open network inspector
  2. Load each main page
  3. Check load time
- **Expected:** All pages load in < 2 seconds
- **Status:** Not Tested
- **Notes:**

### ☐ Accessibility - Keyboard Navigation
- **Test Case:** Verify accessibility standards
- **Steps:**
  1. Use Tab key to navigate
  2. Verify all buttons/links reachable
  3. Test screen reader
- **Expected:** Full keyboard navigation, screen reader compatible
- **Status:** Not Tested
- **Notes:**

### ☐ Security - HTTPS
- **Test Case:** Verify HTTPS enforcement
- **Steps:**
  1. Check URL bar for lock icon
  2. Try to access HTTP version
- **Expected:** HTTPS enforced, HTTP redirects to HTTPS
- **Status:** Not Tested
- **Notes:**

### ☐ Security - Data Validation
- **Test Case:** Verify form data validation
- **Steps:**
  1. Try invalid email format
  2. Try injection attacks in message compose
  3. Try very long strings
- **Expected:** All invalid input rejected gracefully
- **Status:** Not Tested
- **Notes:**

---

## SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | QA Agent | ________________ | _______ |
| Tech Lead | Backend Agent | ________________ | _______ |
| Product Manager | Product Agent | ________________ | _______ |
| Release Authority | Lead Architect | ________________ | _______ |

---

## NOTES & ISSUES

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

**UAT Status:** 🔴 Not Started (Ready for execution)  
**Scheduled Completion:** April 18, 2026, 5:00 PM  
**Expected Duration:** 8 hours (split across week)
