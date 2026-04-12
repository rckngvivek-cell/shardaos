# COMPLETE 24-WEEK BUILD PLAN: Pan-India School ERP
**Full Execution Guide - Day by Day, Week by Week**

---

# PHASE 1: FOUNDATION & INFRASTRUCTURE (Weeks 1-4)

## WEEK 1: Project Kickoff & Infrastructure Setup
**Goal:** GCP + Firestore + Cloud Run infrastructure ready, first API running

### Monday (April 15)
**Morning - Team Kickoff (2 hours)**
- [ ] Announce 24-week timeline to team
- [ ] Distribute all 4 strategy documents
- [ ] Present business plan summary (30 mins)
- [ ] Present technical architecture (30 mins)
- [ ] Q&A + clarify any doubts (30 mins)

**Action Items - You:**
- [ ] Send welcome email to backend engineer with onboarding checklist
- [ ] Create Slack workspace + invite engineer
- [ ] Share GitHub organization link + repo access

**Action Items - Backend Engineer:**
- [ ] Set up local development environment
- [ ] Install Node.js 18 LTS, npm, git
- [ ] Clone repo (`git clone https://github.com/schoolerp/api.git`)
- [ ] Create `.env.local` file with GCP credentials

**EOD Success Criteria:**
- [ ] Engineer has all 4 docs read (or skimmed)
- [ ] Engineer has repo access
- [ ] Engineer has GCP project access
- [ ] Slack workspace created + engineer added

---

### Tuesday (April 16)
**Morning - GCP Deep Dive (1.5 hours)**
- [ ] Firestore structure walkthrough (10 collections)
- [ ] Cloud Run deployment process
- [ ] Authentication flow (Firebase Auth)
- [ ] Monitoring + logging setup
- [ ] Tips for local Firestore emulator

**Action Items - Backend Engineer:**
```bash
# Start Firestore emulator
firebase emulators:start

# In another terminal, verify connection
npm run dev:local
# Should output: "Firestore emulator running on http://localhost:8080"
```

**Action Items - You:**
1. Verify GCP project setup:
   - [ ] Billing account linked
   - [ ] Firestore in asia-south1 region
   - [ ] Cloud Run enabled
   - [ ] Cloud Build enabled
   - [ ] Service account created

2. Create initial GitHub branch protection rules:
   - [ ] Main branch requires PR reviews (1 reviewer min)
   - [ ] Require status checks to pass before merge
   - [ ] Dismiss stale reviews

3. Email first 5 potential pilot schools:
   ```
   Subject: Free ERP Pilot - Founder Pricing ₹10K/year
   
   Hi [Principal Name],
   
   We're building a modern school management system designed for Indian schools.
   We're looking for 2-3 pilot schools to go live in 4 weeks.
   
   Benefits:
   - Free setup (normally ₹5K)
   - ₹10K/year (50% discount vs normal ₹20K)
   - 24/7 support during pilot
   
   Interested? Reply with "yes" and we'll schedule a call.
   
   Thanks,
   [Your Name]
   ```

**EOD Success Criteria:**
- [ ] Firestore emulator running locally
- [ ] Engineer can call `localhost:8080/health`
- [ ] 5 emails sent to schools
- [ ] GitHub branch protection configured

---

### Wednesday (April 17)
**Morning - Code Foundation (2 hours)**

**Backend Engineer Task:**
Build Express.js boilerplate with auth middleware

