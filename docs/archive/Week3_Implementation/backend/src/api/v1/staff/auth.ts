/**
 * Staff Authentication Routes
 * Day 1: Task 1 - Staff Auth Endpoints (2 hours)
 * Author: Backend Team
 * Status: In Development
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../../firestore/collections';
import { generateToken, verifyToken } from '../../utils/jwt';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const LoginInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['admin', 'staff', 'teacher']),
  school_id: z.string(),
});

type LoginInput = z.infer<typeof LoginInputSchema>;
type RegisterInput = z.infer<typeof RegisterInputSchema>;

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify JWT Token Middleware
 * Extracts token from Authorization header and verifies it
 */
export const verifyAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    (req as any).staffId = decoded.staffId;
    (req as any).staffRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * POST /auth/login
 * Authenticates staff member with email/password
 * Returns: { token, staff: { id, email, name, role, school_id } }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = LoginInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { email, password } = validationResult.data;

    // Find staff in Firestore
    const staffSnapshot = await db
      .collection('staff')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (staffSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const staffDoc = staffSnapshot.docs[0];
    const staffData = staffDoc.data();

    // Verify password
    const passwordMatch = await bcrypt.compare(password, staffData.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(staffDoc.id, staffData.role);

    // Update last login timestamp
    await db.collection('staff').doc(staffDoc.id).update({
      last_login_at: new Date(),
      updated_at: new Date(),
    });

    // Return response
    res.status(200).json({
      token,
      staff: {
        id: staffDoc.id,
        email: staffData.email,
        name: staffData.name,
        role: staffData.role,
        school_id: staffData.school_id,
        created_at: staffData.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/logout
 * Logs out staff member (invalidates token on client side)
 * Note: Token is stateless, so logout is mostly client-side
 */
router.post('/logout', (req: Request, res: Response) => {
  try {
    // Could add token to blacklist in Redis here if needed
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /auth/me
 * Gets current authenticated staff member's data
 * Requires valid JWT token
 */
router.get('/me', verifyAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const staffId = (req as any).staffId;

    const staffDoc = await db.collection('staff').doc(staffId).get();

    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffData = staffDoc.data();

    res.status(200).json({
      id: staffDoc.id,
      email: staffData?.email,
      name: staffData?.name,
      role: staffData?.role,
      school_id: staffData?.school_id,
      created_at: staffData?.created_at,
      updated_at: staffData?.updated_at,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/register
 * Creates new staff member (admin only initially)
 * TODO: Add role-based authorization
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validationResult = RegisterInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { email, password, name, role, school_id } = validationResult.data;

    // Check if email already exists
    const existingStaff = await db
      .collection('staff')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingStaff.empty) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new staff document
    const newStaffRef = await db.collection('staff').add({
      email,
      name,
      role,
      school_id,
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
      last_login_at: null,
      is_active: true,
    });

    const token = generateToken(newStaffRef.id, role);

    res.status(201).json({
      message: 'Staff member created successfully',
      token,
      staff: {
        id: newStaffRef.id,
        email,
        name,
        role,
        school_id,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /auth/validate-token
 * Validates if JWT token is still valid without returning user data
 * Returns: { valid: boolean, staffId?: string, role?: string }
 */
router.get('/validate-token', verifyAuthMiddleware, (req: Request, res: Response) => {
  try {
    const staffId = (req as any).staffId;
    const staffRole = (req as any).staffRole;

    res.status(200).json({
      valid: true,
      staffId,
      role: staffRole,
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Auth route error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;

/**
 * Usage in main app.ts:
 * 
 * import staffAuthRouter from './api/v1/staff/auth';
 * app.use('/api/v1/staff/auth', staffAuthRouter);
 */
