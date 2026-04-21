#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const ENV_FILENAMES = ['.env', '.env.local'];
const ENV_FILE_BLOCKED_KEYS = new Set([
  'OWNER_BOOTSTRAP_KEY',
  'OWNER_BOOTSTRAP_PASSWORD',
  'VITE_DEV_OWNER_PASSWORD',
  'VITE_DEV_EMPLOYEE_PASSWORD',
]);

function loadRepoEnvironment() {
  const repoRoot = path.resolve(__dirname, '..');
  const protectedKeys = new Set(Object.keys(process.env));

  for (const filename of ENV_FILENAMES) {
    const filePath = path.join(repoRoot, filename);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const parsed = dotenv.parse(fs.readFileSync(filePath));
    for (const [key, value] of Object.entries(parsed)) {
      if (ENV_FILE_BLOCKED_KEYS.has(key)) {
        continue;
      }

      if (!protectedKeys.has(key)) {
        process.env[key] = value;
      }
    }
  }
}

loadRepoEnvironment();

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.FIREBASE_PROJECT_ID || 'school-erp-dev';
const ownerUid = process.env.VITE_DEV_OWNER_UID || 'owner-local-bootstrap';
const ownerEmail = (process.env.VITE_DEV_OWNER_EMAIL || 'owner.local@shardaos.internal').toLowerCase();
const ownerDisplayName = process.env.VITE_DEV_OWNER_DISPLAY_NAME || 'Local Owner';
const tenantAdminEmail = (process.env.VITE_DEV_EMPLOYEE_EMAIL || 'admin@dev.school').toLowerCase();

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const db = getFirestore();
const SCRYPT_KEY_LENGTH = 64;

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function generateEphemeralPassword(prefix) {
  return `${prefix}-${crypto.randomBytes(12).toString('base64url')}Aa1!`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

function createCredentialId(plane, key) {
  return `${plane}:${key.trim().toLowerCase().replace(/[^a-z0-9:@._-]+/g, '-')}`;
}

const schools = [
  {
    id: 'school-north',
    data: {
      name: 'North Campus',
      code: 'NC01',
      address: 'Boring Road, Patna',
      city: 'Patna',
      state: 'Bihar',
      country: 'India',
      phone: '+91-6200000001',
      email: 'north@school.local',
      principalName: 'Ritu Sinha',
      studentCount: 12,
      isActive: true,
      createdAt: daysAgo(60),
      updatedAt: hoursAgo(12),
    },
    studentCount: 12,
    lastAttendanceRecordedAt: daysAgo(4),
    lastGradePublishedAt: daysAgo(24),
    approvalType: 'school_suspension',
    attentionReason: 'A suspension request is pending owner review.',
  },
  {
    id: 'school-riverdale',
    data: {
      name: 'Riverdale Public School',
      code: 'RV11',
      address: 'Kankarbagh, Patna',
      city: 'Patna',
      state: 'Bihar',
      country: 'India',
      phone: '+91-6200000002',
      email: 'riverdale@school.local',
      principalName: 'Anand Verma',
      studentCount: 8,
      isActive: true,
      createdAt: daysAgo(8),
      updatedAt: hoursAgo(10),
    },
    studentCount: 8,
    lastAttendanceRecordedAt: null,
    lastGradePublishedAt: null,
    approvalType: 'school_onboarding',
    attentionReason: 'Onboarding approval is still pending final owner action.',
  },
  {
    id: 'school-greenwood',
    data: {
      name: 'Greenwood Academy',
      code: 'GW07',
      address: 'Morabadi, Ranchi',
      city: 'Ranchi',
      state: 'Jharkhand',
      country: 'India',
      phone: '+91-6200000003',
      email: 'greenwood@school.local',
      principalName: 'Priya Raj',
      studentCount: 10,
      isActive: true,
      createdAt: daysAgo(75),
      updatedAt: hoursAgo(8),
    },
    studentCount: 10,
    lastAttendanceRecordedAt: hoursAgo(8),
    lastGradePublishedAt: daysAgo(5),
    approvalType: null,
    attentionReason: 'Attendance and grading activity are flowing normally.',
  },
  {
    id: 'school-legacy',
    data: {
      name: 'Legacy Academy',
      code: 'LG09',
      address: 'Civil Lines, Gaya',
      city: 'Gaya',
      state: 'Bihar',
      country: 'India',
      phone: '+91-6200000004',
      email: 'legacy@school.local',
      principalName: 'Sonal Das',
      studentCount: 0,
      isActive: false,
      createdAt: daysAgo(120),
      updatedAt: daysAgo(6),
    },
    studentCount: 0,
    lastAttendanceRecordedAt: null,
    lastGradePublishedAt: null,
    approvalType: null,
    attentionReason: 'School is currently inactive and not serving live traffic.',
  },
];

const employees = [
  {
    id: 'emp-ops-1',
    uid: 'uid-ops-1',
    email: 'aarav@shardaos.internal',
    displayName: 'Aarav Singh',
    role: 'employee',
    department: 'Operations',
    isActive: true,
    emailVerified: true,
    mfaEnabled: true,
    authProviderDisabled: false,
    platformAccessActive: true,
    lastLoginAt: hoursAgo(6),
    lastSyncedAt: hoursAgo(2),
    createdAt: daysAgo(40),
    updatedAt: hoursAgo(2),
    onboardedBy: ownerUid,
  },
  {
    id: 'emp-fin-1',
    uid: 'uid-fin-1',
    email: 'neha@shardaos.internal',
    displayName: 'Neha Kapoor',
    role: 'employee',
    department: 'Finance',
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    authProviderDisabled: false,
    platformAccessActive: true,
    lastLoginAt: '',
    lastSyncedAt: hoursAgo(3),
    createdAt: daysAgo(18),
    updatedAt: hoursAgo(3),
    onboardedBy: ownerUid,
  },
  {
    id: 'emp-eng-1',
    uid: 'uid-eng-1',
    email: 'rohan@shardaos.internal',
    displayName: 'Rohan Das',
    role: 'employee',
    department: 'Engineering',
    isActive: true,
    emailVerified: true,
    mfaEnabled: true,
    authProviderDisabled: false,
    platformAccessActive: true,
    lastLoginAt: daysAgo(19),
    lastSyncedAt: hoursAgo(5),
    createdAt: daysAgo(52),
    updatedAt: hoursAgo(5),
    onboardedBy: ownerUid,
  },
  {
    id: 'emp-sup-1',
    uid: 'uid-sup-1',
    email: 'meera@shardaos.internal',
    displayName: 'Meera Sharma',
    role: 'employee',
    department: 'Support',
    isActive: false,
    emailVerified: false,
    mfaEnabled: false,
    authProviderDisabled: true,
    platformAccessActive: false,
    lastLoginAt: daysAgo(31),
    lastSyncedAt: daysAgo(2),
    createdAt: daysAgo(68),
    updatedAt: daysAgo(2),
    onboardedBy: ownerUid,
  },
];

const ownerPassword = process.env.OWNER_SEED_PASSWORD?.trim() || generateEphemeralPassword('owner');
const ownerPasswordWasGenerated = !process.env.OWNER_SEED_PASSWORD;
const employeePasswords = new Map(
  employees.map((employee) => [employee.id, generateEphemeralPassword(employee.department.toLowerCase())]),
);
const tenantSchoolId = schools[0].id;
const tenantCredentials = [
  {
    uid: 'tenant-school-owner-001',
    email: 'owner@dev.school',
    displayName: 'Dev School Owner',
    role: 'school_owner',
    schoolId: tenantSchoolId,
  },
  {
    uid: 'tenant-school-admin-001',
    email: tenantAdminEmail,
    displayName: 'Dev School Admin',
    role: 'school_admin',
    schoolId: tenantSchoolId,
  },
  {
    uid: 'tenant-principal-001',
    email: 'principal@dev.school',
    displayName: 'Dev Principal',
    role: 'principal',
    schoolId: tenantSchoolId,
  },
  {
    uid: 'tenant-exam-controller-001',
    email: 'exams@dev.school',
    displayName: 'Dev Exam Controller',
    role: 'exam_controller',
    schoolId: tenantSchoolId,
  },
  {
    uid: 'tenant-teacher-001',
    email: 'teacher@dev.school',
    displayName: 'Dev Teacher',
    role: 'teacher',
    schoolId: tenantSchoolId,
  },
];
const tenantPasswords = new Map(
  tenantCredentials.map((credential) => [credential.uid, generateEphemeralPassword(credential.role.replace(/_/g, '-'))]),
);

const approvals = [
  {
    id: 'approval-school-riverdale',
    type: 'school_onboarding',
    status: 'pending',
    requestedBy: 'uid-ops-1',
    requestedByEmail: 'aarav@shardaos.internal',
    title: 'Riverdale onboarding release',
    description: 'Approve Riverdale for full activation on the owner plane.',
    metadata: { schoolId: 'school-riverdale' },
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(10),
  },
  {
    id: 'approval-school-north',
    type: 'school_suspension',
    status: 'pending',
    requestedBy: 'uid-ops-1',
    requestedByEmail: 'aarav@shardaos.internal',
    title: 'North Campus commercial review',
    description: 'Review the stale operating signals before finance escalation.',
    metadata: { schoolId: 'school-north' },
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'approval-employee-finance',
    type: 'employee_onboarding',
    status: 'pending',
    requestedBy: 'uid-fin-1',
    requestedByEmail: 'neha@shardaos.internal',
    title: 'Finance analyst activation',
    description: 'Approve the next finance operator for portfolio expansion coverage.',
    metadata: { department: 'Finance' },
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'approval-exam-1',
    type: 'exam_schedule',
    status: 'approved',
    requestedBy: 'uid-eng-1',
    requestedByEmail: 'rohan@shardaos.internal',
    approvedBy: ownerUid,
    title: 'Exam schedule release',
    description: 'Published after owner review.',
    metadata: { schoolId: 'school-greenwood' },
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(20),
  },
];

const auditLogs = [
  {
    id: 'audit-1',
    action: 'SETTINGS_CHANGED',
    performedBy: ownerUid,
    performedByEmail: ownerEmail,
    performedByRole: 'owner',
    targetType: 'settings',
    targetId: 'platform',
    metadata: { path: '/api/owner/owner/security' },
    ipAddress: '127.0.0.1',
    userAgent: 'owner-seed',
    timestamp: hoursAgo(2),
  },
  {
    id: 'audit-2',
    action: 'APPROVAL_GRANTED',
    performedBy: ownerUid,
    performedByEmail: ownerEmail,
    performedByRole: 'owner',
    targetType: 'school',
    targetId: 'school-greenwood',
    metadata: { approvalId: 'approval-exam-1' },
    ipAddress: '127.0.0.1',
    userAgent: 'owner-seed',
    timestamp: hoursAgo(20),
  },
  {
    id: 'audit-3',
    action: 'EMPLOYEE_DEACTIVATED',
    performedBy: ownerUid,
    performedByEmail: ownerEmail,
    performedByRole: 'owner',
    targetType: 'employee',
    targetId: 'emp-sup-1',
    metadata: { department: 'Support' },
    ipAddress: '127.0.0.1',
    userAgent: 'owner-seed',
    timestamp: daysAgo(2),
  },
];

async function upsertAuthCredential(id, payload) {
  await db.collection('auth_credentials').doc(id).set(payload);
}

async function setSchoolData(school) {
  const schoolRef = db.collection('schools').doc(school.id);
  await schoolRef.set(school.data);

  const studentsRef = schoolRef.collection('students');
  const attendanceRef = schoolRef.collection('attendance');
  const gradesRef = schoolRef.collection('grades');

  for (let index = 1; index <= school.studentCount; index += 1) {
    const createdAt = new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000).toISOString();
    const studentId = `${school.id}-student-${String(index).padStart(2, '0')}`;
    await studentsRef.doc(studentId).set({
      firstName: `Student${index}`,
      lastName: school.data.code,
      dateOfBirth: '2012-04-01',
      gender: index % 2 === 0 ? 'female' : 'male',
      grade: '8',
      section: 'A',
      rollNumber: `${school.data.code}-${String(index).padStart(3, '0')}`,
      parentName: `Parent ${index}`,
      parentPhone: `+91-700000${String(index).padStart(4, '0')}`,
      parentEmail: `parent${index}@${school.id}.local`,
      address: school.data.address,
      emergencyContact: `+91-710000${String(index).padStart(4, '0')}`,
      isActive: true,
      enrollmentDate: createdAt,
      createdAt,
      updatedAt: createdAt,
    });
  }

  if (school.lastAttendanceRecordedAt) {
    await attendanceRef.doc(`${school.id}-attendance-1`).set({
      studentId: `${school.id}-student-01`,
      date: school.lastAttendanceRecordedAt.slice(0, 10),
      status: 'present',
      markedBy: 'uid-ops-1',
      remarks: school.attentionReason,
      createdAt: school.lastAttendanceRecordedAt,
      updatedAt: school.lastAttendanceRecordedAt,
    });
  }

  if (school.lastGradePublishedAt) {
    await gradesRef.doc(`${school.id}-grade-1`).set({
      studentId: `${school.id}-student-01`,
      subject: 'Mathematics',
      examName: 'Term Assessment',
      examDate: school.lastGradePublishedAt.slice(0, 10),
      maxMarks: 100,
      obtainedMarks: school.id === 'school-north' ? 72 : 91,
      grade: school.id === 'school-north' ? 'B+' : 'A',
      remarks: school.attentionReason,
      gradedBy: 'uid-eng-1',
      createdAt: school.lastGradePublishedAt,
      updatedAt: school.lastGradePublishedAt,
    });
  }
}

