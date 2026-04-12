# WEEK 5 QA TEST IMPLEMENTATION PLAN
## Detailed Test Specifications for 95 Tests Across 6 PRs

**Document Purpose:** Concrete test cases, mocks, assertions for QA team  
**Created:** April 9, 2026  
**Status:** Ready for Day 2 implementation

---

## PR #6: MOBILE APP - 15 Tests

### Test Suite 1: Authentication (3 Tests)

**Test 1.1: Login with Valid Phone OTP**
```typescript
describe('MobileAuth - LoginScreen', () => {
  it('should login user with valid phone OTP', async () => {
    // Arrange
    const mockFirebaseAuth = jest.fn().mockResolvedValue({
      uid: 'user123',
      phone: '+919876543210'
    });
    
    // Act
    const screen = render(<LoginScreen />);
    const phoneInput = screen.getByTestId('phone-input');
    fireEvent.changeText(phoneInput, '+919876543210');
    fireEvent.press(screen.getByTestId('send-otp-btn'));
    
    await waitFor(() => {
      expect(mockFirebaseAuth).toHaveBeenCalled();
    });
    
    // Navigate to OTP screen
    const otpInput = screen.getByTestId('otp-input');
    fireEvent.changeText(otpInput, '123456');
    fireEvent.press(screen.getByTestId('verify-otp-btn'));
    
    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-screen')).toBeTruthy();
    });
  });
});
```

**Test 1.2: Reject Invalid OTP**
```typescript
it('should show error for invalid OTP', async () => {
  // Setup: User enters 5 digits (min 6)
  const otpInput = screen.getByTestId('otp-input');
  fireEvent.changeText(otpInput, '12345');
  
  // Assert: Submit button disabled
  expect(screen.getByTestId('verify-otp-btn')).toBeDisabled();
  expect(screen.getByText('OTP must be 6 digits')).toBeTruthy();
});
```

**Test 1.3: Logout Clears Session**
```typescript
it('should clear session on logout', async () => {
  // Act: User presses logout
  fireEvent.press(screen.getByTestId('logout-btn'));
  
  // Assert: Redirected to login, session cleared
  expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
  // Token should be deleted
  await waitFor(() => {
    expect(screen.queryByTestId('login-screen')).toBeTruthy();
  });
});
```

### Test Suite 2: Dashboard (2 Tests)

**Test 2.1: Display Student Data**
```typescript
it('should display student name and attendance %', async () => {
  // Mock API response
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      name: 'Aman Kumar',
      attendance: 92.5,
      latestGrades: [
        { subject: 'Math', grade: 'A+', marks: 95 },
        { subject: 'Science', grade: 'A', marks: 88 }
      ]
    })
  });
  
  const screen = render(<DashboardScreen />);
  
  await waitFor(() => {
    expect(screen.getByText('Aman Kumar')).toBeTruthy();
    expect(screen.getByText('92.5%')).toBeTruthy();
  });
});
```

**Test 2.2: Refresh Dashboard Data**
```typescript
it('should refresh data on swipe', async () => {
  const screen = render(<DashboardScreen />);
  
  // First load
  const initialAttendance = screen.getByText('92.5%');
  
  // Swipe to refresh
  fireEvent.scroll(screen.getByTestId('scroll-view'), { y: -50 });
  
  // Verify new call made
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
```

### Test Suite 3: Attendance Marking (2 Tests)

**Test 3.1: Mark Attendance Offline**
```typescript
it('should queue attendance marking when offline', async () => {
  // Mock network state: offline
  NetInfo.fetch.mockResolvedValue({ isConnected: false });
  
  const screen = render(<AttendanceScreen />);
  fireEvent.press(screen.getByTestId('mark-present-btn'));
  
  // Assert: Stored in AsyncStorage queue
  await waitFor(() => {
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'attendance_queue',
      expect.stringContaining('present')
    );
  });
  expect(screen.getByText('Saved offline')).toBeTruthy();
});
```