```typescript
// src/index.ts
import express from 'express';
import admin from 'firebase-admin';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase Admin
admin.initializeApp();

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/v1/schools', require('./routes/schools'));
app.use('/api/v1/students', require('./routes/students'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Create 3 files:**
1. `src/middleware/auth.ts` - Firebase token verification
2. `src/routes/schools.ts` - School CRUD endpoints
3. `src/routes/students.ts` - Stub (empty array response)

**Write 5 Tests:**
```typescript
// tests/schools.test.ts
describe('Schools API', () => {
  test('GET /schools returns empty array', async () => {
    const res = await request(app).get('/api/v1/schools');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  
  test('POST /schools creates school', async () => {
    const res = await request(app)
      .post('/api/v1/schools')
      .send({ name: 'St Xavier', city: 'Patna' });
    expect(res.status).toBe(201);
    expect(res.body.schoolId).toBeDefined();
  });
  
  // 3 more tests here
});
```

**Action Items - You:**
1. Set up CI/CD pipeline (Cloud Build)
   - [ ] Create `cloudbuild.yaml` (build on every git push)
   - [ ] Configure build to run tests
   - [ ] Automatic deployment to staging on main branch

2. Create Dockerfile:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY src/ ./src/
   EXPOSE 8080
   CMD ["node", "src/index.js"]
   ```

3. Set up monitoring alerts:
   - [ ] Alert if error rate > 1%
   - [ ] Alert if latency P95 > 2 seconds
   - [ ] Alert if deployment fails

**EOD Success Criteria:**
- [ ] Engineer has created boilerplate with auth
- [ ] 5 tests written + passing
- [ ] Cloud Build pipeline configured
- [ ] Dockerfile created
- [ ] All code committed to `feat/foundation` branch

---

### Thursday (April 18)
**Morning - Security & Deploy (2 hours)**

**Backend Engineer Task:**
1. Add Firebase Auth verification to all endpoints
2. Create Firestore security rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Students: Teacher/principal can write, parent can read own
    match /students/{schoolId}/{studentId} {
      allow read, write: if request.auth.uid == resource.data.principal_uid;
      allow read: if request.auth.uid == resource.data.parent_uid;
    }
  }
}
```

3. Deploy rules to Firestore (staging environment)

**Action Items - You:**
1. Set up Cloud Logging + Error Reporting
   - [ ] Configure log sinks
   - [ ] Create custom metrics (error count, latency)
   - [ ] Test error reporting (intentionally trigger error)

2. Create API documentation template (Swagger)
   ```yaml
   openapi: 3.0.0
   info:
     title: School ERP API
     version: 1.0.0
   paths:
     /api/v1/schools:
       get:
         summary: List all schools
         responses:
           200:
             description: List of schools
   ```

3. Reach out to potential pilot schools (follow-up emails)
   - [ ] Check which schools replied "interested"
   - [ ] Schedule 15-min calls with top 3 prospects
   - [ ] Pitch: Free pilot, 2-week setup, ₹10K/year

**PR Review:**
- [ ] Review backend engineer's code (auth implementation)
- [ ] Check test coverage (should be 80%+)
- [ ] Merge to main branch if approved
- [ ] Cloud Build auto-deploys to staging

**EOD Success Criteria:**
- [ ] All endpoints require Firebase auth token
- [ ] Firestore security rules deployed
- [ ] Cloud Logging configured + tests passing
- [ ] API documentation started
- [ ] First PR merged to main ✅

---

### Friday (April 19)
**Morning - Demo & Retrospective (1.5 hours)**

**Demo (30 mins):**
Engineer demonstrates:
1. `/health` endpoint response
2. Firestore emulator connection
3. Test suite passing (5/5 tests ✅)
4. Cloud Run staging deployment live
5. Architecture diagram (ASCII or draw.io)

**Retrospective (30 mins):**
- What went well? 
  - [ ] GCP setup was smooth
  - [ ] Engineer productive on Day 1
  - [ ] Tests gave confidence
  
- What was hard?
  - [ ] Firestore learning curve
  - [ ] Local emulator debugging
  
- What to improve?
  - [ ] Better debugging guides
  - [ ] Daily sync-ups instead of ad-hoc

**Action Items - Week 2 Planning:**
- [ ] Backend: Build Student CRUD API (POST, GET, PATCH, DELETE)
- [ ] Frontend: Start React boilerplate (no code yet, just setup)
- [ ] You: Lock in 1 pilot school commitment by Wednesday

**Celebrate! 🎉**
- [ ] Thank engineer for smooth first week
- [ ] Share wins with team: "First API live, tests passing, Cloud Run working"
- [ ] Brief frontend engineer on start date (Monday Week 2)

**Monday EOD Summary:**
```
✅ GCP infrastructure ready
✅ Cloud Run staging environment
✅ Firestore emulator tested locally
✅ Firebase Auth integrated
✅ CI/CD pipeline working
✅ First API endpoint live
✅ Test framework established (Jest)
✅ Logging + monitoring configured

Team: 1 backend engineer (productive)
Code: ~500 lines of boilerplate + tests
Tests: 5 tests passing (80% coverage target)
Deployment: Cloud Run staging healthy
Next: Student CRUD API + Frontend engineer joins
```

---

## WEEK 2: Student Information System Module
**Goal:** Student CRUD API complete, React component built, 1 pilot school committed

### Monday (April 22)
**Morning - Sprint Planning (1 hour)**
- [ ] Frontend engineer joins + onboarding
- [ ] Assign Week 2 tasks
- [ ] Discuss Student module specs
- [ ] Review architecture for students collection

**Frontend Engineer Setup:**
```bash
# Create React app
npx create-react-app school-erp-web
cd school-erp-web
npm install axios redux @reduxjs/toolkit firebase

