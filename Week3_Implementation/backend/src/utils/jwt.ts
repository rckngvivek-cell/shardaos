/**
 * JWT Token Management Utilities
 * Day 1: Task 3 - JWT Integration (1 hour)
 * Author: Backend Team
 * Status: In Development
 */

import jwt from 'jsonwebtoken';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// ============================================================================
// INTERFACES
// ============================================================================

interface TokenPayload {
  staffId: string;
  email?: string;
  role: 'admin' | 'staff' | 'teacher';
  iat?: number;
  exp?: number;
}

interface RefreshTokenPayload {
  staffId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate JWT access token
 * @param staffId - Staff member ID
 * @param role - Staff role (admin, staff, teacher)
 * @param email - Optional staff email for convenience
 * @returns JWT token string
 */
export function generateToken(
  staffId: string,
  role: 'admin' | 'staff' | 'teacher',
  email?: string
): string {
  try {
    const payload: TokenPayload = {
      staffId,
      role,
      ...(email && { email }),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256',
    });

    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Generate refresh token for token rotation
 * @param staffId - Staff member ID
 * @param tokenVersion - Token version for invalidation
 * @returns Refresh token string
 */
export function generateRefreshToken(
  staffId: string,
  tokenVersion: number = 1
): string {
  try {
    const payload: RefreshTokenPayload = {
      staffId,
      tokenVersion,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });

    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

/**
 * Verify JWT token and return payload
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 * @param token - Refresh token to verify
 * @returns Decoded refresh token payload
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error: any) {
    throw new Error('Invalid refresh token');
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Refresh an expired token using refresh token
 * @param refreshToken - Valid refresh token
 * @returns New access token
 */
export function refreshAccessToken(
  refreshToken: string,
  staffId: string,
  role: string
): string {
  try {
    // Verify refresh token is valid
    const decoded = verifyRefreshToken(refreshToken);

    // Check staffId matches (security check)
    if (decoded.staffId !== staffId) {
      throw new Error('Refresh token does not match staff ID');
    }

    // Generate new access token
    const newAccessToken = generateToken(staffId, role as any);

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token');
  }
}

// ============================================================================
// TOKEN VALIDATION HELPERS
// ============================================================================

/**
 * Check if token is expired without throwing
 * @param token - JWT token to check
 * @returns boolean - true if expired, false if valid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}

/**
 * Get token expiry time
 * @param token - JWT token
 * @returns Number of seconds until expiry, or 0 if expired/invalid
 */
export function getTokenTimeToExpiry(token: string): number {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = decoded.exp - now;

    return Math.max(0, timeToExpiry);
  } catch {
    return 0;
  }
}

/**
 * Decode token without verification (use carefully!)
 * Only use for reading token structure, not validation
 * @param token - JWT token
 * @returns Decoded payload
 */
export function decodeTokenUnsafe(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ============================================================================
// TOKEN BLACKLIST (for logout)
// ============================================================================

/**
 * In production, use Redis for token blacklist
 * For now, this is a simple in-memory store (will reset on server restart)
 */
const tokenBlacklist = new Set<string>();

/**
 * Add token to blacklist (logout)
 * TODO: Move to Redis for production
 * @param token - Token to blacklist
 */
export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
}

/**
 * Check if token is blacklisted
 * @param token - Token to check
 * @returns boolean - true if blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class TokenError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TokenError';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  refreshAccessToken,
  isTokenExpired,
  getTokenTimeToExpiry,
  decodeTokenUnsafe,
  blacklistToken,
  isTokenBlacklisted,
  TokenError,
};

/**
 * Usage in auth.ts:
 * 
 * import { generateToken, verifyToken } from '../utils/jwt';
 * 
 * const token = generateToken(staffId, role);
 * const decoded = verifyToken(token);
 */
