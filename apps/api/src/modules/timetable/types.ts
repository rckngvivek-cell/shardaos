// Timetable Types & Schemas

import { z } from 'zod';

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

// Validation Schemas
export const TimeSlotSchema = z.object({
  day: z.nativeEnum(DayOfWeek),
  period: z.number().min(1).max(10), // Period number (1-10)
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  subject: z.string().min(1).max(100),
  teacher: z.string().email(),
  classroom: z.string().min(1).max(50),
});

export const TimetableSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  classId: z.string(),
  section: z.string().regex(/^[A-Z]$/),
  slots: z.array(TimeSlotSchema).min(1),
  version: z.number().default(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Timetable = z.infer<typeof TimetableSchema>;

// Conflict detection result
export interface ConflictDetection {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'teacher' | 'classroom' | 'student';
    description: string;
    slot1: TimeSlot;
    slot2?: TimeSlot;
  }>;
}

// Timetable validation result
export interface TimetableValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: ConflictDetection;
}

// Timetable API response
export interface TimetableResponse {
  id: string;
  schoolId: string;
  classId: string;
  section: string;
  slots: TimeSlot[];
  version: number;
  createdAt: string;
  updatedAt: string;
  validationResult?: TimetableValidationResult;
}

// Timetable filter options
export interface TimetableFilterOptions {
  teacher?: string;
  classroom?: string;
  day?: DayOfWeek;
  period?: number;
}

// Free slot info
export interface FreeSlot {
  day: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  reason: string; // 'no_class' | 'break' | 'lunch'
}