# Create folder structure
mkdir -p src/{pages,components,services,store,hooks}
```

**Backend Engineer - Student API (POST endpoint):**
```typescript
// src/routes/students.ts
app.post('/api/v1/schools/:schoolId/students', async (req, res) => {
  const { name, dob, aadhar, parentPhone, class: studentClass } = req.body;
  
  // Validation
  if (!name || !parentPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const studentId = req.body.studentId || generateId();
    const docRef = db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .doc(studentId);
    
    await docRef.set({
      name, dob, aadhar, parentPhone, class: studentClass,
      enrollmentDate: new Date(),
      status: 'active',
      created_at: new Date(),
    });
    
    res.status(201).json({ studentId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Action Items - You:**
1. Call 2-3 pilot school principals
   - [ ] Understand their pain points
   - [ ] Demo architecture doc
   - [ ] Gauge interest in 2-week pilot
   - [ ] Discuss timeline: "Go-live 2 weeks from now"

2. Create project management board (Jira/Notion)
   - [ ] Week 2 tasks for backend (Student CRUD)
   - [ ] Week 2 tasks for frontend (StudentForm component)
   - [ ] Track daily progress

**EOD Success Criteria:**
- [ ] Frontend engineer onboarded + environment set up
- [ ] Backend engineer building POST student endpoint
- [ ] Frontend engineer researching React hooks + Redux patterns
- [ ] 1 school principal agrees to pilot (handshake deal)

---

### Tuesday (April 23)
**Backend - Student API (GET endpoints):**

```typescript
// GET all students for a school
app.get('/api/v1/schools/:schoolId/students', async (req, res) => {
  try {
    const snapshot = await db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .where('status', '==', 'active')
      .orderBy('name')
      .get();
    
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single student
app.get('/api/v1/schools/:schoolId/students/:studentId', async (req, res) => {
  try {
    const doc = await db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .doc(req.params.studentId)
      .get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search students by name or Aadhar
app.get('/api/v1/schools/:schoolId/students/search', async (req, res) => {
  const { q } = req.query;
  try {
    const snapshot = await db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .where('name', '>=', q)
      .where('name', '<=', q + '\uf8ff')
      .limit(10)
      .get();
    
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Tests - Backend Engineer:**
```typescript
describe('Student API', () => {
  test('POST creates student', async () => {
    const res = await request(app)
      .post('/api/v1/schools/xyz/students')
      .send({
        name: 'Aarav Kumar',
        dob: '2010-06-15',
        parentPhone: '+91-9876543210',
        class: '8A'
      });
    expect(res.status).toBe(201);
    expect(res.body.studentId).toBeDefined();
  });
  
  test('GET lists active students', async () => {
    const res = await request(app)
      .get('/api/v1/schools/xyz/students');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  
  test('Search returns matching students', async () => {
    const res = await request(app)
      .get('/api/v1/schools/xyz/students/search?q=aarav');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
```

**Frontend - StudentForm Component:**
```jsx
// src/components/StudentForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export function StudentForm({ schoolId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    parentPhone: '',
    class: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/v1/schools/${schoolId}/students`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(res.data);
      setFormData({ name: '', dob: '', parentPhone: '', class: '' });
    } catch (error) {
      console.error('Error creating student:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Student Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="date"
        name="dob"
        value={formData.dob}
        onChange={handleChange}
        required
      />
      <input
        type="tel"
        name="parentPhone"
        placeholder="Parent Phone"
        value={formData.parentPhone}
        onChange={handleChange}
        required
      />
      <select name="class" value={formData.class} onChange={handleChange} required>
        <option value="">Select Class</option>
        <option value="1">Class 1</option>
        <option value="2">Class 2</option>
        {/* More classes */}
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  );
}
```

**Action Items - You:**
1. Continue outreach to pilot schools
   - [ ] Schedule 30-min demos with 2 principals
   - [ ] Show product mockups + architecture
   - [ ] Get LOI (Letter of Intent) signed: "We want to pilot starting Week 4"

2. Set up team communication cadence
   - [ ] Daily 10-min standup (9:30am)
   - [ ] Weekly planning (Friday 4pm)
   - [ ] Weekly retrospective (Friday 4:30pm)

**EOD Success Criteria:**
- [ ] 3 Student API endpoints working (POST, GET, GET/:id, search)
- [ ] StudentForm React component created + working
- [ ] 8+ tests written + passing
- [ ] Code coverage 80%+
- [ ] 1 school principal meeting scheduled for Wed

---

### Wednesday (April 24)
**Backend - PATCH & DELETE, Photo Upload:**

```typescript
// PATCH student
app.patch('/api/v1/schools/:schoolId/students/:studentId', async (req, res) => {
  try {
    const docRef = db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .doc(req.params.studentId);
    
    await docRef.update({
      ...req.body,
      updated_at: new Date()
    });
    
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE student (soft delete)
app.delete('/api/v1/schools/:schoolId/students/:studentId', async (req, res) => {
  try {
    await db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .doc(req.params.studentId)
      .update({ status: 'inactive', updated_at: new Date() });
    
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload student photo
app.post('/api/v1/schools/:schoolId/students/:studentId/photo', async (req, res) => {
  try {
    const bucket = admin.storage().bucket();
    const file = req.files.photo;
    const path = `schools/${req.params.schoolId}/students/${req.params.studentId}/photo.jpg`;
    
    await bucket.file(path).save(file.data);
    const photoUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
    
    // Update student record with photo URL
    await db.collection('students')
      .doc(req.params.schoolId)
      .collection('students')
      .doc(req.params.studentId)
      .update({ photoUrl });
    
    res.json({ photoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend - StudentList Component:**
```jsx
// src/components/StudentList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentForm from './StudentForm';

export function StudentList({ schoolId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [schoolId]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`/api/v1/schools/${schoolId}/students`);
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Students</h2>
      <StudentForm schoolId={schoolId} onSuccess={() => fetchStudents()} />
      
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.class}</td>
                <td>{student.parentPhone}</td>
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

**Action Items - You:**
1. Call pilot school principal
   - [ ] "Can we start Week 4? That's 2 weeks away"
   - [ ] "Here's what we'll set up: Student list, attendance, grades"
   - [ ] Get verbal commitment (document it)
   - [ ] Ask for sample data (list of students, classes)

2. Prepare pilot onboarding plan
   - [ ] Week 4: Data entry (you + engineer help)
   - [ ] Week 5: First attendance marking
   - [ ] Week 6: Reports + feedback

**EOD Success Criteria:**
- [ ] PATCH + DELETE endpoints working
- [ ] Photo upload working
- [ ] StudentList component renders
- [ ] 12+ tests passing
- [ ] 1 school LOI signed ✅

---

### Thursday (April 25)
**Code Review & Refinement**

**Backend Engineer:**
- [ ] Review all student endpoints for bugs
- [ ] Add input validation (name length, phone format, etc.)
- [ ] Add error handling for duplicate phone numbers
- [ ] Performance test: Create 1000 students, GET should be <500ms

```typescript
// Validation example
const validateStudent = (data) => {
  const errors = [];
  
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!data.parentPhone.match(/^[0-9]{10}$/)) {
    errors.push('Phone must be 10 digits');
  }
  
  if (!data.class) {
    errors.push('Class is required');
  }
  
  return errors;
};
```

**Frontend Engineer:**
- [ ] Style StudentForm + StudentList (Tailwind CSS)
- [ ] Add loading spinners
- [ ] Add error messages
- [ ] Test on mobile (responsiveness)

**You:**
1. Create API documentation (Swagger)
   - [ ] Document all 5 student endpoints
   - [ ] Add request/response examples
   - [ ] Generate HTML docs (`npm run docs`)

2. Prepare for Week 3
   - [ ] Attendance module requirements doc
   - [ ] Offline sync strategy
   - [ ] Push notification setup

**EOD Success Criteria:**
- [ ] All student endpoints production-ready
- [ ] Student module 100% tested
- [ ] Code review passed + merged
- [ ] API docs complete
- [ ] No technical debt

---

### Friday (April 26)
**Demo & Week Review**

**Demo (30 mins):**
1. Create student via web form ✅
2. See student list auto-refresh ✅
3. Search student by name ✅
4. See photo in student profile ✅
5. API docs visible ✅

**Metrics:**
- Code: 1,200 lines (backend) + 400 lines (frontend)
- Tests: 15 tests, 85% coverage
- Performance: API latency 150ms (P95)
- Team: 2 engineers productive

**Retrospective:**
- ✅ Went well: Student module complete, clean code
- ⚠️ Challenge: React hooks learning curve for frontend engineer
- 🎯 Improve: Daily code reviews instead of Thursday reviews

**Plan Week 3:**
- Attendance module (mark, sync, report)
- Real-time notifications
- Offline support

**Status Update:**

```
✅ WEEK 2 COMPLETE

Features Shipped:
  • Student CRUD API (5 endpoints)
  • React web component (StudentForm + StudentList)
  • Photo upload to Cloud Storage
  • Search functionality
  • 15 tests passing (85% coverage)

Infrastructure:
  • Cloud Run staging healthy
  • Firestore secure
  • CI/CD working (auto-deploy)
  • Monitoring alerts active

Team:
  • Backend engineer: 40 lines/hour velocity
  • Frontend engineer: Learning quickly
  • Morale: High 😊

Customers:
  • 1 school LOI signed (start Week 4)
  • 2 more interested (pending calls)

Next: Attendance module (Week 3)
```

---

## WEEK 3: Attendance & Scheduling Module
**Goal:** Attendance marking working, real-time sync, offline support, parent notifications

### Monday (April 29)
**Sprint Planning & Architecture**

**Attendance Module Requirements:**
1. Teacher marks attendance (1-click per student)
2. Real-time sync (offline → online)
3. Parent notification (SMS/WhatsApp when absent)
4. Attendance report (per student, per class)
5. Automatically calculate % attendance

**Backend Tasks:**
1. Create `attendance` collection in Firestore
2. Build POST attendance endpoint
3. Build GET attendance report endpoint
4. Implement Twilio SMS integration
5. Create Cloud Function for notifications

**Frontend Tasks:**
1. Create AttendanceMarker component (teacher app)
2. Create offline sync logic
3. Add attendance history view (parent app)
4. Show attendance % calculation

**You:**
- [ ] Meet with pilot school principal
  - "We want to mark attendance starting Week 4"
  - "Can we get your student list + classes by Tuesday?"
  - "Here's how it works..." (demo video)

- [ ] Set up Twilio account
  - [ ] Create Twilio project (https://www.twilio.com)
  - [ ] Verify phone number for testing
  - [ ] Add API credentials to `.env`
  - [ ] Set up SMS webhook (will use later for two-way)

---

### Tuesday (April 30)
**Backend - Attendance API**

```typescript
// src/routes/attendance.ts

// Mark attendance for a student
app.post('/api/v1/schools/:schoolId/attendance', async (req, res) => {
  const { date, classId, studentId, present, remarks } = req.body;
  const teacherId = req.user.uid; // From auth middleware
  
  try {
    // Validate input
    if (!date || !classId || !studentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const attendanceId = `${date}_${classId}_${studentId}`;
    const docRef = db.collection('attendance')
      .doc(req.params.schoolId)
      .collection('records')
      .doc(attendanceId);
    
    await docRef.set({
      date,
      classId,
      studentId,
      present,
      remarks: remarks || '',
      markedBy: teacherId,
      markedAt: new Date(),
      notified: false // Will be marked true after SMS sent
    });
    
    // Trigger notification job
    await triggerAttendanceNotification(req.params.schoolId, studentId, present);
    
    res.status(201).json({ attendanceId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance for a class on a date
app.get('/api/v1/schools/:schoolId/attendance', async (req, res) => {
  const { date, classId } = req.query;
  
  try {
    const snapshot = await db.collection('attendance')
      .doc(req.params.schoolId)
      .collection('records')
      .where('date', '==', date)
      .where('classId', '==', classId)
      .get();
    
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate class stats
    const present = records.filter(r => r.present).length;
    const total = records.length;
    
    res.json({
      records,
      stats: { present, absent: total - present, total }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student attendance history
app.get('/api/v1/schools/:schoolId/students/:studentId/attendance', async (req, res) => {
  const { fromDate, toDate } = req.query;
  
  try {
    const snapshot = await db.collection('attendance')
      .doc(req.params.schoolId)
      .collection('records')
      .where('studentId', '==', req.params.studentId)
      .where('date', '>=', fromDate)
      .where('date', '<=', toDate)
      .orderBy('date', 'desc')
      .get();
    
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate attendance percentage
    const present = records.filter(r => r.present).length;
    const percentage = Math.round((present / records.length) * 100);
    
    res.json({
      records,
      percentage,
      presentDays: present,
      totalDays: records.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function: Send SMS to parent if absent
async function triggerAttendanceNotification(schoolId, studentId, present) {
  if (present) return; // Only notify if absent
  
  try {
    // Get student details
    const studentDoc = await db.collection('students')
      .doc(schoolId)
      .collection('students')
      .doc(studentId)
      .get();
    
    const student = studentDoc.data();
    const parentPhone = student.parentPhone;
    
    // Queue SMS message
    const message = `Your child ${student.name} was absent today from ${student.class}. Contact school if queries.`;
    
    await sendSMS(parentPhone, message);
    
  } catch (error) {
    console.error('SMS notification failed:', error);
  }
}

// Send SMS via Twilio
async function sendSMS(phone, message) {
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: '+91' + phone // Assuming Indian phone number
  });
}
```

**Tests:**
```typescript
describe('Attendance API', () => {
  test('POST marks attendance for student', async () => {
    const res = await request(app)
      .post('/api/v1/schools/xyz/attendance')
      .send({
        date: '2026-04-30',
        classId: '8A',
        studentId: '123',
        present: true
      });
    expect(res.status).toBe(201);
  });
  
  test('GET returns class attendance summary', async () => {
    const res = await request(app)
      .get('/api/v1/schools/xyz/attendance?date=2026-04-30&classId=8A');
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.total).toBeGreaterThan(0);
  });
  
  test('Attendance percentage calculated correctly', async () => {
    const res = await request(app)
      .get('/api/v1/schools/xyz/students/123/attendance?fromDate=2026-04-01&toDate=2026-04-30');
    expect(res.body.percentage).toBeLessThanOrEqual(100);
    expect(res.body.percentage).toBeGreaterThanOrEqual(0);
  });
});
```

**Action Items - You:**
- [ ] Pilot school sends student list (Excel)
- [ ] Import data (manually or via script)

---

### Wednesday (May 1)
**Frontend - Attendance Marking & Offline Sync**

```jsx
// src/components/AttendanceMarker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function AttendanceMarker({ schoolId, classId }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    // Fetch students for this class
    fetchStudents();
    
    // Set up offline sync
    setupOfflineSync();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`/api/v1/schools/${schoolId}/students?class=${classId}`);
      setStudents(res.data);
      setAttendance({}); // Reset attendance for new day
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const setupOfflineSync = () => {
    // Listen for online/offline events
    window.addEventListener('online', syncPendingAttendance);
    window.addEventListener('offline', () => console.log('Offline mode'));
  };

  const syncPendingAttendance = async () => {
    if (pendingSync.length === 0) return;
    
    setSyncing(true);
    try {
      for (const record of pendingSync) {
        await axios.post(
          `/api/v1/schools/${schoolId}/attendance`,
          record,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setPendingSync([]);
      console.log('Sync complete');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    const today = new Date().toISOString().split('T')[0];
    const records = Object.entries(attendance).map(([studentId, present]) => ({
      date: today,
      classId,
      studentId,
      present
    }));
    
    // Try to sync immediately
    try {
      for (const record of records) {
        await axios.post(
          `/api/v1/schools/${schoolId}/attendance`,
          record,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert('Attendance saved');
    } catch (error) {
      // Save to pending if offline
      setPendingSync(prev => [...prev, ...records]);
      alert('Offline mode: Will sync when online');
    }
  };

  return (
    <div>
      <h2>Mark Attendance - Class {classId}</h2>
      
      {syncing && <p>Syncing...</p>}
      {pendingSync.length > 0 && <p>⚠️ {pendingSync.length} records pending sync</p>}
      
      <div className="student-list">
        {students.map(student => (
          <div key={student.id} className="student-row">
            <label>
              <input
                type="checkbox"
                checked={attendance[student.id] || false}
                onChange={() => toggleAttendance(student.id)}
              />
              {student.name} ({student.class})
            </label>
          </div>
        ))}
      </div>
      
      <button onClick={handleSave}>Save Attendance</button>
    </div>
  );
}
```

**Offline Sync Strategy:**
- Use IndexedDB (browser) to cache pending records
- On `online` event, POST all pending to server
- Use idempotency keys to prevent duplicates if sync retries

---

### Thursday (May 2)
**Cloud Function - Send Notifications**

Create Cloud Function to send SMS when attendance marked (absent):

```typescript
// functions/sendAttendanceNotification.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';

admin.initializeApp();

const db = admin.firestore();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const onAttendanceMarked = functions.firestore
  .document('attendance/{schoolId}/records/{attendanceId}')
  .onWrite(async (change, context) => {
    const { schoolId } = context.params;
    const attendance = change.after.data();
    
    // Only send if absent
    if (attendance.present) return;
    
    try {
      // Get student info
      const studentDoc = await db.collection('students')
        .doc(schoolId)
        .collection('students')
        .doc(attendance.studentId)
        .get();
      
      const student = studentDoc.data();
      
      // Send SMS
      const message = `Hi, ${student.name} absent in ${student.class} today. Update: School`;
      
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: `+91${student.parentPhone}`
      });
      
      // Mark as notified
      await change.after.ref.update({ notified: true });
      
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  });
```

Deploy Cloud Function:
```bash
firebase deploy --only functions
```

**Action Items - You:**
- [ ] Test SMS notification with pilot school
  - Mark student as absent
  - Verify parent receives SMS
  - Adjust message template based on feedback

---

### Friday (May 3)
**Demo & Week 3 Retrospective**

**Demo:**
1. Teacher marks 5 students present, 2 absent ✅
2. Attendance saved to Firestore ✅
3. Parent receives SMS about absent child ✅
4. Offline mode: Mark attendance without WiFi ✅
5. Sync: Auto-sync when WiFi returns ✅
6. Attendance report shows 71% (5/7) ✅

**Week 3 Metrics:**
- Code: 800 lines (backend) + 600 lines (frontend)
- Tests: 8 tests, 80% coverage
- API latency: 120ms (P95)
- SMS delivery: 100% success rate

**Retrospective:**
- ✅ Attendance module complete
- ⚠️ Offline sync needs better error handling
- 🎯 Next week: Add Attendance reporting

**Pilot School Update:**
- Ready for Week 4 go-live
- Will mark attendance starting Monday

```
✅ WEEK 3 COMPLETE

Features Shipped:
  • Attendance marking (teacher app)
  • Real-time sync (offline → online)
  • Parent SMS notifications
  • Attendance report (per student, per class)
  • Attendance % calculation

Infrastructure:
  • Twilio integrated for SMS
  • Cloud Function sending notifications
  • Offline sync robust

Team:
  • 2 engineers productive
  • Code quality high (80% coverage)

Pilot School:
  • Live & marking attendance daily
  • 45 students, 5 classes
  • Teacher feedback: "Easy to use"

Next: Grades module (Week 4-5)
   + Attendance reporting enhancements
```

---

## WEEK 4: Grades & Report Cards Module (Phase 1)
**Goal:** Teachers can enter marks, report cards generated, parent portal shows grades

### Monday (May 6)
**Sprint Planning - Grades Module**

**Requirements:**
1. Teacher enters marks (test, assignment, exam)
2. Weighted average calculation
3. Report card PDF generation
4. Parent view real-time grades (not once/year)
5. Class analytics (top 10, bottom 10, average)

**Firestore Schema:**
```
grades/
  schoolId/
    academicYear/
      termId/
        classId/
          studentId/
            subject/
              assignment1: 18/20
              test1: 72/100
              exam: 85/100
              weightedAverage: 79.5
              grade: "B+"
```

**Backend Tasks:**
1. POST grades endpoint (teacher enters marks)
2. GET transcript (student view)
3. GET class analytics
4. Cloud Function: Generate report card PDF

**Frontend Tasks:**
1. MarksForm component (teacher marks entry)
2. GradeCard component (parent view)
3. TranscriptView (student view)

---

### Tuesday-Thursday (May 7-9)
**Backend Engineer - Grades API**

```typescript
// src/routes/grades.ts

// POST: Teacher enters marks
app.post('/api/v1/schools/:schoolId/grades', async (req, res) => {
  const { academicYear, termId, classId, studentId, subject, assessment, marks } = req.body;
  const teacherId = req.user.uid;
  
  try {
    // Validate: Only class teacher can enter marks
    const classDoc = await db.collection('classes')
      .doc(req.params.schoolId)
      .collection('classes')
      .doc(classId)
      .get();
    
    if (classDoc.data().teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const docRef = db.collection('grades')
      .doc(req.params.schoolId)
      .collection('grades')
      .doc(`${academicYear}_${termId}_${classId}_${studentId}_${subject}`);
    
    // Get existing grades to calculate weighted average
    const existing = await docRef.get();
    const data = existing.data() || {};
    
    // Update assessment
    data[assessment] = marks;
    
    // Calculate weighted average
    // assumption: assignment 20%, test 30%, exam 50%
    const weights = { assignment1: 0.2, test1: 0.3, exam: 0.5 };
    let total = 0;
    let weightSum = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (data[key] !== undefined) {
        total += data[key] * weight;
        weightSum += weight;
      }
    }
    
    const weightedAverage = weightSum > 0 ? (total / weightSum).toFixed(2) : null;
    
    // Assign grade (A+, A, B+, B, C, etc.)
    const grade = getGrade(weightedAverage);
    
    data.weightedAverage = weightedAverage;
    data.grade = grade;
    data.updated_at = new Date();
    
    await docRef.set(data);
    
    res.json({ ...data, studentId, subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Get student transcript
app.get('/api/v1/schools/:schoolId/students/:studentId/grades', async (req, res) => {
  const { academicYear, termId } = req.query;
  
  try {
    const snapshot = await db.collection('grades')
      .doc(req.params.schoolId)
      .collection('grades')
      .where('academicYear', '==', academicYear)
      .where('termId', '==', termId)
      .where('studentId', '==', req.params.studentId)
      .get();
    
    const grades = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      grades[data.subject] = {
        marks: data,
        grade: data.grade,
        weightedAverage: data.weightedAverage
      };
    });
    
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Class analytics
app.get('/api/v1/schools/:schoolId/classes/:classId/grades/analytics', async (req, res) => {
  const { academicYear, termId } = req.query;
  
  try {
    const snapshot = await db.collection('grades')
      .doc(req.params.schoolId)
      .collection('grades')
      .where('academicYear', '==', academicYear)
      .where('termId', '==', termId)
      .where('classId', '==', req.params.classId)
      .get();
    
    // Aggregate by subject
    const bySubject = {};
    const students = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Subject analytics
      if (!bySubject[data.subject]) {
        bySubject[data.subject] = [];
      }
      bySubject[data.subject].push(data.weightedAverage);
      
      // Student analytics
      if (!students[data.studentId]) {
        students[data.studentId] = [];
      }
      students[data.studentId].push(data.weightedAverage);
    });
    
    // Calculate averages
    const subjectAnalytics = {};
    for (const [subject, marks] of Object.entries(bySubject)) {
      const avg = marks.reduce((a, b) => a + b) / marks.length;
      subjectAnalytics[subject] = {
        average: avg.toFixed(2),
        count: marks.length
      };
    }
    
    // Top 10 students
    const studentAvgs = Object.entries(students)
      .map(([studentId, marks]) => ({
        studentId,
        average: (marks.reduce((a, b) => a + b) / marks.length).toFixed(2)
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
    
    res.json({
      bySubject: subjectAnalytics,
      topStudents: studentAvgs,
      classAverage: Object.values(subjectAnalytics)
        .reduce((sum, s) => sum + parseFloat(s.average), 0) / Object.keys(subjectAnalytics).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Convert marks to grade
function getGrade(average) {
  const avg = parseFloat(average);
  if (avg >= 90) return 'A+';
  if (avg >= 80) return 'A';
  if (avg >= 70) return 'B+';
  if (avg >= 60) return 'B';
  if (avg >= 50) return 'C';
  return 'D';
}
```

**Frontend Engineer - MarksForm Component:**

```jsx
// src/components/MarksForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export function MarksForm({ schoolId, classId, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    const res = await axios.get(`/api/v1/schools/${schoolId}/students?class=${classId}`);
    setStudents(res.data);
  };

  const handleMarkChange = (studentId, subject, assessment, value) => {
    setMarks(prev => ({
      ...prev,
      [`${studentId}_${subject}_${assessment}`]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const key in marks) {
        const [studentId, subject, assessment] = key.split('_');
        await axios.post(
          `/api/v1/schools/${schoolId}/grades`,
          {
            academicYear: '2026',
            termId: 'term1',
            classId,
            studentId,
            subject,
            assessment,
            marks: parseFloat(marks[key])
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert('Marks saved');
      onSuccess();
    } catch (error) {
      console.error('Error saving marks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Enter Marks for {classId}</h2>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Subject</th>
            <th>Assignment (20%)</th>
            <th>Test (30%)</th>
            <th>Exam (50%)</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student =>
            ['English', 'Maths', 'Science', 'Social'].map(subject => (
              <tr key={`${student.id}_${subject}`}>
                <td>{student.name}</td>
                <td>{subject}</td>
                <td>
                  <input
                    type="number"
                    max="20"
                    onChange={(e) =>
                      handleMarkChange(student.id, subject, 'assignment1', e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    max="100"
                    onChange={(e) =>
                      handleMarkChange(student.id, subject, 'test1', e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    max="100"
                    onChange={(e) =>
                      handleMarkChange(student.id, subject, 'exam', e.target.value)
                    }
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Marks'}
      </button>
    </div>
  );
}
```

**PDF Generation (Cloud Function):**

```typescript
// functions/generateReportCard.ts
import * as functions from 'firebase-functions';
import * as jsPDF from 'jspdf';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onGradesUpdated = functions.firestore
  .document('grades/{schoolId}/grades/{gradeId}')
  .onWrite(async (change, context) => {
    const { schoolId } = context.params;
    
    // Trigger report card generation
    await generateAndStoreReportCard(schoolId);
  });

async function generateAndStoreReportCard(schoolId) {
  try {
    const db = admin.firestore();
    const storage = admin.storage();
    
    // Get all grades for student (for full transcript)
    // Generate PDF
    const pdf = new jsPDF();
    pdf.text('Report Card', 10, 10);
    // ... Add grades, subjects, etc to PDF
    
    // Save to Cloud Storage
    const bucket = storage.bucket();
    const fileBuffer = pdf.output('arraybuffer');
    const file = bucket.file(`reports/${schoolId}/reportcard_${Date.now()}.pdf`);
    
    await file.save(fileBuffer);
    
    // Get signed URL
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log('Report card generated:', url);
  } catch (error) {
    console.error('Error generating report card:', error);
  }
}
```

---

### Friday (May 10)
**Demo & Week 4 Completion**

**Demo:**
1. Teacher enters marks for 45 students ✅
2. Report card PDF generated ✅
3. Parent sees report card via email ✅
4. Class analytics show top 10 students ✅
5. Weighted averages calculated correctly ✅

**Week 4 Status:**
- 4 modules operational: Students, Attendance, Grades (partial)
- 2 teams productive, 20+ tests passing
- Pilot school: 2 weeks in, teacher feedback positive

```
✅ WEEKS 1-4 SUMMARY

Modules Complete:
  ✅ Students (CRUD, search, photos)
  ✅ Attendance (marking, sync, SMS)
  ✅ Grades (marks entry, weighted avg, PDF)

Next: Exams, Communication, Finance (Weeks 5-16)
```

---

## WEEKS 5-8: EXAMS & ACADEMIC COMPLETION
[Similar detailed breakdown for each week...]

## WEEKS 9-12: COMMUNICATION & FINANCE
[Similar detailed breakdown for each week...]

## WEEKS 13-16: HR & OPERATIONS
[Similar detailed breakdown for each week...]

## WEEKS 17-20: ANALYTICS & TESTING
[Similar detailed breakdown for each week...]

##WEEKS 21-24: POLISH, SECURITY & LAUNCH
[Similar detailed breakdown for each week...]

---

# CONSOLIDATED TRACKING SHEET (All 24 Weeks)

| Week | Phase | Focus | Backend (LOC) | Frontend (LOC) | Tests | Deploy | Pilot Status |
|------|-------|-------|---------------|----------------|-------|--------|--------------|
| 1 | Foundation | Infrastructure | 500 | 0 | 5 | Cloud Run ✅ | Setup |
| 2 | Workflows | Students | 1,200 | 400 | 15 | Staging | LOI Signed |
| 3 | Workflows | Attendance | 800 | 600 | 8 | Staging | Active |
| 4 | Workflows | Grades P1 | 700 | 500 | 10 | Staging | Active |
| 5 | Workflows | Grades P2 | 600 | 400 | 8 | Staging | Active |
| 6 | Workflows | Exams P1 | 900 | 600 | 12 | Staging | Testing |
| 7 | Workflows | Exams P2 | 800 | 500 | 10 | Staging | Testing |
| 8 | Workflows | Exams P3 | 600 | 400 | 8 | Staging | Going Live |
| 9 | Operations | Communication | 700 | 500 | 10 | Staging | 3 Schools |
| 10 | Operations | Finance P1 | 800 | 600 | 12 | Staging | 5 Schools |
| 11 | Operations | Finance P2 | 600 | 400 | 8 | Staging | 10 Schools |
| 12 | Operations | Finance P3 | 500 | 300 | 6 | Staging | 15 Schools |
| 13 | Intelligence | HR Module | 700 | 500 | 10 | Staging | 20 Schools |
| 14 | Polish | Testing Suite | 400 | 300 | 20 | Prod | 30 Schools |
| 15 | Polish | Security Audit | 300 | 200 | 15 | Prod | 35 Schools |
| 16 | Polish | Performance | 400 | 250 | 12 | Prod | 40 Schools |
| 17 | Intelligence | Analytics P1 | 600 | 400 | 8 | Staging | 45 Schools |
| 18 | Intelligence | Analytics P2 | 500 | 350 | 7 | Staging | 50 Schools |
| 19 | Intelligence | Dashboards | 400 | 400 | 8 | Prod | 60 Schools |
| 20 | Launch | Final Polish | 300 | 250 | 10 | Prod | 70 Schools |
| 21 | Launch | Documentation | 100 | 100 | 5 | Prod | 80 Schools |
| 22 | Launch | Staging Tests | 200 | 150 | 15 | Staging | 85 Schools |
| 23 | Launch | Marketing | 50 | 300 | 5 | Prod | 90 Schools |
| 24 | Launch | Go-Live | 100 | 100 | 10 | PROD | 100+ Schools |

---

# KEY SUCCESS METRICS TO TRACK DAILY

## Engineering Metrics
- **Code Velocity:** Lines committed per day (target: 50-100/day)
- **Test Coverage:** % of code covered by tests (target: 80%+)
- **Build Health:** % of builds passing (target: 100%)
- **Code Review Time:** Hours from PR submission to merge (target: <4 hours)
- **Bug Escape Rate:** Bugs found in production (target: <1% of all bugs)

## Quality Metrics
- **API Latency:** P95 response time (target: <200ms)
- **Error Rate:** % of failed requests (target: <0.5%)
- **Uptime:** % availability (target: 99.9%)
- **Performance:** Page load time (target: <2s)
- **Mobile:** Lighthouse score (target: >90)

## Customer Metrics (Post-Week 4)
- **Active Schools:** Number of schools using product
- **Daily Active Users:** Teachers + parents logging in daily
- **Feature Adoption:** % using each module
- **Support Tickets:** Response time <4 hours
- **NPS:** Net Promoter Score (target: >50)

## Team Metrics
- **Productivity:** Story points completed per sprint
- **Happiness:** Team morale (weekly pulse check)
- **Turnover:** Team retention (target: 100%)
- **Collaboration:** Code review quality + feedback

## Financial Metrics (Post-Launch)
- **MRR:** Monthly Recurring Revenue
- **CAC:** Customer Acquisition Cost
- **LTV:** Lifetime Value
- **Churn:** % customers leaving per month (target: <5%)
- **Burn Rate:** Monthly operational cost (management target)

---

# RISK MANAGEMENT CHECKLIST

## Week 1-4 Risks
- [ ] **Hiring delays:** Start recruiting Week 1, have backup contractors
- [ ] **Firestore costs:** Monitor daily, set alerts for > ₹5K/month
- [ ] **Feature creep:** Lock scope after Week 2, no new features
- [ ] **API bugs:** Extensive testing before pilot school

## Week 5-12 Risks
- [ ] **Performance degradation:** Load test weekly (1000 virtual users)
- [ ] **Customer churn:** Talk to pilot school weekly, iterate
- [ ] **Data loss:** Implement backup + test restore

## Week 13-20 Risks
- [ ] **Scaling issues:** Prepare for 10K concurrent users
- [ ] **Security vulnerabilities:** Penetration test Week 15
- [ ] **Compliance:** GDPR, data residency for EU

## Week 21-24 Risks
- [ ] **Launch day outage:** Have rollback plan
- [ ] **Marketing failure:** Start outreach Week 15
- [ ] **Customer support overwhelm:** Hire support person Week 20

---

**This 24-week plan is your execution roadmap. Review weekly, adjust based on learnings, but don't lose sight of the big picture: 100 schools live by Week 24.**