**Test 3.2: Sync When Comes Online**
```typescript
it('should sync queued attendance when online', async () => {
  // Setup: Already marked offline
  AsyncStorage.getItem.mockResolvedValue('{"mark":"present"}');
  
  // Simulate coming online
  NetInfo.fetch.mockResolvedValue({ isConnected: true });
  
  const screen = render(<AttendanceScreen />);
  
  // Trigger sync
  fireEvent(screen, 'NetworkStateChange', { isConnected: true });
  
  // Assert: API called to sync
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/attendance/sync');
  });
});
```

### Test Suite 4: Grades View (1 Test)

**Test 4.1: Display Grades by Subject**
```typescript
it('should display grades sorted by subject', async () => {
  mockFetch.mockResolvedValue({
    json: async () => ({
      grades: [
        { subject: 'Math', marks: 95, total: 100, grade: 'A+' },
        { subject: 'English', marks: 87, total: 100, grade: 'A' },
        { subject: 'Science', marks: 92, total: 100, grade: 'A' }
      ]
    })
  });
  
  const screen = render(<GradesScreen />);
  
  // Sort by subject (alphabetical)
  fireEvent.press(screen.getByTestId('sort-btn'));
  
  const grades = screen.getAllByTestId('grade-item');
  expect(grades[0]).toHaveTextContent('English');
  expect(grades[1]).toHaveTextContent('Math');
  expect(grades[2]).toHaveTextContent('Science');
});
```

### Test Suite 5: Navigation & Error Handling (2 Tests)

**Test 5.1: Handle API Errors Gracefully**
```typescript
it('should show error message on API failure', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));
  
  const screen = render(<DashboardScreen />);
  
  await waitFor(() => {
    expect(screen.getByText(/Failed to load/i)).toBeTruthy();
    expect(screen.getByTestId('retry-btn')).toBeTruthy();
  });
});
```

**Test 5.2: Retry Failed Request**
```typescript
it('should retry request when user taps Retry', async () => {
  mockFetch.mockRejectedValueOnce(new Error());
  mockFetch.mockResolvedValueOnce({ json: async () => ({ attendance: 92 }) });
  
  const screen = render(<DashboardScreen />);
  
  await waitFor(() => {
    expect(screen.getByTestId('retry-btn')).toBeTruthy();
  });
  
  fireEvent.press(screen.getByTestId('retry-btn'));
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText('92%')).toBeTruthy();
  });
});
```

### Test Suite 6: Redux State (3 Tests)

**Test 6.1: Authentication State Updates**
```typescript
it('should update user state on successful login', () => {
  const initialState = { user: null, isLoggedIn: false };
  const loginAction = loginSuccess({ uid: 'user123', name: 'Aman' });
  
  const newState = authReducer(initialState, loginAction);
  
  expect(newState.user.uid).toBe('user123');
  expect(newState.isLoggedIn).toBe(true);
});
```

**Test 6.2: Handle Redux Errors**
```typescript
it('should set error on login failure', () => {
  const state = authReducer({}, loginFailure('Invalid OTP'));
  
  expect(state.error).toBe('Invalid OTP');
  expect(state.isLoggedIn).toBe(false);
});
```

### Integration Tests (5)

**Integration Test 1: Full Login → Dashboard Flow**
```typescript
it('should login and load dashboard in one flow', async () => {
  // Setup all mocks
  mockFirebaseAuth.mockResolvedValue({ uid: 'user123' });
  mockFetch.mockResolvedValue({
    json: async () => ({ attendance: 92, name: 'Aman' })
  });
  
  // Start at login
  const screen = render(
    <AppNavigator initialRoute="login" />
  );
  
  // Login flow
  fireEvent.changeText(...);
  fireEvent.press(screen.getByTestId('login-btn'));
  
  // Should navigate to dashboard
  await waitFor(() => {
    expect(screen.getByText('Aman')).toBeTruthy();
  });
});
```

### E2E Tests (2)

**E2E Test 1: Teacher Login → View Attendance**  
*Run in iOS Simulator*
```
1. Tap app icon
2. Enter phone: +919876543210
3. Receive OTP SMS
4. Enter OTP: 123456
5. Tap Verify
6. Verify dashboard appears
7. Verify attendance shows 92.5%
8. Tap Attendance tab
9. Verify last 30 days calendar view
Expected result: All screens render, no crashes
```

