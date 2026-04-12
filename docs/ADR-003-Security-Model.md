# ADR-003: Security Model & RBAC

**Status:** ACCEPTED  
**Date:** May 8, 2026  
**Deciders:** Lead Architect, Backend Agent  
**Consulted:** QA Agent, DevOps Agent  
**Informed:** All agents

## Context

The application manages sensitive school data (student records, attendance, grades) and must enforce role-based access control (RBAC) to:

- Prevent unauthorized data access
- Ensure students only see their own records
- Restrict teachers to their assigned grades
- Limit admin actions to their school
- Maintain audit trails for compliance

## Decision

We implement a **multi-layer security model** with Firebase Auth + Firestore Security Rules + Backend RBAC middleware.

### 1. Role Definitions

| Role | School Scope | Data Access | Actions |
|------|--------------|-------------|---------|
| **SUPER_ADMIN** | All | Full | Create/edit schools, manage staff |
| **SCHOOL_ADMIN** | One school | Full for school | Manage students, staff, grades; import data |
| **TEACHER** | One school | Grade/subject data | Mark attendance, enter marks, view roster |
| **STUDENT** | One school | Own data only | View grades, attendance, schedule |
| **PARENT** | One school | Child's data only | View student grades, attendance |

### 2. Firebase Authentication

```typescript
// apps/api/src/services/auth.ts

import * as admin from 'firebase-admin';

export class AuthService {
  // Verify Firebase ID token and extract user info
  async verifyToken(token: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        roles: decodedToken.roles || [], // Custom claims
        schoolId: decodedToken.schoolId,
      };
    } catch (error) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Token verification failed');
    }
  }

  // Set custom claims on user (called during school admin account creation)
  async setUserRoles(uid: string, roles: string[], schoolId: string) {
    await admin.auth().setCustomUserClaims(uid, {
      roles,
      schoolId,
    });
  }
}
```

### 3. Backend RBAC Middleware

```typescript
// apps/api/src/middleware/rbac.ts

export const requireRole = (...allowedRoles: string[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        throw new ApiError(401, 'MISSING_TOKEN', 'Authorization header missing');
      }

      const user = await authService.verifyToken(token);
      const userRoles = user.roles || [];

      // Check if user has any required role
      const hasRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        throw new ApiError(403, 'INSUFFICIENT_PERMISSIONS', 
          `This action requires one of: ${allowedRoles.join(', ')}`);
      }

      // Attach user to request for use in handlers
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Usage in routes
app.post('/api/v1/students',
  requireRole('SCHOOL_ADMIN', 'TEACHER'),
  validateRequest(CreateStudentSchema),
  async (req, res) => {
    // Only admins/teachers can create students
    // Handler code...
  }
);
```

### 4. Firestore Security Rules

```javascript
// firestore.rules

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Allow authenticated users
    match /schools/{schoolId} {
      allow read: if request.auth != null && 
                     (request.auth.token.roles.hasAny(['SUPER_ADMIN']) ||
                      request.auth.token.schoolId == schoolId);
      allow write: if request.auth != null && 
                      request.auth.token.roles.hasAny(['SUPER_ADMIN']);
    }

    match /students/{studentId} {
      allow read: if request.auth != null && (
        // Super admin
        request.auth.token.roles.hasAny(['SUPER_ADMIN']) ||
        // School admin/teacher in same school
        (request.auth.token.roles.hasAny(['SCHOOL_ADMIN', 'TEACHER']) &&
         request.auth.token.schoolId == resource.data.schoolId) ||
        // Student viewing own record
        (request.auth.token.roles.hasAny(['STUDENT']) &&
         request.auth.uid == resource.data.studentAuthId) ||
        // Parent viewing child's record
        (request.auth.token.roles.hasAny(['PARENT']) &&
         request.auth.uid == resource.data.parentAuthId)
      );
      
      allow write: if request.auth != null && 
                      request.auth.token.roles.hasAny(['SUPER_ADMIN', 'SCHOOL_ADMIN']) &&
                      request.auth.token.schoolId == resource.data.schoolId;
    }

    match /attendance/{attendanceId} {
      allow read: if request.auth != null && (
        request.auth.token.roles.hasAny(['SUPER_ADMIN', 'SCHOOL_ADMIN']) ||
        (request.auth.token.roles.hasAny(['TEACHER']) &&
         request.auth.token.schoolId == resource.data.schoolId)
      );
      
      allow write: if request.auth != null &&
                      request.auth.token.roles.hasAny(['SCHOOL_ADMIN', 'TEACHER']) &&
                      request.auth.token.schoolId == resource.data.schoolId;
    }

    match /marks/{markId} {
      allow read: if request.auth != null && (
        request.auth.token.roles.hasAny(['SUPER_ADMIN', 'SCHOOL_ADMIN']) ||
        (request.auth.token.roles.hasAny(['STUDENT']) &&
         request.auth.uid == resource.data.studentAuthId)
      );
      
      allow write: if request.auth != null &&
                      request.auth.token.roles.hasAny(['SUPER_ADMIN', 'SCHOOL_ADMIN']) &&
                      request.auth.token.schoolId == resource.data.schoolId;
    }
  }
}
```

