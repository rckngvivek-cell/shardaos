import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { created, ok } from '../lib/api-response';
import { AppError } from '../lib/app-error';
import type { StudentService } from '../services/student-service';
import { addStudentSchema, listStudentsQuerySchema } from '../models/students-pr1';

/**
 * In-memory student storage for PR #1 demo/testing
 * Production: Use Firebase Firestore via StudentService
 */
const studentRegistry: Record<string, any> = {
  'student-1': {
    id: 'student-1',
    schoolId: 'demo-school',
    firstName: 'Arjun',
    lastName: 'Kumar',
    email: 'arjun.kumar@student.edu.in',
    phone: '+91-9876543210',
    dateOfBirth: '2010-05-15',
    gradeLevel: '10',
    rollNumber: 'A-101',
    parentName: 'Rajesh Kumar',
    parentPhone: '+91-9876543211',
    parentEmail: 'rajesh@email.com',
    enrollmentDate: '2026-05-06T10:00:00Z',
    createdAt: '2026-05-06T10:05:00Z',
    status: 'active'
  }
};

const emailRegistry = new Set<string>();
emailRegistry.add('arjun.kumar@student.edu.in');

const rollNumberRegistry = new Set<string>();
rollNumberRegistry.add('A-101');

export function createStudentsPR1Router() {
  const router = Router();

  /**
   * POST /api/v1/students - Add a new student
   * Auth: Admin required
   * Response: 201 Created
   */
  router.post('/', (req: any, res: any, next: any) => {
    try {
      // Validate JWT and check authorization
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }
      if (req.user.role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Admin role required to add students');
      }

      // Validate request schema
      const validatedData = addStudentSchema.parse(req.body);

      // Verify school exists (in production, check Firestore)
      if (validatedData.schoolId !== 'demo-school') {
        throw new AppError(404, 'SCHOOL_NOT_FOUND', `School '${validatedData.schoolId}' not found`);
      }

      // Check for duplicate email in the same school
      const existingByEmail = Object.values(studentRegistry).find(
        s => s.email === validatedData.email && s.schoolId === validatedData.schoolId
      );
      if (existingByEmail) {
        throw new AppError(
          409,
          'CONFLICT',
          'Student with this email already exists in this school',
          { field: 'email', issue: 'duplicate' }
        );
      }

      // Check for duplicate roll number in the same school & grade
      const existingByRoll = Object.values(studentRegistry).find(
        s =>
          s.rollNumber === validatedData.rollNumber &&
          s.schoolId === validatedData.schoolId &&
          s.gradeLevel === validatedData.gradeLevel
      );
      if (existingByRoll) {
        throw new AppError(
          409,
          'CONFLICT',
          'Roll number already exists in this grade',
          { field: 'rollNumber', issue: 'duplicate' }
        );
      }

      // Generate UUID for student
      const studentId = uuidv4();
      const now = new Date().toISOString();

      // Create student record
      const student = {
        id: studentId,
        ...validatedData,
        createdAt: now,
        status: 'active'
      };

      // Store in registry (production: save to Firestore)
      studentRegistry[studentId] = student;
      emailRegistry.add(validatedData.email);
      rollNumberRegistry.add(validatedData.rollNumber);

      created(res, student);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/v1/students - List students with pagination and filtering
   * Auth: Teacher/Admin required
   * Query params: schoolId, gradeLevel, status, limit, offset
   * Response: 200 OK with paginated list
   */
  router.get('/', (req: any, res: any, next: any) => {
    try {
      // Validate JWT
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }

      // Parse and validate query parameters
      const query = listStudentsQuerySchema.parse(req.query);

      // Verify school exists (in production, check Firestore)
      if (query.schoolId !== 'demo-school') {
        throw new AppError(404, 'SCHOOL_NOT_FOUND', `School '${query.schoolId}' not found`);
      }

      // Filter students based on criteria
      let students = Object.values(studentRegistry).filter(
        s => s.schoolId === query.schoolId
      );

      // Apply grade level filter if provided
      if (query.gradeLevel) {
        students = students.filter(s => s.gradeLevel === query.gradeLevel);
      }

      // Apply status filter if provided
      if (query.status) {
        students = students.filter(s => s.status === query.status);
      }

      // Apply pagination
      const total = students.length;
      const paginatedStudents = students.slice(query.offset, query.offset + query.limit);
      const hasMore = query.offset + query.limit < total;

      ok(res, {
        data: paginatedStudents,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Factory function for creating students router with service dependency injection
 * This maintains backward compatibility with existing nested routes
 */
export function createStudentsRouter(studentService: StudentService) {
  const router = Router({ mergeParams: true });

  router.get('/search', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const result = await studentService.list(schoolId, req.query);
      ok(res, result.items, {
        total: result.total,
        limit: Number(req.query.limit ?? 20),
        offset: Number(req.query.offset ?? 0),
        hasMore: Number(req.query.offset ?? 0) + result.items.length < result.total
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const result = await studentService.list(schoolId, req.query);
      ok(res, result.items, {
        total: result.total,
        limit: Number(req.query.limit ?? 20),
        offset: Number(req.query.offset ?? 0),
        hasMore: Number(req.query.offset ?? 0) + result.items.length < result.total
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:studentId', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const student = await studentService.get(schoolId, req.params.studentId);
      ok(res, student);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const student = await studentService.create(schoolId, req.body, req.user?.uid ?? 'system');
      created(res, student);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:studentId', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const student = await studentService.update(
        schoolId,
        req.params.studentId,
        req.body,
        req.user?.uid ?? 'system'
      );
      ok(res, {
        studentId: student.studentId,
        updated: true,
        changes: req.body
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:studentId', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const student = await studentService.remove(
        schoolId,
        req.params.studentId,
        req.user?.uid ?? 'system'
      );
      ok(res, {
        studentId: student.studentId,
        deleted: true,
        archivedAt: student.archivedAt
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