---

## PR #7: BULK IMPORT - 15 Tests ⭐ CRITICAL (95%+ Coverage)

### CSV Parser Tests (3 Tests)

**Test 1.1: Parse Valid CSV**
```typescript
describe('BulkImport - CSVParser', () => {
  it('should parse valid CSV with headers', () => {
    const csv = `roll_number,first_name,last_name,email,phone\n001,Aman,Kumar,aman@school.com,9876543210\n002,Priya,Sharma,priya@school.com,9876543211`;
    
    const result = parseCSV(csv);
    
    expect(result).toEqual([
      { roll_number: '001', first_name: 'Aman', ... },
      { roll_number: '002', first_name: 'Priya', ... }
    ]);
    expect(result.length).toBe(2);
  });
});
```

**Test 1.2: Handle Malformed CSV**
```typescript
it('should throw error for missing header', () => {
  const csv = '001,Aman,Kumar';  // No header row
  
  expect(() => parseCSV(csv)).toThrow('Missing required headers');
});
```

**Test 1.3: Handle Encoding (UTF-8, ANSI)**
```typescript
it('should handle UTF-8 encoded names with special chars', () => {
  const csv = `roll_number,first_name\n001,अमनकुमार`;  // Hindi text
  
  const result = parseCSV(csv);
  
  expect(result[0].first_name).toBe('अमनकुमार');
});
```

### Validation Tests (4 Tests)

**Test 2.1: Validate Email Format**
```typescript
it('should reject invalid email format', () => {
  const records = [
    { email: 'aman@school.com' },      // Valid
    { email: 'aman@' },                 // Invalid
    { email: 'not-email' }              // Invalid
  ];
  
  const errors = validateRecords(records);
  
  expect(errors.length).toBe(2);
  expect(errors[0]).toContain('Invalid email');
});
```

**Test 2.2: Validate Phone Format**
```typescript
it('should validate phone number (10 digit Indian)', () => {
  const records = [
    { phone: '9876543210' },    // Valid
    { phone: '+919876543210' }, // Valid
    { phone: '987654321' },     // Invalid (9 digits)
  ];
  
  const errors = validateRecords(records);
  expect(errors.length).toBe(1);
});
```

**Test 2.3: Check Required Fields**
```typescript
it('should reject records with missing required fields', () => {
  const records = [
    { roll_number: '001', first_name: 'Aman' },  // Missing email
    { roll_number: '002', first_name: 'Priya' }  // Missing email
  ];
  
  const errors = validateRecords(records);
  
  expect(errors.length).toBe(2);
  expect(errors[0]).toContain('email is required');
});
```

**Test 2.4: Validate Duplicate Roll Numbers**
```typescript
it('should detect duplicate roll numbers within CSV', () => {
  const records = [
    { roll_number: '001', first_name: 'Aman' },
    { roll_number: '001', first_name: 'Duplicate' }
  ];
  
  const errors = validateRecords(records);
  
  expect(errors).toContainEqual({
    row: 2,
    error: 'Duplicate roll_number: 001'
  });
});
```

### Batch Processing (3 Tests)

**Test 3.1: Split Large CSV into Batches**
```typescript
it('should split 500 records into batches of 50', () => {
  const records = Array.from({ length: 500 }, (_, i) => ({
    roll_number: `00${i}`,
    name: `Student ${i}`
  }));
  
  const batches = createBatches(records, 50);
  
  expect(batches.length).toBe(10);
  expect(batches[0].length).toBe(50);
  expect(batches[9].length).toBe(50);
});
```

**Test 3.2: Process Batch with Firestore Write**
```typescript
it('should write batch to Firestore', async () => {
  const batch = [{ roll_number: '001', name: 'Aman' }];
  mockFirestoreBatch.set.mockResolvedValue();
  
  await processBatch(batch, 'school123');
  
  expect(mockFirestoreBatch.commit).toHaveBeenCalled();
});
```