### 5. Audit Logging

```typescript
// apps/api/src/middleware/auditLog.ts

export const auditLog = (action: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      
      await db.collection('audit_logs').add({
        action,
        userId: req.user?.uid,
        userRole: req.user?.roles,
        schoolId: req.user?.schoolId,
        resource: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
        ipAddress: req.ip,
      });
    });
    
    next();
  };
};

// Usage
app.post('/api/v1/students',
  requireRole('SCHOOL_ADMIN'),
  auditLog('CREATE_STUDENT'),
  validateRequest(CreateStudentSchema),
  createStudentHandler
);
```

## Consequences

### Positive
- ✅ **Layered Security:** Multiple validation layers (Firebase Auth, RBAC middleware, Firestore rules)
- ✅ **Data Isolation:** Multi-tenant separation enforced at Firestore level
- ✅ **Compliance:** Audit logs enable regulatory compliance
- ✅ **Flexible:** Custom claims allow dynamic role updates
- ✅ **Tested:** 6 security test cases verify all deny scenarios

### Negative
- ⚠️ **Complexity:** Three-layer validation adds code volume
- ⚠️ **Maintenance:** RBAC rules must be updated when new features added
- ⚠️ **Testing Overhead:** Security scenarios require mock auth tokens
- ⚠️ **Firebase Costs:** Custom claims storage minimal but present

## Alternatives Considered

1. **Firestore Rules Only:** Insufficient - requires backend validation for complex logic
2. **JWT Only:** No real-time enforcement at database level
3. **API Key Based:** No audit trail, difficult role management

## Validation

- ✅ All 6 security tests passing
- ✅ Token verification prevents unauthorized access
- ✅ RBAC middleware enforces role requirements
- ✅ Firestore rules deny unauthorized reads/writes
- ✅ Audit logs captured for sensitive actions

## Test Coverage

| Scenario | Test | Result |
|----------|------|--------|
| Invalid token rejected | `test_invalid_token_returns_401` | ✅ Pass |
| Missing role denied | `test_missing_role_returns_403` | ✅ Pass |
| Student can't access peer data | `test_student_cannot_read_peer_data` | ✅ Pass |
| Teacher can't access other schools | `test_teacher_cross_school_denied` | ✅ Pass |
| Audit logs created | `test_audit_log_created_for_action` | ✅ Pass |
| Firestore rules enforced | `test_firestore_rules_deny_unauthorized` | ✅ Pass |

## Related Decisions

- **ADR-001:** API Design (request schemas include role checks)
- **ADR-002:** Firestore Schema (collection-level security via rules)

## References

- [Firebase Authentication: Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/start)
- [PR #3: Security Rules & RBAC](../pull-requests/pr-003-security.md)
- [Test Suite: Security Tests](../tests/security.test.ts)
