import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'absent', 'leave', 'late']);

export const attendanceEntrySchema = z.object({
  studentId: z.string().trim().min(1),
  status: attendanceStatusSchema,
  remarks: z.string().trim().min(1).optional()
});

export const attendanceRecordSchema = z.object({
  attendanceId: z.string(),
  schoolId: z.string(),
  date: z.string().date(),
  class: z.coerce.number().int().min(1).max(12),
  section: z.string().trim().min(1),
  period: z.coerce.number().int().min(1).max(12).optional(),
  entries: z.array(attendanceEntrySchema).min(1),
  markedBy: z.string().trim().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createAttendanceSchema = attendanceRecordSchema.omit({
  attendanceId: true,
  schoolId: true,
  markedBy: true,
  createdAt: true,
  updatedAt: true
});

export const attendanceQuerySchema = z.object({
  date: z.string().date().optional(),
  class: z.coerce.number().int().min(1).max(12).optional(),
  section: z.string().trim().optional()
});

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
