# CUSTOMER ONBOARDING FLOW
## School Setup, User Management, Configuration & Go-Live

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** Production-Ready  

---

# PART 1: SCHOOL REGISTRATION FLOW

## Step 1: Initial School Registration

```
Website Landing Page
    ↓
Click "Get Started" / "Sign Up School"
    ↓
Registration Form Appears
    ├─ School Name *
    ├─ School Email *
    ├─ Principal Name *
    ├─ Principal Phone *
    ├─ City / State *
    ├─ School Board (CBSE/ICSE/State)
    ├─ Number of Students (estimate)
    ├─ Which modules? (Attendance, Grades, Exams)
    └─ How did you hear about us?
    ↓
Email Verification (OTP sent)
    ↓
Account Created (free trial - 30 days)
    ↓
Admin Dashboard Opens [First-Time Setup]
```

## Registration API

```typescript
// POST /api/v1/schools/register
export async function registerSchool(req: express.Request, res: express.Response): Promise<void> {
  const {
    schoolName,
    email,
    principalName,
    principalPhone,
    city,
    state,
    schoolBoard,
    estimatedStudents,
    modulePreferences,
  } = req.body;

  // Validation
  if (!schoolName || !email || !principalName) {
    throw new ValidationError('Missing required fields');
  }

  // Check duplicate
  const existing = await firestore
    .collection('schools')
    .where('email', '==', email)
    .get();

  if (!existing.empty) {
    throw new ConflictError('DUPLICATE_EMAIL', 'School with this email already registered');
  }

  // Create school
  const schoolRef = await firestore.collection('schools').add({
    schoolName,
    email,
    principalName,
    principalPhone,
    city,
    state,
    schoolBoard,
    estimatedStudents,
    modulePreferences,
    status: 'trial', // trial / active / suspended
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    onboardingStatus: 'email_verification_pending', // Step 1 of onboarding
  });

  // Send verification email
  await sendVerificationEmail(email, schoolRef.id);

  res.status(201).json({
    success: true,
    data: {
      schoolId: schoolRef.id,
      message: 'School registered. Please verify your email.',
    },
  });
}
```

---

# PART 2: EMAIL VERIFICATION & ADMIN SETUP

## Step 2: Email Verification

```
Email Received: "Verify Your School ERP Account"
Link: https://app.schoolerp.io/verify?token=abc123&school=school_001
    ↓
Click Link
    ↓
Email Verified ✓
Redirect to Admin Setup
```

## Step 3: Create Admin Account

```
Admin Setup Form
    ├─ First Name *
    ├─ Last Name *
    ├─ Email (auto-filled from registration)
    ├─ Password (with strength indicator)
    └─ Confirm Password *
    ↓
Account Created
    ↓
Admin Dashboard Loaded [Onboarding: Step 1/5]
```

```typescript
// POST /api/v1/auth/setup-admin
export async function setupAdmin(req: express.Request, res: express.Response): Promise<void> {
  const { schoolId, firstName, lastName, password } = req.body;

  // Get school
  const schoolDoc = await firestore.collection('schools').doc(schoolId).get();
  if (!schoolDoc.exists) {
    throw new NotFoundError('school', schoolId);
  }

  const schoolEmail = schoolDoc.data()!.email;

  // Create Firebase user
  const userRecord = await admin.auth().createUser({
    email: schoolEmail,
    password,
    displayName: `${firstName} ${lastName}`,
  });

  // Create user document
  await firestore.collection('users').doc(userRecord.uid).set({
    schoolId,
    firstName,
    lastName,
    email: schoolEmail,
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
  });

  // Update school onboarding status
  await firestore.collection('schools').doc(schoolId).update({
    onboardingStatus: 'admin_created',
    adminId: userRecord.uid,
  });

  res.status(201).json({
    success: true,
    data: {
      uid: userRecord.uid,
      token: await userRecord.getIdToken(),
      message: 'Admin account created. Let\'s set up your school!',
    },
  });
}
```

---

# PART 3: GUIDED ONBOARDING (5-STEP WIZARD)

## Onboarding Checklist UI

```
Step 1/5: School Information ✓
├─ School Name
├─ School Type (Public/Private)
├─ Board (CBSE/ICSE/State)
├─ Academic Year (2026-2027)
└─ Academic Calendar (Jan-Dec / Apr-Mar)

Step 2/5: Classes & Sections (IN PROGRESS)
├─ Number of Classes (1-12)
├─ Sections per class (A, B, C...)
├─ Class-wise fee (optional)
└─ Total Students estimate

Step 3/5: Users & Permissions
├─ Add Teachers
├─ Add Office Staff
├─ Assign Roles & Permissions
└─ Send Invitations

Step 4/5: Module Configuration
├─ Enable/Disable Attendance
├─ Enable/Disable Grades
├─ Enable/Disable Exams
├─ Enable/Disable Fees
└─ Custom Settings

Step 5/5: Review & Go Live
├─ Final review of settings
├─ Sample data imported
└─ Ready to launch!
```

