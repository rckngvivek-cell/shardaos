# WEEK3_QUICK_START_GUIDE.md
# Week 3 Quick Start Guide: Day 1 Kickoff (April 10, 2026)

**Purpose:** Get teams moving in first 2 hours  
**Audience:** All developers ready to code  
**Time Estimate:** 120 minutes (9 AM - 11 AM)

---

## ⚡ FIRST 2 HOURS CHECKLIST

```
MINUTE 0-15:   Environment Setup
├─ Git branches pulled
├─ Dependencies installed  
├─ Local dev server running
└─ Slack notifications enabled

MINUTE 15-30:  Documentation Review
├─ Read Doc 42 (Strategy) - 10 min
├─ Skim Doc 45 (Today's tasks) - 5 min
└─ Ask questions in Slack - 5 min

MINUTE 30-45:  Code Setup
├─ Create feature branches
├─ Scaffolding generated
└─ Initial scaffolds pushed

MINUTE 45-60:  First Task Started
├─ Backend: Auth endpoint groundwork
├─ Frontend: Login page setup
└─ DevOps: Infrastructure ready

MINUTE 60-120: Primary Development
├─ 50% implementation work
├─ Getting unblocked
└─ First code ready for review

TARGET: By 11 AM, all teams have working local setup
```

---

## 🔧 ENVIRONMENT SETUP (10 MIN)

### Backend Setup
```bash
# Clone / pull latest
git clone [repo] || git pull origin main

# Install dependencies
npm install

# Create branch
git checkout -b feat/staff-auth-day1

# Start local API server
npm run dev:api

# Verify running
curl http://localhost:3001/health
# Should return: { "status": "ok" }
```

### Frontend Setup
```bash
# Clone / pull latest
git clone [repo] || git pull origin main

# Install dependencies
npm install

# Create branch
git checkout -b feat/staff-portal-day1

# Start local frontend
npm run dev:frontend

# Verify running
# http://localhost:3000 should load
```

### DevOps Setup
```bash
# Verify Terraform installed
terraform --version  # v1.5+

# Check GCP credentials
gcloud auth list

# Create branch
git checkout -b infra/week3-setup

# Dry-run infrastructure
terraform plan -var-file=values.dev.tfvars
```

### QA Setup
```bash
# Clone testing repo
git clone [test-repo] || git pull origin main

# Install test dependencies
npm install

# Create branch
git checkout -b test/staff-portal-day1

# Start test server (if separate)
npm run test:server
```

---

## 📖 QUICK READ: TODAY'S TASKS (15 MIN)

### BACKEND DEVELOPER - Day 1 Tasks

**Task 1: Set up Staff Auth Routes (2 hours)**
```
Location: src/api/v1/staff/auth.ts
Task:
  ├─ POST /auth/login           (30 min)
  ├─ POST /auth/logout          (20 min)
  ├─ GET  /auth/me              (20 min)
  └─ Middleware: verify token   (20 min)

Code Template:
  app.post('/api/v1/staff/login', validateLoginInput, (req, res) => {
    // Find staff in Firestore
    // Verify password
    // Create JWT token
    // Return token + staff data
  });

Tests: Auth should pass 8/8
Success: Login returns token + staffId
```

**Task 2: Firestore Setup (1.5 hours)**
```
Location: src/firestore/collections.ts
Task:
  ├─ Create 'staff' collection
  ├─ Create 'staffRoles' collection
  ├─ Create security rules
  └─ Add test data (5 staff records)

Schema for 'staff' collection:
  {
    id: string (auto),
    email: string (unique),
    name: string,
    password_hash: string,
    role: 'admin' | 'staff' | 'teacher',
    school_id: string,
    created_at: timestamp,
    updated_at: timestamp
  }

Success: Firestore has 5 test staff records
```

