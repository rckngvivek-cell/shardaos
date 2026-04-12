import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { created, ok } from '../lib/api-response';
import { AppError } from '../lib/app-error';
import { AttendanceService } from '../services/attendance-service';
import { markAttendanceSchema } from '../models/attendance-pr1';

/**
 * In-memory attendance storage for PR #1 demo/testing
 * Production: Use Firebase Firestore via AttendanceService
 */
const attendanceRegistry: Record<string, any> = {};

// Track daily records to prevent duplicates
const dailyAttendanceIndex: Record<string, Set<string>> = {};

export function createAttendancePR1Router() {
  const router = Router();

  /**
   * POST /api/v1/attendance - Mark attendance for a student
   * Auth: Teacher/Admin required
   * Response: 201 Created
   */
  router.post('/', (req: any, res: any, next: any) => {
    try {
      // Validate JWT
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }

      // Check authorization (teacher or admin can mark attendance)
      if (!['teacher', 'admin'].includes(req.user.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Only teachers and admins can mark attendance');
      }

      // Validate request schema
      const validatedData = markAttendanceSchema.parse(req.body);

      // Verify school exists (in production, check Firestore)
      if (validatedData.schoolId !== 'demo-school') {
        throw new AppError(404, 'SCHOOL_NOT_FOUND', `School '${validatedData.schoolId}' not found`);
      }

      // Verify student exists (in production, check Firestore)
      const studentExists = Object.values(attendanceRegistry).some(
        a => a.studentId === validatedData.studentId && a.schoolId === validatedData.schoolId
      );

      // For demo, we allow the first attendance record for any student
      // In production, verify the student exists in the students collection

      // Check for duplicate attendance on same date for same student
      const dateKey = `${validatedData.schoolId}:${validatedData.date}`;
      if (!dailyAttendanceIndex[dateKey]) {
        dailyAttendanceIndex[dateKey] = new Set();
      }

      if (dailyAttendanceIndex[dateKey].has(validatedData.studentId)) {
        throw new AppError(
          409,
          'CONFLICT',
          'Attendance for this student is already marked for this date',
          { field: 'date', issue: 'duplicate' }
        );
      }

      // Generate UUID for attendance record
      const attendanceId = uuidv4();
      const now = new Date().toISOString();

      // Create attendance record
      const attendance = {
        id: attendanceId,
        ...validatedData,
        markedAt: now
      };

      // Store in registry (production: save to Firestore)
      attendanceRegistry[attendanceId] = attendance;
      dailyAttendanceIndex[dateKey].add(validatedData.studentId);

      created(res, attendance);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Factory function for creating attendance router with service dependency injection
 * This maintains backward compatibility with existing nested routes
 */
export function createAttendanceRouter(attendanceService: AttendanceService) {
  const router = Router({ mergeParams: true });

  router.get('/', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const records = await attendanceService.list(schoolId, req.query);
      ok(res, records, {
        total: records.length,
        filters: {
          date: req.query.date ?? null,
          class: req.query.class ?? null,
          section: req.query.section ?? null
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const schoolId = (req.params as Record<string, string>).schoolId;
      const record = await attendanceService.create(
        schoolId,
        req.body,
        req.user?.uid ?? 'system'
      );
      created(res, record);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
