import { z } from 'zod';

const attendanceStatus = z.enum(['present', 'absent', 'late', 'excused']);

export const markAttendanceSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  status: attendanceStatus,
  remarks: z.string().max(500).optional(),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  grade: z.string().min(1),
  section: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: attendanceStatus,
      remarks: z.string().max(500).optional(),
    })
  ).min(1),
});

export type MarkAttendanceSchema = z.infer<typeof markAttendanceSchema>;
export type BulkAttendanceSchema = z.infer<typeof bulkAttendanceSchema>;