**Task 3: JWT Integration (1 hour)**
```
Location: src/utils/jwt.ts
Task:
  ├─ Generate token method
  ├─ Verify token method
  ├─ Token refresh logic
  └─ Error handling

Code:
  export function generateToken(staffId: string, role: string) {
    return jwt.sign(
      { staffId, role, iat: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

Success: Create token → verify token → success
```

**Deliverable EOD:** GitHub PR ready for review with 3 green checkmarks ✅✅✅

---

### FRONTEND DEVELOPER - Day 1 Tasks

**Task 1: Create Login Page (1.5 hours)**
```
Location: src/pages/StaffLoginPage.tsx
Task:
  ├─ Material-UI form layout
  ├─ Email + password inputs
  ├─ Error message display
  └─ Submit button + loading state

Component Structure:
  export function StaffLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
      setLoading(true);
      try {
        const { token, staff } = await login(email, password);
        localStorage.setItem('token', token);
        navigate('/staff/dashboard');
      } finally {
        setLoading(false);
      }
    };
  }

Success: Form renders, inputs work, submit button responsive
```

**Task 2: Redux Staff Slice Setup (1 hour)**
```
Location: src/redux/staffSlice.ts
Task:
  ├─ Define state shape
  ├─ Reducers: setStaff, clearStaff
  ├─ Thunks: login, logout, fetchMe
  └─ Selectors: selectStaff, selectToken

Code:
  const staffSlice = createSlice({
    name: 'staff',
    initialState: { data: null, token: null, loading: false },
    reducers: {
      setStaff: (state, action) => {
        state.data = action.payload.staff;
        state.token = action.payload.token;
      },
      clearStaff: (state) => {
        state.data = null;
        state.token = null;
      }
    }
  });

Success: Redux actions dispatch correctly
```

**Task 3: RTK Query Hook (1 hour)**
```
Location: src/api/staffApi.ts
Task:
  ├─ Create useLoginMutation
  ├─ Create useGetMeQuery
  ├─ Error handling
  └─ Cache invalidation

Code:
  export const useLoginMutation = () => {
    const [login] = useLoginAPIEndpoint();
    return (email, password) => {
      return login({ email, password })
        .then(res => {
          dispatch(setStaff(res));
          return res;
        });
    };
  };

Success: RTK hook works with Redux integration
```

**Deliverable EOD:** GitHub PR ready for review with 3 green checkmarks ✅✅✅

---

### DEVOPS ENGINEER - Day 1 Tasks

**Task 1: Verify Dev Environment (1 hour)**
```
Task:
  ├─ GCP project initialized
  ├─ Service account configured
  ├─ Terraform initialized
  └─ Local dev values file ready

Checklist:
  □ gcloud auth login successful
  □ PROJECT_ID set: echo $PROJECT_ID
  □ terraform init completed
  □ terraform/values.dev.tfvars exists
  □ All service accounts created

Command:
  terraform plan -var-file=values.dev.tfvars
  Output should show: Plan: X resources
```

**Task 2: Deploy Dev Firestore (1 hour)**
```
Task:
  ├─ Firestore instance deployed
  ├─ Indexes created
  ├─ Life cycle configured
  └─ Backup enabled

Terraform:
  resource "google_firestore_database" "dev" {
    project  = var.project_id
    name     = "dev"
    location = "us-central1"
    type     = "FIRESTORE_NATIVE"
  }

Verify:
  gcloud firestore databases list
  Should show: dev database → READY
```

**Task 3: Cloud Run Readiness (1 hour)**
```
Task:
  ├─ Service account created
  ├─ Roles assigned
  ├─ Artifact Registry configured
  └─ Build trigger ready

Commands:
  # Create service account
  gcloud iam service-accounts create week3-cloud-run
  
  # Set roles
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:week3-cloud-run@... \
    --role=roles/run.admin

Verify:
  gcloud run services list
  Should show cloud run is ready to deploy
```

**Deliverable EOD:** Terraform deployments successful, dev environment ready

---

### QA ENGINEER - Day 1 Tasks