**Test 3.3: Rollback on Batch Failure**
```typescript
it('should rollback all records on batch failure', async () => {
  mockFirestoreBatch.commit.mockRejectedValue(new Error('Firestore down'));
  
  const rollback = jest.fn();
  await processBatch(batch, 'school123', { rollback });
  
  expect(rollback).toHaveBeenCalled();
  expect(mockDeleteRecord).toHaveBeenCalledTimes(1);
});
```

### Error Handling (2 Tests)

**Test 4.1: Generate Helpful Error Messages**
```typescript
it('should generate user-friendly error report', () => {
  const errors = [
    { row: 5, column: 'email', error: 'Invalid format' },
    { row: 10, column: 'phone', error: 'Too short' }
  ];
  
  const report = generateErrorReport(errors);
  
  expect(report).toContain('Row 5: email field has invalid format');
  expect(report).toContain('Row 10: phone field is too short');
});
```

**Test 4.2: Dry Run Mode (No DB Write)**
```typescript
it('should validate without writing when dryRun=true', async () => {
  const result = await importCSV(csvData, { dryRun: true });
  
  expect(result.written).toBe(0);
  expect(mockFirestoreBatch.commit).not.toHaveBeenCalled();
  expect(result.validRecords).toBe(500);
});
```

### API Endpoint Tests (2 Tests)

**Test 5.1: POST /api/v1/import/bulk**
```typescript
it('should upload CSV and return job_id', async () => {
  const form = new FormData();
  form.append('file', csvFile);
  form.append('import_type', 'students');
  
  const response = await fetch('/api/v1/import/bulk', {
    method: 'POST',
    body: form
  });
  
  expect(response.status).toBe(202);
  expect(response.body.job_id).toMatch(/^import_/);
});
```

**Test 5.2: Check Import Progress**
```typescript
it('should return import progress via WebSocket', (done) => {
  const ws = new WebSocket('/ws/import/import_123');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    expect(data.processed).toBeGreaterThan(0);
    expect(data.status).toMatch(/processing|completed/);
    
    if (data.processed === 500) done();
  };
});
```

### Integration Tests (2 Tests)

**Integration Test 1: Full Import Workflow**
```typescript
it('should import 500 students end-to-end', async () => {
  // Upload
  const uploadRes = await uploadCSV(...);
  const jobId = uploadRes.job_id;
  
  // Monitor progress
  let completed = false;
  while (!completed) {
    const status = await checkStatus(jobId);
    if (status.processed === 500) completed = true;
  }
  
  // Verify in DB
  const students = await getStudents('school123');
  expect(students.length).toBe(500);
});
```

### E2E Test (1 Test)

**E2E: Upload CSV → Monitor → Verify in Portal**
```
1. Go to Admin Dashboard
2. Click "Bulk Import"
3. Select students.csv (500 records)
4. Verify file preview (5 rows shown)
5. Click "Import"
6. Wait for progress (100%)
7. Check "Student List" page
8. Verify 500 new students visible
Expected: All students imported successfully
```

---

## PR #8: SMS NOTIFICATIONS - 10 Tests

### Template Engine (2 Tests)

**Test 1.1: Render Template with Variables**
```typescript
describe('SMS - TemplateEngine', () => {
  it('should render SMS template with variables', () => {
    const template = 'Hi {{parent_name}}, {{student_name}} scored {{grade}} in {{subject}}.';
    const vars = {
      parent_name: 'Rajesh',
      student_name: 'Aman',
      grade: 'A+',
      subject: 'Math'
    };
    
    const result = renderTemplate(template, vars);
    
    expect(result).toBe('Hi Rajesh, Aman scored A+ in Math.');
  });
});
```

**Test 1.2: Handle Missing Variables**
```typescript
it('should use default values for missing variables', () => {
  const template = 'Hi {{parent_name}}, {{student_name}} is {{status | default:"marked absent"}}.';
  const vars = { parent_name: 'Rajesh' };
  
  const result = renderTemplate(template, vars);
  
  expect(result).toContain('is marked absent');
});
```

### Twilio Integration (2 Tests)