## Step 2 API

```typescript
// POST /api/v1/schools/:schoolId/setup/classes
export async function setupClasses(req: express.Request, res: express.Response): Promise<void> {
  const { schoolId } = req.params;
  const { classes, acadmicYear, calendarType } = req.body;

  // Validate
  if (!classes || classes.length === 0) {
    throw new ValidationError('At least 1 class required', {
      classes: 'Classes array cannot be empty',
    });
  }

  // Create class documents
  const classDocs = await Promise.all(
    classes.map(async (cls: any) => {
      return firestore
        .collection('schools')
        .doc(schoolId)
        .collection('classes')
        .add({
          classNumber: cls.classNumber,
          classTeacher: null,
          sections: cls.sections || ['A'],
          maxStudents: cls.maxStudents || 50,
          feeAmount: cls.feeAmount || 0,
          createdAt: new Date(),
        });
    })
  );

  // Update school
  await firestore.collection('schools').doc(schoolId).update({
    academicYear,
    calendarType,
    onboardingStatus: 'classes_created',
    classCount: classes.length,
  });

  res.json({
    success: true,
    data: {
      classCount: classDocs.length,
      message: 'Classes created successfully',
    },
  });
}
```

---

# PART 4: USER MANAGEMENT & INVITATIONS

## Adding Teachers

```
Teachers Section
    ├─ List of existing teachers
    ├─ Add New Teacher button
    │
    └─ Add Teacher Form
        ├─ First Name *
        ├─ Last Name *
        ├─ Email (must be unique per school)
        ├─ Phone
        ├─ Subject specialization
        ├─ Classes assigned (multi-select)
        ├─ Grant Attendance Permission? ☑
        ├─ Grant Grades Permission? ☑
        └─ [Send Invitation]
        
        ↓
        
    Email sent: "You've been invited to School ERP"
    Teacher clicks: "Set Password"
    ↓
    Teacher account activated
```

```typescript
// POST /api/v1/schools/:schoolId/users/invite
export async function inviteTeacher(req: express.Request, res: express.Response): Promise<void> {
  const { schoolId } = req.params;
  const { firstName, lastName, email, subject, classesAssigned, permissions } = req.body;

  // Validate email uniqueness within school
  const existing = await firestore
    .collection('users')
    .where('schoolId', '==', schoolId)
    .where('email', '==', email)
    .get();

  if (!existing.empty) {
    throw new ConflictError(
      'DUPLICATE_EMAIL_IN_SCHOOL',
      'User with this email already exists in school'
    );
  }

  // Generate invitation token
  const invitationToken = generateRandomToken();
  const invitationUrl = `${process.env.APP_URL}/accept-invitation?token=${invitationToken}`;

  // Create user (inactive until password set)
  const userRef = await firestore.collection('users').add({
    schoolId,
    firstName,
    lastName,
    email,
    subject,
    classesAssigned,
    role: 'teacher',
    permissions, // { attendance: true, grades: true, ... }
    status: 'pending_activation',
    invitationToken,
    invitationSentAt: new Date(),
    invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Send invitation email
  await sendInvitationEmail(email, invitationUrl, firstName);

  // Log activity
  Logger.info(`Teacher invited`, {
    schoolId,
    email,
    userId: userRef.id,
  });

  res.status(201).json({
    success: true,
    data: {
      userId: userRef.id,
      message: `Invitation sent to ${email}`,
    },
  });
}

// POST /api/v1/auth/accept-invitation
export async function acceptInvitation(req: express.Request, res: express.Response): Promise<void> {
  const { token, password, firstName, lastName } = req.body;

  // Find invitation
  const userDocs = await firestore
    .collection('users')
    .where('invitationToken', '==', token)
    .get();

  if (userDocs.empty) {
    throw new ValidationError('Invalid or expired invitation', {
      token: 'Invitation link is invalid or has expired',
    });
  }

  const userDoc = userDocs.docs[0];
  const userData = userDoc.data();

  // Check expiration
  if (!userData.invitationExpiresAt || userData.invitationExpiresAt < new Date()) {
    throw new ValidationError('Invitation expired', {
      token: 'Please request a new invitation',
    });
  }

  // Create Firebase user
  const firebaseUser = await admin.auth().createUser({
    email: userData.email,
    password,
    displayName: `${firstName} ${lastName}`,
  });

  // Update user document
  await firestore.collection('users').doc(userDoc.id).update({
    uid: firebaseUser.uid,
    status: 'active',
    invitationToken: null,
    acceptedAt: new Date(),
  });

  res.json({
    success: true,
    data: {
      uid: firebaseUser.uid,
      message: 'Account activated successfully!',
    },
  });
}
```