**Task 1: Test Plan for Auth (1 hour)**
```
Location: test/auth.spec.ts
Task:
  ├─ Define 8 test cases
  ├─ Setup test fixtures
  ├─ Mock Firestore
  └─ Mock JWT

Test Cases:
  1. Valid login → returns token
  2. Invalid password → error
  3. Non-existent user → error
  4. Missing email → validation error
  5. Missing password → validation error
  6. Logout → clears session
  7. Verify token → success
  8. Expired token → error

Code:
  describe('Staff Authentication', () => {
    it('should login with valid credentials', async () => {
      const result = await login('test@school.com', 'password');
      expect(result.token).toBeDefined();
      expect(result.staff.id).toBeDefined();
    });
  });

Target: All 8 tests passing by EOD
```

**Task 2: API Testing Setup (1 hour)**
```
Task:
  ├─ Install Supertest
  ├─ Configure jest
  ├─ Setup database fixtures
  └─ Create API test suite template

Template:
  const request = require('supertest');
  const app = require('../app');
  
  describe('POST /api/v1/staff/auth/login', () => {
    it('should return token on valid login', async () => {
      const res = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({ email: 'test@school.com', password: 'pwd' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

Target: Test suite runnable with npm test
```

**Task 3: Test Coverage Setup (1 hour)**
```
Task:
  ├─ Configure coverage reporting
  ├─ Set baseline (target 80%)
  ├─ Create coverage dashboard
  └─ Setup CI integration

Commands:
  npm test -- --coverage
  
  Output should show:
  ├─ Statements: X%
  ├─ Branches: X%
  ├─ Functions: X%
  └─ Lines: X%

Target: Coverage reporting working
```

**Deliverable EOD:** Test suite running, 8 auth tests passing, coverage baseline set

---

## 🚀 TASK PRIORITIES

### Must-Do (0-2 hours)
1. ✅ Environment setup verified
2. ✅ All tools running locally
3. ✅ Feature branches created
4. ✅ First scaffold in place

### Should-Do (2-4 hours)
1. ✅ Auth endpoints started
2. ✅ Login page component scaffolding
3. ✅ Redux setup
4. ✅ Test suite initialized

### Nice-to-Do (4+ hours)
1. ✅ Auth fully working
2. ✅ Login page functional
3. ✅ RTK Query integrated
4. ✅ Tests passing

---

## 💻 COMMON STARTING COMMANDS

### Backend Developer
```bash
# Terminal 1: Start API
cd backend
npm install
npm run dev:api

# Terminal 2: Watch tests
npm run test:watch

# Terminal 3: Utilities
npm run migrate:firestore
npm run seed:dev
```

### Frontend Developer
```bash
# Terminal 1: Start dev server
cd frontend
npm install
npm run dev:frontend

# Terminal 2: Watch tests
npm run test:watch

# Terminal 3: Storybook (optional)
npm run storybook
```

### DevOps Engineer
```bash
# Terminal 1: Terraform workspace
cd infrastructure
terraform init
terraform workspace select dev

# Terminal 2: Monitor
gcloud compute instances list --filter="labels.env=dev"
```

### QA Engineer
```bash
# Terminal 1: Test runner
cd testing
npm install
npm run test:watch

# Terminal 2: Coverage
npm test -- --coverage --watch
```

---

## 🎯 SUCCESS CRITERIA FOR DAY 1

### Backend Developer ✅
- [ ] Auth routes file created
- [ ] Login endpoint returns token
- [ ] JWT middleware working
- [ ] 3 Firestore collections created
- [ ] 5 test staff records in Firestore
- [ ] PR submitted with 3 reviews requested

### Frontend Developer ✅
- [ ] Login page rendering
- [ ] Redux staff slice working
- [ ] RTK Query hooks defined
- [ ] Form inputs functional
- [ ] Error messages displaying
- [ ] PR submitted with 3 reviews requested

### DevOps Engineer ✅
- [ ] Dev environment verified
- [ ] Firestore deployed
- [ ] Cloud Run service ready
- [ ] Terraform plan succeeds
- [ ] All infrastructure operational

