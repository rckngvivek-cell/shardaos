import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { AppError } from '../lib/app-error';
import { ok, created, fail } from '../lib/api-response';
import { createSchoolSchema } from '../models/schools-pr1';

/**
 * In-memory storage for schools (demo/testing only)
 * Production: Use Firebase Firestore via SchoolsService
 */
const schools: Record<string, any> = {
  'demo-school': {
    id: 'demo-school',
    name: 'Green Valley Public School',
    email: 'principal@greenvalley.edu.in',
    phone: '+91-621-1234567',
    city: 'Muzaffarpur',
    state: 'Bihar',
    address: '42 Knowledge Road, Muzaffarpur',
    pinCode: '842001',
    principalName: 'Richa Verma',
    schoolRegistrationNumber: 'SR-2025-001',
    createdAt: '2025-10-20T08:00:00Z',
    status: 'active'
  }
};

const emailRegistry = new Set<string>();
emailRegistry.add('principal@greenvalley.edu.in');

export function createSchoolsRouter() {
  const router = Router();

  /**
   * POST /api/v1/schools - Create a new school
   * Endpoint: Create School
   * Method: POST
   * Auth: Admin required
   * Response: 201 Created
   */
  router.post('/', (req: any, res: any, next: any) => {
    try {
      // Validate JWT and check admin role
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }
      if (req.user.role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Admin role required to create schools');
      }

      // Validate request schema
      const validatedData = createSchoolSchema.parse(req.body);

      // Check for duplicate email
      if (emailRegistry.has(validatedData.email)) {
        throw new AppError(
          409,
          'CONFLICT',
          'School with this email already exists',
          { field: 'email', issue: 'duplicate' }
        );
      }

      // Generate UUID for school
      const schoolId = uuidv4();
      const now = new Date().toISOString();

      // Create school record
      const school = {
        id: schoolId,
        ...validatedData,
        createdAt: now,
        status: 'active'
      };

      // Store in registry (production: save to Firestore)
      schools[schoolId] = school;
      emailRegistry.add(validatedData.email);

      created(res, school);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/v1/schools/:id - Get school details
   * Endpoint: Get School Details
   * Method: GET
   * Auth: Authenticated users
   * Response: 200 OK
   */
  router.get('/:id', (req: any, res: any, next: any) => {
    try {
      // Validate JWT
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }

      const school = schools[req.params.id];
      if (!school) {
        throw new AppError(404, 'SCHOOL_NOT_FOUND', `School with ID '${req.params.id}' not found`);
      }

      ok(res, school);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