**Test 2.1: Send SMS via Twilio**
```typescript
it('should send SMS and return twilio_sid', async () => {
  mockTwilioClient.messages.create.mockResolvedValue({
    sid: 'SM1234567890abcdef',
    status: 'sent',
    to: '+919876543210'
  });
  
  const result = await sendSMS({
    phone: '+919876543210',
    message: 'Test message'
  });
  
  expect(result.twilio_sid).toBe('SM1234567890abcdef');
  expect(result.status).toBe('sent');
});
```

**Test 2.2: Handle Twilio Rate Limiting**
```typescript
it('should retry on Twilio rate limit (429)', async () => {
  mockTwilioClient.messages.create
    .mockRejectedValueOnce({ status: 429 })  // First call fails
    .mockResolvedValueOnce({ sid: 'SM123', status: 'sent' });  // Retry succeeds
  
  const result = await sendSMS(...);
  
  expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
  expect(result.status).toBe('sent');
});
```

### Rate Limiting (1 Test)

**Test 3.1: Enforce Rate Limit (5 SMS/hour per phone)**
```typescript
it('should reject SMS when rate limit exceeded', async () => {
  const phone = '+919876543210';
  
  // Send 5 SMS in quick succession
  for (let i = 0; i < 5; i++) {
    await sendSMS({ phone, message: `Message ${i}` });
  }
  
  // 6th SMS should be rejected
  const response = await sendSMS({ phone, message: 'Message 6' });
  
  expect(response.rejected).toBe(true);
  expect(response.reason).toContain('Rate limit exceeded');
});
```

### Event Listener Tests (2 Tests)

**Test 4.1: Trigger SMS on New Grade Posted**
```typescript
it('should send SMS when teacher posts grade', async () => {
  // Mock Firestore listener
  mockFirestore.collection('grades').onSnapshot.mockImplementation(
    (callback) => {
      callback({
        docs: [{
          data: () => ({
            student_id: 'std_123',
            subject: 'Math',
            grade: 'A+'
          })
        }]
      });
    }
  );
  
  const sendSMS = jest.fn();
  listen ToGradeUpdates(sendSMS);
  
  await waitFor(() => {
    expect(sendSMS).toHaveBeenCalled();
  });
});
```

**Test 4.2: Trigger SMS on Attendance Marked**
```typescript
it('should send SMS when attendance marked', async () => {
  // Mock attendance in database
  await markAttendance('std_123', 'present');
  
  // Trigger event listener
  await waitFor(() => {
    expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+919876543210',  // Parent's SMS
        body: expect.stringContaining('marked present')
      })
    );
  });
});
```

### Audit Trail (1 Test)

**Test 5.1: Log SMS Sent to Audit Trail**
```typescript
it('should log SMS in sms_logs collection', async () => {
  await sendSMS({
    phone: '+919876543210',
    message: 'Test SMS'
  });
  
  // Verify logged
  expect(mockFirestore.collection('sms_logs').add).toHaveBeenCalledWith(
    expect.objectContaining({
      phone: '+919876543210',
      status: 'sent',
      cost: 0.40,
      created_at: expect.any(Date)
    })
  );
});
```

### Integration Tests (2 Tests)

**Integration Test 1: Grade Posted → SMS Sent → Logged**
```typescript
it('should handle full SMS flow on grade post', async () => {
  // Post grade
  await postGrade('std_123', 'Math', 'A+');
  
  // Verify SMS sent
  await waitFor(() => {
    expect(mockTwilioClient.messages.create).toHaveBeenCalled();
  });
  
  // Verify logged
  const logs = await getSMSLogs('school_123');
  expect(logs[logs.length - 1].status).toBe('sent');
});
```

---

## PR #9: REPORTING - 15 Tests

*[Abbreviated for space - 15 tests covering report generation, filtering, exports, scheduling]*

### Unit Tests (8)
- Report generation with 5 templates
- Filter logic (date, class, subject)
- Access control (teacher visibility)
- Excel export formatting
- PDF styling
- Cache invalidation
- Timezone handling
- Large dataset handling (1000+ records)