---

# PART 5: MODULE CONFIGURATION

## Configurable Features

```typescript
// POST /api/v1/schools/:schoolId/modules/configure
export async function configureModules(req: express.Request, res: express.Response): Promise<void> {
  const { schoolId } = req.params;
  const { modules } = req.body;

  // modules = {
  //   attendance: { enabled: true, offline: true, dailyReport: true },
  //   grades: { enabled: true, weightages: true, remarks: true },
  //   exams: { enabled: true, otpVerification: true, offlineEntry: true },
  //   fees: { enabled: false },
  //   notifications: { enabled: true, sms: true, email: true, whatsapp: false }
  // }

  await firestore.collection('schools').doc(schoolId).update({
    modules,
    onboardingStatus: 'modules_configured',
  });

  res.json({
    success: true,
    data: {
      message: 'Modules configured successfully',
    },
  });
}
```

---

# PART 6: SAMPLE DATA & GO-LIVE

## Lite Sample Data Load

```typescript
// POST /api/v1/schools/:schoolId/setup/load-sample-data
export async function loadSampleData(req: express.Request, res: express.Response): Promise<void> {
  const { schoolId } = req.params;

  // Load 10 sample students
  const sampleStudents = [
    { firstName: 'Aarav', lastName: 'Sharma', rollNumber: 1, class: 5, section: 'A' },
    { firstName: 'Bhavna', lastName: 'Patel', rollNumber: 2, class: 5, section: 'A' },
    // ... 8 more
  ];

  await Promise.all(
    sampleStudents.map((student) =>
      firestore
        .collection('schools')
        .doc(schoolId)
        .collection('students')
        .add({
          ...student,
          status: 'active',
          createdAt: new Date(),
        })
    )
  );

  // Mark school as ready for launch
  await firestore.collection('schools').doc(schoolId).update({
    onboardingStatus: 'ready_for_launch',
  });

  Logger.info(`Sample data loaded for school ${schoolId}`);

  res.json({
    success: true,
    data: {
      message: 'Sample data loaded. Ready to go live!',
    },
  });
}
```

## Go-Live

```typescript
// POST /api/v1/schools/:schoolId/go-live
export async function goLive(req: express.Request, res: express.Response): Promise<void> {
  const { schoolId } = req.params;

  await firestore.collection('schools').doc(schoolId).update({
    status: 'active', // Changed from 'trial'
    liveAt: new Date(),
    trialEndsAt: null,
  });

  // Send celebration email
  await sendGoLiveEmail(schoolId);

  Logger.info(`School ${schoolId} is now LIVE!`);

  res.json({
    success: true,
    data: {
      message: '🎉 School ERP is now LIVE!',
    },
  });
}
```

---

# PART 7: SUPPORT & ONBOARDING CHECKLIST

## Admin Dashboard - Onboarding Progress

```
┌─ Onboarding Progress: 80% Complete
│
├─ ✅ Step 1: Email Verified
├─ ✅ Step 2: Classes Created (12 classes, 3 sections)
├─ ✅ Step 3: Teachers Added (18 teachers)
├─ ✅ Step 4: Modules Configured (Attendance, Grades, Exams)
└─ ⏳ Step 5: Import Student Data
   └─ Option 1: Manual entry
   └─ Option 2: CSV upload (template provided)
   └─ Option 3: Use sample data

Next Action: Import your students data to complete onboarding
Estimated time: 15 minutes
```

## Onboarding Support

```
Quick Links:
├─ 📚 Knowledge Base
│  ├─ How to add students
│  ├─ How to mark attendance
│  ├─ How to enter grades
│  └─ Common issues & FAQ
│
├─ 📞 Support Options
│  ├─ Email: support@schoolerp.io
│  ├─ Phone: +91-XXXX-CCCCCC
│  ├─ Chat: Live chat (9 AM - 5 PM)
│  └─ Video call: Schedule with onboarding specialist
│
└─ 🎓 Training
   ├─ Watch: 5-min setup video
   ├─ Attend: Group webinar (Wednesdays 3 PM)
   └─ Personal: 1-on-1 training session
```

---

# PART 8: ONBOARDING METRICS

Track for each school:

```
Metrics to Monitor:
├─ Time to First Login
├─ Onboarding Completion %
├─ Time to Data Import
├─ Support Tickets Created
├─ Module Adoption Rate
├─ Trial → Paid Conversion
└─ Days to Revenue

Target Metrics:
├─ Onboarding completion: 90% within 7 days
├─ First data entry: Within 3 days
├─ Support tickets: < 3 per school
├─ Trial to paid: 60% conversion rate
```

---

**Smooth onboarding ensures schools are productive from Day 1 and reduces churn.**
