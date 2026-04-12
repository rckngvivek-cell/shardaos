# COMPLETE AUTHENTICATION & AUTHORIZATION SYSTEM
## DetailedImplementation for Pan-India School ERP

---

# PART 1: AUTHENTICATION ARCHITECTURE OVERVIEW

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (Web/Mobile)                         │
├─────────────────────────────────────────────────────────────┤
│  1. Enter email + password (or click "Sign in with Google")  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           FIREBASE AUTHENTICATION (Client SDK)               │
├─────────────────────────────────────────────────────────────┤
│  • Validates credentials                                     │
│  • Creates idToken (JWT, 1-hour expiry)                      │
│  • Stores in localStorage (web) / Secure Storage (mobile)    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              API CALL WITH idToken                           │
├─────────────────────────────────────────────────────────────┤
│  POST /api/v1/schools/xyz/students                           │
│  Header: Authorization: Bearer {idToken}                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│        CLOUD RUN API (Node.js + Express)                     │
├─────────────────────────────────────────────────────────────┤
│  authMiddleware:                                             │
│  1. Extract token from header                                │
│  2. Verify signature with Firebase public key                │
│  3. Decode JWT → get user.uid, user.email, user.custom      │
│  4. Check permissions (role-based access control)            │
│  5. Attach user object to req.user                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│         ROUTE HANDLER (Protected Resource)                   │
├─────────────────────────────────────────────────────────────┤
│  POST /students handler:                                     │
│  • req.user already verified + decoded                       │
│  • Check if user has permission to create students           │
│  • If unauthorized → 403 Forbidden                           │
│  • If authorized → create student, return 201               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 CLIENT RECEIVES RESPONSE                     │
├─────────────────────────────────────────────────────────────┤
│  { "studentId": "123", "name": "Aarav", ... }               │
└─────────────────────────────────────────────────────────────┘
```

---

# PART 2: FIREBASE SETUP & CONFIGURATION

## Step 1: Enable Authentication in Firebase Console

1. Go to Firebase Console → Your Project
2. Click "Authentication" in left menu
3. Click "Get started"
4. Enable these sign-in methods:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Phone Number (optional, for later)
   - ❌ Facebook (not targeting Facebook users)

## Step 2: Custom Claims (For Role-Based Access)

Firebase allows custom claims on JWT tokens. We'll use this to embed user role.

```typescript
// Backend: Admin setup script to add custom claims
import * as admin from 'firebase-admin';

admin.initializeApp();

async function setUserRoles() {
  const db = admin.firestore();
  
  // Get all users from 'users' collection
  const snapshot = await db.collection('users').get();
  
  snapshot.forEach(async (doc) => {
    const user = doc.data();
    
    // Set custom claims based on role
    await admin.auth().setCustomUserClaims(user.firebase_uid, {
      role: user.role,           // 'teacher', 'parent', 'admin', 'accountant'
      school_id: user.school_id,  // Which school they belong to
      permissions: user.permissions // ['students', 'grades', 'attendance']
    });
  });
  
  console.log('Custom claims set for all users');
}

// Run once during onboarding
setUserRoles();
```

---

# PART 3: BACKEND AUTHENTICATION IMPLEMENTATION

## Complete Auth Middleware

```typescript
// src/middleware/auth.ts
import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.GCP_PROJECT_ID
});

const db = admin.firestore();

