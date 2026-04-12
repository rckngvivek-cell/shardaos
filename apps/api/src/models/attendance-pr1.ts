import { z } from 'zod';

/**
 * Schemas for PR #1 - Attendance endpoint
 * Defines request/response contracts for POST /api/v1/attendance
 */

export const markAttendanceSchema = z.object({
  schoolId: z.string().uuid(),
  classId: z.string().optional(),
  studentId: z.string().uuid(),
  date: z.string().date(), // ISO 8601 (YYYY-MM-DD)
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional(),
  markedBy: z.string().uuid(), // Teacher/Admin user ID
});

export const attendanceResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().date(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().optional(),
  markedBy: z.string().uuid(),
  markedAt: z.string().datetime(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type AttendanceResponse = z.infer<typeof attendanceResponseSchema>;