async function alreadySeeded() {
  const [schoolsSnap, employeesSnap, approvalsSnap, credentialsSnap] = await Promise.all([
    db.collection('schools').limit(1).get(),
    db.collection('platform_employees').limit(1).get(),
    db.collection('platform_approvals').limit(1).get(),
    db.collection('auth_credentials').where('plane', '==', 'platform').limit(1).get(),
  ]);

  return !schoolsSnap.empty && !employeesSnap.empty && !approvalsSnap.empty && !credentialsSnap.empty;
}

async function main() {
  const force = process.argv.includes('--force');

  if (!force && await alreadySeeded()) {
    console.log('Owner local stack already has seeded data. Skipping.');
    return;
  }

  const now = new Date().toISOString();

  await upsertAuthCredential(createCredentialId('platform', ownerEmail), {
    uid: ownerUid,
    email: ownerEmail,
    emailNormalized: ownerEmail,
    displayName: ownerDisplayName,
    plane: 'platform',
    role: 'owner',
    schoolId: '',
    passwordHash: hashPassword(ownerPassword),
    isActive: true,
    passwordUpdatedAt: now,
    lastLoginAt: '',
    createdAt: now,
    updatedAt: now,
  });

  for (const employee of employees) {
    await upsertAuthCredential(createCredentialId('platform', employee.email), {
      uid: employee.uid,
      email: employee.email,
      emailNormalized: employee.email,
      displayName: employee.displayName,
      plane: 'platform',
      role: 'employee',
      schoolId: '',
      passwordHash: hashPassword(employeePasswords.get(employee.id)),
      isActive: employee.isActive && employee.platformAccessActive && !employee.authProviderDisabled,
      passwordUpdatedAt: now,
      lastLoginAt: employee.lastLoginAt,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    });

    await db.collection('platform_employees').doc(employee.id).set({
      ...employee,
      onboardedBy: ownerUid,
    });
  }

  for (const credential of tenantCredentials) {
    await upsertAuthCredential(createCredentialId('tenant', `${credential.schoolId}:${credential.email}`), {
      uid: credential.uid,
      email: credential.email,
      emailNormalized: credential.email,
      displayName: credential.displayName,
      plane: 'tenant',
      role: credential.role,
      schoolId: credential.schoolId,
      passwordHash: hashPassword(tenantPasswords.get(credential.uid)),
      isActive: true,
      passwordUpdatedAt: now,
      lastLoginAt: '',
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const approval of approvals) {
    await db.collection('platform_approvals').doc(approval.id).set({
      ...approval,
      ...(approval.approvedBy ? { approvedBy: ownerUid } : {}),
    });
  }

  for (const entry of auditLogs) {
    const { id, ...payload } = entry;
    await db.collection('platform_audit_log').doc(id).set({
      ...payload,
      performedBy: ownerUid,
      performedByEmail: ownerEmail,
    });
  }

  for (const school of schools) {
    await setSchoolData(school);
  }

  console.log('Owner local stack seed completed.');
  console.log(`Schools: ${schools.length}`);
  console.log(`Employees: ${employees.length}`);
  console.log(`Approvals: ${approvals.length}`);
  console.log(`JWT credentials: 1 owner, ${employees.length} platform employees, ${tenantCredentials.length} tenant presets`);
  if (ownerPasswordWasGenerated) {
    console.log('Owner JWT credential was seeded with an ephemeral password for this run.');
    console.log('Use `npm run owner:bootstrap` to set a known owner password before testing API-backed sign-in.');
  }
}

main().catch((error) => {
  console.error(`owner:seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
