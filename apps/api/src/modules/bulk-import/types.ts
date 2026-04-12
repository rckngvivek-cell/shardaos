// Bulk Import Types & Schemas

import { z } from 'zod';

export enum ImportType {
  STUDENTS = 'students',
  TEACHERS = 'teachers',
  CLASSES = 'classes',
}

// Validation Schemas
export const StudentRecordSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  rollNumber: z.string().min(1).max(10),
  section: z.string().regex(/^[A-Z]$/),
  dob: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  gender: z.enum(['M', 'F', 'Other']),
});

export const TeacherRecordSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  subject: z.string().min(1).max(100),
  experience: z.number().min(0).max(50),
});

export type StudentRecord = z.infer<typeof StudentRecordSchema>;
export type TeacherRecord = z.infer<typeof TeacherRecordSchema>;

export interface ParsedRecord {
  row: number;
  data: StudentRecord | TeacherRecord;
  valid: boolean;
  errors?: string[];
}

export interface ValidationResult {
  recordsProcessed: number;
  recordsValid: number;
  recordsInvalid: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  duplicates: Array<{
    row: number;
    field: string;
    value: string;
    existingId: string;
  }>;
}

export interface ImportSessionState {
  sessionId: string;
  schoolId: string;
  type: ImportType;
  status: 'pending' | 'parsing' | 'validating' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  dryRun: boolean;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  startedAt: Date;
  completedAt?: Date;
  fileName: string;
}

export interface BulkImportResponse {
  sessionId: string;
  status: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  startedAt: string;
  completedAt?: string;
  timeSeconds?: number;
}
