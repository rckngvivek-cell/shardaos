/**
 * Staff Attendance Management API
 * Day 2: Task 2.2 - Build Attendance Endpoints (4 hours)
 * Author: Backend Team
 * Status: IMPLEMENTATION
 */

import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../firestore/collections';
import { verifyAuthMiddleware } from './auth';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MarkAttendanceSchema = z.object({
  class_id: z.string().min(1, 'Class ID required'),
  student_id: z.string().min(1, 'Student ID required'),
  status: z.enum(['present', 'absent', 'late'], {
    errorMap: () => ({ message: 'Status must be present, absent, or late' }),
  }),
  notes: z.string().optional(),
});

const GetAttendanceByClassSchema = z.object({
  class_id: z.string().min(1),
  date: z.string().optional(),
});

const GetAttendanceStatsSchema = z.object({
  class_id: z.string().min(1),
  date_range: z.enum(['day', 'week', 'month']).optional().default('week'),
});

type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
type GetAttendanceByClassInput = z.infer<typeof GetAttendanceByClassSchema>;
type GetAttendanceStatsInput = z.infer<typeof GetAttendanceStatsSchema>;

// ============================================================================
// ENDPOINT 1: POST /attendance/mark
// ============================================================================

/**
 * Mark attendance for student
 * Accepts: class_id, student_id, status (present/absent/late)
 * Returns: Attendance record with ID and timestamp
 */
router.post(
  '/mark',
  verifyAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const validationResult = MarkAttendanceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
      }

      const { class_id, student_id, status, notes } = validationResult.data;
      const staffId = (req as any).staffId;

      // Check for duplicate attendance record (same day)
      const today = new Date().toISOString().split('T')[0];
      const duplicateSnapshot = await db
        .collection('classAttendance')
        .where('class_id', '==', class_id)
        .where('student_id', '==', student_id)
        .where('attendance_date', '==', today)
        .limit(1)
        .get();

      if (!duplicateSnapshot.empty) {
        // Update existing record instead of creating duplicate
        const existingDoc = duplicateSnapshot.docs[0];
        await db
          .collection('classAttendance')
          .doc(existingDoc.id)
          .update({
            status,
            marked_by: staffId,
            updated_at: new Date(),
            notes: notes || null,
          });

        return res.status(200).json({
          id: existingDoc.id,
          status: 'updated',
          timestamp: new Date().toISOString(),
          student_id,
          class_id,
        });
      }

      // Create new attendance record
      const docRef = await db.collection('classAttendance').add({
        class_id,
        student_id,
        status,
        attendance_date: today,
        marked_at: new Date(),
        marked_by: staffId,
        notes: notes || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      res.status(201).json({
        id: docRef.id,
        status: 'created',
        timestamp: new Date().toISOString(),
        student_id,
        class_id,
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ error: 'Failed to mark attendance' });
    }
  }
);

// ============================================================================
// ENDPOINT 2: GET /attendance/by-class
// ============================================================================

/**
 * Get attendance records for a class
 * Query params: class_id (required), date (optional)
 * Returns: Array of attendance records + count
 */
router.get('/by-class', verifyAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const validationResult = GetAttendanceByClassSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { class_id, date } = validationResult.data;
    const queryDate = date || new Date().toISOString().split('T')[0];

    // Query Firestore
    const snapshot = await db
      .collection('classAttendance')
      .where('class_id', '==', class_id)
      .where('attendance_date', '==', queryDate)
      .get();

    const records = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        student_id: data.student_id,
        status: data.status,
        marked_at: data.marked_at?.toDate?.(),
        notes: data.notes,
      };
    });

    res.status(200).json({
      records,
      count: records.length,
      class_id,
      date: queryDate,
    });
  } catch (error) {
    console.error('Get attendance by class error:', error);
    res.status(500).json({ error: 'Failed to retrieve attendance' });
  }
});

// ============================================================================
// ENDPOINT 3: GET /attendance/stats
// ============================================================================

/**
 * Get attendance statistics for a class
 * Query params: class_id (required), date_range (optional: day/week/month)
 * Returns: Statistics with totals and percentages
 */
router.get('/stats', verifyAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const validationResult = GetAttendanceStatsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { class_id, date_range } = validationResult.data;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (date_range) {
      case 'day':
        // Today only - already set
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Query attendance records
    const snapshot = await db
      .collection('classAttendance')
      .where('class_id', '==', class_id)
      .where('marked_at', '>=', startDate)
      .get();

    // Aggregate statistics
    const stats = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      present_percentage: 0,
      absent_percentage: 0,
      late_percentage: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      stats.total += 1;

      switch (data.status) {
        case 'present':
          stats.present += 1;
          break;
        case 'absent':
          stats.absent += 1;
          break;
        case 'late':
          stats.late += 1;
          break;
      }
    });

    // Calculate percentages
    if (stats.total > 0) {
      stats.present_percentage = Math.round((stats.present / stats.total) * 100);
      stats.absent_percentage = Math.round((stats.absent / stats.total) * 100);
      stats.late_percentage = Math.round((stats.late / stats.total) * 100);
    }

    res.status(200).json({
      class_id,
      date_range,
      period_days: Math.ceil(
        (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      ),
      statistics: stats,
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

router.use(
  (error: any, req: Request, res: Response) => {
    console.error('Attendance route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export default router;

/**
 * Usage in main app.ts:
 * 
 * import attendanceRouter from './api/v1/staff/attendance';
 * app.use('/api/v1/staff/attendance', attendanceRouter);
 * 
 * ENDPOINTS:
 * POST   /api/v1/staff/attendance/mark
 * GET    /api/v1/staff/attendance/by-class?class_id=X&date=YYYY-MM-DD
 * GET    /api/v1/staff/attendance/stats?class_id=X&date_range=week
 */
