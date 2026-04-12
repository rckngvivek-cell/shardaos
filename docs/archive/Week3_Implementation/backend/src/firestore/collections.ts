/**
 * Firestore Collections Schema & Setup
 * Day 1: Task 2 - Firestore Setup (1.5 hours)
 * Author: Backend Team
 * Status: In Development
 */

import admin from 'firebase-admin';

const db = admin.firestore();

// ============================================================================
// COLLECTION: STAFF
// ============================================================================

/**
 * Staff Collection Schema
 * Stores information about all staff members (teachers, admins, support)
 */
interface StaffData {
  email: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'staff' | 'teacher';
  school_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

// ============================================================================
// COLLECTION: STAFF_ROLES
// ============================================================================

/**
 * Staff Roles Collection Schema
 * Defines role-based permissions and access levels
 */
interface StaffRoleData {
  role_name: 'admin' | 'staff' | 'teacher';
  permissions: string[];
  description: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// COLLECTION: STAFF_SESSIONS
// ============================================================================

/**
 * Staff Sessions Collection Schema
 * Tracks active sessions and login history
 */
interface StaffSessionData {
  staff_id: string;
  token: string;
  ip_address: string;
  user_agent: string;
  created_at: Date;
  expires_at: Date;
  is_active: boolean;
}

// ============================================================================
// COLLECTION: STAFF_AUDIT_LOG
// ============================================================================

/**
 * Audit Log Collection Schema
 * Tracks all staff actions for compliance and debugging
 */
interface StaffAuditLogData {
  staff_id: string;
  action: string;
  resource: string;
  resource_id: string;
  old_value: any;
  new_value: any;
  timestamp: Date;
  ip_address: string;
}

// ============================================================================
// FIRESTORE SECURITY RULES
// ============================================================================

/**
 * Firestore Security Rules (to be deployed via Firebase CLI)
 * 
 * match databases/{database}/documents {
 *   
 *   // Allow authenticated users
 *   match /staff/{staffId} {
 *     allow read: if request.auth.uid == resource.data.auth_uid;
 *     allow write: if request.auth.custom.claims.role == 'admin';
 *   }
 *   
 *   match /staffRoles/{document=**} {
 *     allow read: if request.auth != null;
 *     allow write: if request.auth.custom.claims.role == 'admin';
 *   }
 *   
 *   match /staffSessions/{document=**} {
 *     allow read: if request.auth.uid == resource.data.staff_id;
 *     allow write: if request.auth != null;
 *   }
 *   
 *   match /staffAuditLog/{document=**} {
 *     allow read: if request.auth.custom.claims.role == 'admin';
 *     allow write: if request.auth != null;
 *   }
 * }
 */

// ============================================================================
// COLLECTION INITIALIZATION & INDEXES
// ============================================================================

/**
 * Initialize Firestore collections with test data and indexes
 */
export async function initializeStaffCollections() {
  try {
    console.log('🔄 Initializing Staff Collections...');

    // Step 1: Create staff_roles collection with role definitions
    await createStaffRoles();

    // Step 2: Create test staff records
    await createTestStaffRecords();

    // Step 3: Create required Firestore indexes
    await createFirestoreIndexes();

    console.log('✅ Staff Collections initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates staff roles collection with role definitions
 */
async function createStaffRoles() {
  const roles: StaffRoleData[] = [
    {
      role_name: 'admin',
      permissions: [
        'manage:staff',
        'manage:students',
        'manage:classes',
        'manage:grades',
        'manage:attendance',
        'view:reports',
      ],
      description: 'School administrator with full system access',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      role_name: 'staff',
      permissions: [
        'view:students',
        'manage:attendance',
        'view:grades',
        'view:reports',
      ],
      description: 'Staff member with limited access',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      role_name: 'teacher',
      permissions: [
        'view:assigned_students',
        'manage:grades',
        'view:attendance',
        'send:messages',
      ],
      description: 'Teacher with class and grade management',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  for (const role of roles) {
    const roleRef = db.collection('staffRoles').doc(role.role_name);
    const exists = await roleRef.get();

    if (!exists.exists) {
      await roleRef.set(role);
      console.log(`✓ Created role: ${role.role_name}`);
    }
  }
}

/**
 * Creates 5 test staff records for development
 */
async function createTestStaffRecords() {
  const staffMembers = [
    {
      email: 'admin@school.com',
      name: 'School Administrator',
      role: 'admin',
    },
    {
      email: 'staff1@school.com',
      name: 'Staff Member 1',
      role: 'staff',
    },
    {
      email: 'teacher1@school.com',
      name: 'Teacher 1 (Math)',
      role: 'teacher',
    },
    {
      email: 'teacher2@school.com',
      name: 'Teacher 2 (English)',
      role: 'teacher',
    },
    {
      email: 'staff2@school.com',
      name: 'Staff Member 2',
      role: 'staff',
    },
  ];

  const bcrypt = require('bcrypt');
  const testPassword = await bcrypt.hash('Test@123', 10);

  for (const staff of staffMembers) {
    const existingStaff = await db
      .collection('staff')
      .where('email', '==', staff.email)
      .limit(1)
      .get();

    if (existingStaff.empty) {
      await db.collection('staff').add({
        ...staff,
        password_hash: testPassword,
        school_id: 'school-001',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      });
      console.log(`✓ Created test staff: ${staff.email}`);
    }
  }
}

/**
 * Creates Firestore composite indexes (if needed)
 * Most queries don't need indexes, but complex queries do
 */
async function createFirestoreIndexes() {
  console.log('ℹ️  Firestore indexes typically auto-created on first query');
  console.log('ℹ️  If you need composite indexes, define in firestore.indexes.json');
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get staff by email (used in login)
 */
export async function getStaffByEmail(email: string) {
  const snapshot = await db
    .collection('staff')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Get staff by ID
 */
export async function getStaffById(staffId: string) {
  const doc = await db.collection('staff').doc(staffId).get();

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() };
}

/**
 * Get all staff by role
 */
export async function getStaffByRole(role: string) {
  const snapshot = await db
    .collection('staff')
    .where('role', '==', role)
    .where('is_active', '==', true)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update staff record
 */
export async function updateStaff(staffId: string, updates: Partial<StaffData>) {
  await db.collection('staff').doc(staffId).update({
    ...updates,
    updated_at: new Date(),
  });
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  staffId: string,
  action: string,
  resource: string,
  resourceId: string,
  oldValue: any,
  newValue: any,
  ipAddress: string
) {
  await db.collection('staffAuditLog').add({
    staff_id: staffId,
    action,
    resource,
    resource_id: resourceId,
    old_value: oldValue,
    new_value: newValue,
    timestamp: new Date(),
    ip_address: ipAddress,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { db };

export default {
  initializeStaffCollections,
  getStaffByEmail,
  getStaffById,
  getStaffByRole,
  updateStaff,
  logAuditEvent,
};

/**
 * Usage in app initialization:
 * 
 * import { initializeStaffCollections } from './firestore/collections';
 * 
 * // On app startup
 * await initializeStaffCollections();
 */