/**
 * Authentication Middleware
 * Verifies Firebase ID token and attaches user to req.user
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    const idToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach decoded token to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || '',
      photoUrl: decodedToken.picture || '',
      
      // Custom claims (if set)
      role: (decodedToken as any).role || 'user',
      school_id: (decodedToken as any).school_id,
      permissions: (decodedToken as any).permissions || [],
      
      // Token metadata
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };

    // Optional: Validate that user exists in our database
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({
        error: 'User not found',
        message: 'This user account is not registered in our system'
      });
    }

    const userData = userDoc.data();
    req.user.school_id = userData?.school_id;
    req.user.role = userData?.role;
    req.user.permissions = userData?.permissions || [];

    // Continue to next middleware/route
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token revoked',
        message: 'Your session has been invalidated. Please login again'
      });
    }

    console.error('Auth error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed token'
    });
  }
}

/**
 * Role-Based Authorization Middleware
 * Check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This operation requires one of: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Permission-Based Authorization Middleware
 * Check if user has specific permission
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hasPermission = permissions.some(perm =>
      req.user.permissions?.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You don't have permission for: ${permissions.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Validate School Access
 * Ensure user can only access their own school's data
 */
export function validateSchoolAccess(req: Request, res: Response, next: NextFunction) {
  const schoolIdFromUrl = req.params.schoolId;
  const userSchoolId = req.user?.school_id;

  if (schoolIdFromUrl !== userSchoolId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own school data'
    });
  }

  next();
}
```

## Usage in Express Routes

```typescript
// src/routes/students.ts
import express from 'express';
import {
  authMiddleware,
  requireRole,
  requirePermission,
  validateSchoolAccess
} from '../middleware/auth';

const router = express.Router();

// All routes under /api/v1/students require authentication + school validation
router.use(authMiddleware);
router.use(validateSchoolAccess);

/**
 * POST /api/v1/schools/:schoolId/students
 * Create a new student
 * Required roles: admin, principal, accountant
 * Required permissions: students.create
 */