### QA Engineer ✅
- [ ] 8 auth test cases written
- [ ] All tests passing
- [ ] API test template created
- [ ] Coverage baseline established
- [ ] Test report generated

---

## 📞 GETTING HELP

### Before Asking Questions
1. Check relevant documentation (Doc 42-45)
2. Search codebase for similar patterns
3. Check GitHub issues/discussions
4. Ask in Slack channel

### Quick Links
- **Live Docs:** All in `files/` directory
- **API Docs:** `STAFF_PORTAL_TECHNICAL_SPECS.md`
- **Architecture:** `REALTIME_WEBSOCKET_ARCHITECTURE.md`
- **Daily Tasks:** `WEEK3_MASTER_IMPLEMENTATION_GUIDE.md`

### Slack Channels
- 🔴 **#week3-implementation** - General discussion
- 🟢 **#code-review** - PR reviews
- 🔵 **#deployment** - DevOps updates
- 🟡 **#testing** - QA findings

---

## ⏱️ TIMELINE FOR DAY 1

```
9:00 AM - 9:15 AM   │ Environment setup complete
9:15 AM - 9:45 AM   │ Documentation review + questions
9:45 AM - 10:30 AM  │ Scaffolding + branch setup
10:30 AM - 11:00 AM │ First code committed
11:00 AM - 12:30 PM │ Primary development (50% done)
12:30 PM - 1:00 PM  │ Lunch / Break
1:00 PM - 4:00 PM   │ Primary development (90% done)
4:00 PM - 4:30 PM   │ Team Standup (4 PM IST)
4:30 PM - 5:00 PM   │ PR finalization
5:00 PM - 6:00 PM   │ Final testing + merge
6:00 PM              │ Day 1 complete ✅
```

---

## 🎓 REFERENCE QUICK LINKS

By Role:

**Backend Developer**
- [Staff Auth Endpoints Spec](42_WEEK3_IMPLEMENTATION_STRATEGY.md#staff-authentication)
- [Firestore Schema](43_STAFF_PORTAL_TECHNICAL_SPECS.md#firestore-schema)
- [API Endpoints](43_STAFF_PORTAL_TECHNICAL_SPECS.md#api-endpoints)
- [Day 1 Tasks](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#day-1-tasks)

**Frontend Developer**
- [StaffLoginPage Spec](43_STAFF_PORTAL_TECHNICAL_SPECS.md#staffloginpage)
- [Redux Integration](43_STAFF_PORTAL_TECHNICAL_SPECS.md#redux-integration)
- [RTK Query Hooks](43_STAFF_PORTAL_TECHNICAL_SPECS.md#rtk-query-hooks)
- [Day 1 Tasks](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#day-1-tasks)

**DevOps Engineer**
- [Infrastructure Requirements](42_WEEK3_IMPLEMENTATION_STRATEGY.md#infrastructure)
- [Firestore Setup](44_REALTIME_WEBSOCKET_ARCHITECTURE.md#firestore)
- [Cloud Run Config](44_REALTIME_WEBSOCKET_ARCHITECTURE.md#cloud-run)
- [Day 1 Tasks](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#day-1-tasks)

**QA Engineer**
- [Testing Strategy](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#testing-strategy)
- [Auth Test Cases](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#auth-test-matrix)
- [Coverage Targets](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#coverage-targets)
- [Day 1 Tasks](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md#day-1-tasks)

---

## ✨ YOU'RE READY TO GO!

**Remember:**
- You have everything you need documented
- Questions? Slack first
- Code review? 2 approvals needed
- Tests? Must pass before PR merge
- Production-ready? That's the standard

**Let's go! 🚀**

Start coding at 9:00 AM IST on April 10, 2026.  
See you at standup at 4 PM!

---

**Document Owner:** Lead Architect  
**Last Updated:** April 9, 2026  
**Next Update:** April 11, 2026 (after Day 1 retrospective)