### Integration Tests (5)
- Multi-data source queries (combining tables)
- Scheduled report execution
- Email delivery
- Cloud Storage archival
- Access control enforcement

### E2E Tests (2)
- Build custom report → Export → Verify
- Schedule report → Email delivery → Verify

---

## PR #10: PORTAL - 12 Tests

*[Abbreviated for space - 12 tests covering React components, responsive design, messaging]*

### Unit Tests (7)
- Login screen rendering
- Child dashboard data display
- Grade view filtering
- Attendance calendar
- Messaging interface
- Permission checking
- Error handling

### Integration Tests (4)
- End-to-end grade display
- Messaging with teachers
- Fee status + payment
- Real-time sync

### E2E Test (1)
- Full portal flow: login → view grades → message teacher

---

## PR #11: TIMETABLE - 12 Tests

### Unit Tests (7)

**Test 1.1: Conflict Detection - Teacher Double Book** ⭐ CRITICAL
```typescript
describe('Timetable - ConflictDetection', () => {
  it('should detect when teacher assigned to 2 classes same period', () => {
    const slots = [
      { day: 'Monday', period: 1, teacher_id: 'T001', class_id: 'CLASS_6A' },
      { day: 'Monday', period: 1, teacher_id: 'T001', class_id: 'CLASS_6B' }
    ];
    
    const conflicts = detectConflicts(slots);
    
    expect(conflicts).toContainEqual({
      type: 'TEACHER_DOUBLE_BOOK',
      teacher: 'T001',
      period: 1,
      classes: ['CLASS_6A', 'CLASS_6B']
    });
  });
});
```

**Test 1.2: Conflict Detection - Room Double Book**
```typescript
it('should detect when classroom used by 2 classes same period', () => {
  const slots = [
    { day: 'Monday', period: 1, room: 101, class_id: 'CLASS_6A' },
    { day: 'Monday', period: 1, room: 101, class_id: 'CLASS_6B' }
  ];
  
  const conflicts = detectConflicts(slots);
  expect(conflicts.length).toBe(1);
  expect(conflicts[0].type).toBe('ROOM_CONFLICT');
});
```

*[Similar tests for remaining timetable validations]*

### Integration Tests (4)
- Full timetable creation + slot assignment
- Conflict scenario detection
- Export to PDF/iCal verification
- Real-time concurrent updates

### E2E Test (1)
- Drag teacher to time slot → Detect conflict → Export PDF

---

## PR #12: DEVOPS - 16 Tests

### Unit Tests (8)
- Health check endpoint
- Deployment scripts
- Monitoring configuration
- Alert trigger logic
- SLA calculation
- Quota management
- Backup scripts
- Log parsing

### Integration Tests (6)
- Full CI/CD pipeline (build → test → deploy)
- Mobile app build + signing
- Load testing (1000 RPS)
- Monitoring data collection
- Alert delivery
- Rollback scenario

### E2E Tests (2)
- Code push → Auto-deploy → Smoke tests
- Mobile release → App Store visible

---

## SUMMARY: 95 TESTS IMPLEMENTATION ROADMAP

```
WEEK 5 TEST IMPLEMENTATION SCHEDULE

Day 1 (Mon): Setup + 5 tests written (Jest setup, first unit tests)
Day 2-3: Unit tests (30+ tests, focus PR #7 CRITICAL)
Day 4: Integration tests (25+ tests)
Day 5: E2E + Performance (15+ tests)
Day 6: Coverage verification + Gates
Day 7: Final tests + Deployment

Coverage Targets:
- PR #6: 80%+ (15 tests)
- PR #7: 95%+ (15 tests) ⭐ CRITICAL
- PR #8: 85%+ (10 tests)
- PR #9: 85%+ (15 tests)
- PR #10: 80%+ (12 tests)
- PR #11: 90%+ (12 tests)
- PR #12: 85%+ (16 tests)
TOTAL: 95 tests = 85%+ overall coverage
```

---

**Document Status:** READY FOR EXECUTION  
**Next Step:** Start writing tests Day 2