router.post(
  '/:schoolId/students',
  requireRole('admin', 'principal', 'accountant'),
  requirePermission('students.create'),
  async (req, res) => {
    try {
      const { name, dob, parentPhone, class: studentClass } = req.body;
      
      // Validate
      if (!name || !parentPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create student
      const docRef = db.collection('students')
        .doc(req.params.schoolId)
        .collection('students')
        .doc();

      await docRef.set({
        name,
        dob,
        parentPhone,
        class: studentClass,
        enrollmentDate: new Date(),
        status: 'active',
        created_by: req.user.uid,
        created_at: new Date()
      });

      res.status(201).json({
        studentId: docRef.id,
        message: 'Student created successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/students/:studentId
 * Get student details
 * Parent can only see their own child
 */
router.get(
  '/:schoolId/students/:studentId',
  async (req, res) => {
    try {
      const studentDoc = await db.collection('students')
        .doc(req.params.schoolId)
        .collection('students')
        .doc(req.params.studentId)
        .get();

      if (!studentDoc.exists) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const student = studentDoc.data();

      // Parent can only see their own child
      if (req.user.role === 'parent') {
        if (student.parent_uid !== req.user.uid) {
          return res.status(403).json({ error: 'Cannot view other students' });
        }
      }

      res.json(student);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
```

---

# PART 4: FIREBASE CLIENT SETUP (Web)

## React Components for Login

### 1. Authentication Service

```typescript
// src/services/authService.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../config/firebase';

class AuthService {
  /**
   * Sign up with email & password
   */
  async signup(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName
      });

      return userCredential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Sign in with email & password
   */
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async googleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user's ID token
   */
  async getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    return await user.getIdToken(true); // Force refresh
  }

  /**
   * Sign out
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Handle Firebase errors
   */
  private handleError(error: any): Error {
    const errorMap: { [key: string]: string } = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/user-disabled': 'This account has been disabled',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/popup-closed-by-user': 'Login cancelled'
    };

    const message = errorMap[error.code] || error.message || 'Authentication failed';
    return new Error(message);
  }
}

export const authService = new AuthService();
```

### 2. Login Component

```jsx
// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.login(email, password);
      
      // Redirect based on user role (fetched from user profile or API)
      // For now, redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const user = await authService.googleSignIn();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>School ERP</h1>
        <p className="subtitle">Login to manage your school</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider">OR</div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-google"
        >
          <img src="/google-logo.png" alt="Google" />
          Sign in with Google
        </button>

        <div className="footer-links">
          <a href="/forgot-password">Forgot password?</a>
          <span>•</span>
          <a href="/signup">Create account</a>
        </div>
      </div>
    </div>
  );
}
```

### 3. Protected Route Component

```jsx
// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export function ProtectedRoute({ children, requiredRole = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // If role required, verify it
      if (requiredRole) {
        try {
          // Fetch user details from API to check role
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const userData = await response.json();
          
          if (userData.role === requiredRole) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } catch (error) {
          console.error('Error checking role:', error);
          setAuthorized(false);
        }
      } else {
        setAuthorized(true);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [requiredRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

### 4. App Routing

```jsx
// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { StudentList } from './pages/StudentList';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute requiredRole="teacher">
              <StudentList />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 5. Firebase Config

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
```

---

# PART 5: API INTERCEPTOR (Attach Token to All Requests)

```typescript
// src/services/api.ts
import axios from 'axios';
import { auth } from '../config/firebase';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
});

// Add interceptor to attach token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses (token expired, revoked, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

# PART 6: REACT NATIVE SETUP (Mobile)

## iOS/Android Authentication

```typescript
// mobile/src/services/authService.ts
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID
});

class MobileAuthService {
  /**
   * Login with email & password
   */
  async login(email: string, password: string) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      // Store token locally for offline access
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', token);
      
      return userCredential.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Google Sign-In
   */
  async googleSignIn() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const credential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await auth().signInWithCredential(credential);
      
      // Store token
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', token);
      
      return userCredential.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get stored token
   */
  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Listen to auth state
   */
  onAuthStateChange(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  }

  private handleError(error: any): Error {
    const errorMap: { [key: string]: string } = {
      'auth/invalid-email': 'Invalid email',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Wrong password',
      'auth/user-disabled': 'Account disabled'
    };
    return new Error(errorMap[error.code] || error.message);
  }
}

export const mobileAuthService = new MobileAuthService();
```

## Mobile Login Screen

```jsx
// mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { mobileAuthService } from '../services/authService';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await mobileAuthService.login(email, password);
      navigation.replace('Dashboard'); // Navigate to dashboard
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await mobileAuthService.googleSignIn();
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        School ERP
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 20,
          borderRadius: 5
        }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 5,
          marginBottom: 10
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={loading}
        style={{
          borderWidth: 1,
          borderColor: '#999',
          padding: 15,
          borderRadius: 5
        }}
      >
        <Text style={{ textAlign: 'center' }}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

# PART 7: USER ROLES & PERMISSIONS MATRIX

## Role Definitions

```typescript
// src/types/roles.ts

export enum UserRole {
  ADMIN = 'admin',           // Super admin, manage all schools
  PRINCIPAL = 'principal',   // School principal, manage school
  TEACHER = 'teacher',       // Teach classes, enter marks
  ACCOUNTANT = 'accountant', // Handle finances
  PARENT = 'parent'          // View child's grades, attendance
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'schools.create',
    'schools.read',
    'schools.update',
    'schools.delete',
    'users.create',
    'users.manage',
    'reports.view_all'
  ],
  
  [UserRole.PRINCIPAL]: [
    'students.create',
    'students.read',
    'students.update',
    'classes.manage',
    'teachers.manage',
    'attendance.view',
    'grades.view',
    'reports.view_school'
  ],
  
  [UserRole.TEACHER]: [
    'students.read',
    'attendance.mark',
    'grades.create',
    'grades.update',
    'reports.view_class'
  ],
  
  [UserRole.ACCOUNTANT]: [
    'invoices.create',
    'invoices.update',
    'payments.record',
    'reports.financial'
  ],
  
  [UserRole.PARENT]: [
    'students.read_own',       // Only own child
    'attendance.view_own',     // Only own child
    'grades.view_own'          // Only own child
  ]
};
```

## Firestore Security Rules with Roles

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is authenticated
    function isAuth() {
      return request.auth != null;
    }
    
    // Helper: Get user's role from custom claims
    function userRole() {
      return request.auth.token.role;
    }
    
    // Helper: Get user's school_id
    function schoolId() {
      return request.auth.token.school_id;
    }
    
    // Students collection
    match /students/{schoolId}/{studentId} {
      // Admin can do anything
      allow read, write: if userRole() == 'admin';
      
      // Principal + Teacher can read students in their school
      allow read: if isAuth() && schoolId == resource.data.school_id
                 && (userRole() == 'principal' || userRole() == 'teacher');
      
      // Principal can create/edit students
      allow write: if isAuth() && schoolId == resource.data.school_id
                 && userRole() == 'principal';
      
      // Parent can only read their own child
      allow read: if isAuth() && userRole() == 'parent'
                 && request.auth.uid in resource.data.parent_uids;
    }
    
    // Attendance collection
    match /attendance/{schoolId}/{recordId} {
      allow read, write: if isAuth() && schoolId == resource.data.school_id
                        && (userRole() == 'principal' || userRole() == 'teacher');
      
      allow read: if isAuth() && userRole() == 'parent'
                 && request.auth.uid in resource.data.parent_uids;
    }
    
    // Grades collection
    match /grades/{schoolId}/{gradeId} {
      allow read, create, update: if isAuth() && schoolId == resource.data.school_id
                                  && (userRole() == 'principal' || userRole() == 'teacher');
      
      allow read: if isAuth() && userRole() == 'parent'
                 && request.auth.uid in resource.data.parent_uids;
    }
    
    // Invoices (Finance)
    match /invoices/{schoolId}/{invoiceId} {
      allow read, write: if isAuth() && schoolId == resource.data.school_id
                        && (userRole() == 'principal' || userRole() == 'accountant');
      
      // Parent can view their own invoice
      allow read: if isAuth() && userRole() == 'parent'
                 && request.auth.uid == resource.data.parent_uid;
    }
  }
}
```

---

# PART 8: USER CREATION & ONBOARDING FLOW

## Admin Creates User for Teacher

```typescript
// src/routes/users.ts

/**
 * Admin endpoint: Create new user (teacher, accountant, etc.)
 * POST /api/v1/schools/:schoolId/users
 */
router.post(
  '/:schoolId/users',
  authMiddleware,
  requireRole('admin', 'principal'),
  async (req, res) => {
    const { email, displayName, role, classes } = req.body;

    try {
      // Validate
      if (!email || !displayName || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate temporary password
      const tempPassword = generateTemporaryPassword();

      // Create Firebase auth user
      const userRecord = await admin.auth().createUser({
        email,
        password: tempPassword,
        displayName,
        emailVerified: false
      });

      // Set custom claims (role + school)
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role,
        school_id: req.params.schoolId,
        permissions: ROLE_PERMISSIONS[role]
      });

      // Store in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        firebase_uid: userRecord.uid,
        email,
        displayName,
        role,
        school_id: req.params.schoolId,
        permissions: ROLE_PERMISSIONS[role],
        classes: classes || [],
        created_by: req.user.uid,
        created_at: new Date(),
        status: 'active'
      });

      // Send onboarding email with login link + temp password
      await sendOnboardingEmail(email, tempPassword);

      res.status(201).json({
        userId: userRecord.uid,
        email,
        message: 'User created. Onboarding email sent.'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Helper: Generate strong random password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper: Send onboarding email
async function sendOnboardingEmail(email: string, tempPassword: string) {
  // Use SendGrid, Mailgun, or another email service
  const link = `https://app.schoolerp.in/login?email=${email}`;
  
  // Email template...
  // Subject: Welcome to School ERP
  // Body: "Click here to login. Temporary password: [temp]"
}
```

---

# PART 9: SESSION MANAGEMENT & TOKEN REFRESH

```typescript
// src/services/sessionService.ts

/**
 * Automatically refresh token 5 minutes before expiry
 */
export class SessionManager {
  private refreshInterval: NodeJS.Timeout | null = null;

  startSessionManagement() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.scheduleTokenRefresh(user);
      } else {
        this.stopRefresh();
      }
    });
  }

  private scheduleTokenRefresh(user: User) {
    // Get token expiry time
    const token = auth.currentUser?.getIdTokenResult();
    
    if (!token) return;

    const expiryTime = token.expirationTime.getTime();
    const now = Date.now();
    const refreshAfter = expiryTime - now - 5 * 60 * 1000; // Refresh 5 min before expiry

    this.refreshInterval = setTimeout(async () => {
      try {
        // Force token refresh
        await user.getIdToken(true);
        
        // Reschedule
        this.scheduleTokenRefresh(user);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Redirect to login
        window.location.href = '/login';
      }
    }, refreshAfter);
  }

  private stopRefresh() {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

export const sessionManager = new SessionManager();
```

---

# PART 10: SECURITY BEST PRACTICES CHECKLIST

## Implementation Checklist

```markdown
# Security Checklist for Authentication

## Firebase Setup
- [ ] Enable Email/Password authentication
- [ ] Enable Google OAuth
- [ ] Disable anonymous authentication
- [ ] Set strong password policy (min 8 chars, special chars recommended)
- [ ] Enable email verification requirement
- [ ] Configure CORS for allowed domains

## API Security
- [ ] All routes require authMiddleware (except /login, /health)
- [ ] Validate idToken signature on every request
- [ ] Implement rate limiting on login endpoint
- [ ] Log all failed login attempts
- [ ] Implement CSRF protection

## Frontend Security
- [ ] Use HTTPS only (enforce in production)
- [ ] Store token in secure storage, NOT localStorage (use httpOnly cookies if possible)
- [ ] Clear token on logout
- [ ] Implement auto-logout after 30 mins of inactivity
- [ ] Use secure headers (X-Content-Type-Options, X-Frame-Options)

## Database Security
- [ ] Firestore security rules enforce role-based access
- [ ] Validate ownership before returning sensitive data (grades, fees)
- [ ] Encrypt PII (Aadhar, phone numbers) at rest
- [ ] Audit logs for all data access

## Monitoring
- [ ] Alert on multiple failed login attempts (>5 in 10 mins)
- [ ] Monitor for tokens used from multiple IPs simultaneously
- [ ] Log all user creation/deletion by admins
- [ ] Review access logs weekly

## Incident Response
- [ ] Procedure to revoke user tokens
- [ ] Procedure to reset compromised passwords
- [ ] Procedure to disable malicious accounts
- [ ] Document security incidents
```

---

# PART 11: WEEK 1-2 IMPLEMENTATION SCHEDULE

## Week 1: Foundation

**Monday-Tuesday:**
- [ ] Firebase Auth enabled (Email + Google)
- [ ] authMiddleware implemented + tested
- [ ] Custom claims structure defined

**Wednesday-Thursday:**
- [ ] React LoginPage component built
- [ ] API axios interceptor with token attachment
- [ ] ProtectedRoute component working
- [ ] Mobile login screen basic version

**Friday:**
- [ ] Full login flow working (Web + Mobile)
- [ ] Tests for authMiddleware (5+ tests)
- [ ] API requires valid token on all endpoints

## Week 2: User Management

**Monday-Wednesday:**
- [ ] Admin endpoint to create users
- [ ] User role assignment working
- [ ] Firestore security rules written + tested
- [ ] Permission matrix implemented

**Thursday-Friday:**
- [ ] Teacher receives onboarding email + login
- [ ] Parent signup + login working
- [ ] Session management (token refresh) working
- [ ] Password reset flow implemented
- [ ] Security review checklist completed

---

This comprehensive guide covers everything needed to implement authentication & authorization for your school ERP system!

