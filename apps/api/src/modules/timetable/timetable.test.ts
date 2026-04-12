// Timetable Tests

import { describe, test, expect } from '@jest/globals';
import TimetableValidator from '../validator';
import { DayOfWeek, TimeSlot } from '../types';

describe('TimetableValidator', () => {
  const validSlots: TimeSlot[] = [
    {
      day: DayOfWeek.MONDAY,
      period: 1,
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Math',
      teacher: 'mr.kumar@school.edu',
      classroom: 'A1',
    },
    {
      day: DayOfWeek.MONDAY,
      period: 2,
      startTime: '10:00',
      endTime: '11:00',
      subject: 'English',
      teacher: 'mrs.sharma@school.edu',
      classroom: 'A1',
    },
  ];

  test('should validate correct timetable', () => {
    const result = TimetableValidator.validate(validSlots);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect duplicate periods', () => {
    const conflictSlots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.MONDAY,
        period: 1, // Duplicate period
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Science',
        teacher: 'mr.singh@school.edu',
        classroom: 'A2',
      },
    ];

    const result = TimetableValidator.validate(conflictSlots);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should detect teacher conflicts', () => {
    const conflictSlots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:30',
        endTime: '10:30',
        subject: 'Science',
        teacher: 'mr.kumar@school.edu', // Same teacher, overlapping time
        classroom: 'A2',
      },
    ];

    const conflicts = TimetableValidator.detectConflicts(conflictSlots);

    expect(conflicts.hasConflict).toBe(true);
    expect(conflicts.conflicts.some(c => c.type === 'teacher')).toBe(true);
  });

  test('should detect classroom conflicts', () => {
    const conflictSlots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:30',
        endTime: '10:30',
        subject: 'Science',
        teacher: 'mrs.sharma@school.edu',
        classroom: 'A1', // Same classroom, overlapping time
      },
    ];

    const conflicts = TimetableValidator.detectConflicts(conflictSlots);

    expect(conflicts.hasConflict).toBe(true);
    expect(conflicts.conflicts.some(c => c.type === 'classroom')).toBe(true);
  });

  test('should allow same teacher on different days', () => {
    const slots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.TUESDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A2',
      },
    ];

    const conflicts = TimetableValidator.detectConflicts(slots);

    expect(conflicts.hasConflict).toBe(false);
  });

  test('should allow same classroom on different days', () => {
    const slots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.TUESDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Science',
        teacher: 'mrs.sharma@school.edu',
        classroom: 'A1',
      },
    ];

    const conflicts = TimetableValidator.detectConflicts(slots);

    expect(conflicts.hasConflict).toBe(false);
  });

  test('should validate time format', () => {
    const invalidSlots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '25:00', // Invalid hour
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
    ];

    const result = TimetableValidator.validate(invalidSlots);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid start time'))).toBe(true);
  });

  test('should ensure end time after start time', () => {
    const invalidSlots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '10:00',
        endTime: '09:00', // End before start
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
    ];

    const result = TimetableValidator.validate(invalidSlots);

    expect(result.valid).toBe(false);
  });

  test('should find free periods', () => {
    const slots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.MONDAY,
        period: 3,
        startTime: '11:00',
        endTime: '12:00',
        subject: 'Science',
        teacher: 'mrs.sharma@school.edu',
        classroom: 'A1',
      },
    ];

    const freePeriods = TimetableValidator.findFreePeriodsForDay(slots, DayOfWeek.MONDAY);

    expect(freePeriods).toContain(2);
    expect(freePeriods).toContain(4);
    expect(freePeriods).not.toContain(1);
    expect(freePeriods).not.toContain(3);
  });

  test('should warn about uneven distribution', () => {
    const slots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.MONDAY,
        period: 2,
        startTime: '10:00',
        endTime: '11:00',
        subject: 'English',
        teacher: 'mrs.sharma@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.MONDAY,
        period: 3,
        startTime: '11:00',
        endTime: '12:00',
        subject: 'Science',
        teacher: 'mr.singh@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.TUESDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'History',
        teacher: 'mrs.patel@school.edu',
        classroom: 'A1',
      },
    ];

    const result = TimetableValidator.validate(slots);

    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('Timetable Integration', () => {
  test('complete workflow: validate -> detect conflicts -> create', () => {
    const slots: TimeSlot[] = [
      {
        day: DayOfWeek.MONDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Math',
        teacher: 'mr.kumar@school.edu',
        classroom: 'A1',
      },
      {
        day: DayOfWeek.TUESDAY,
        period: 1,
        startTime: '09:00',
        endTime: '10:00',
        subject: 'English',
        teacher: 'mrs.sharma@school.edu',
        classroom: 'A2',
      },
    ];

    // Validate
    const validation = TimetableValidator.validate(slots);
    expect(validation.valid).toBe(true);

    // Detect conflicts
    const conflicts = TimetableValidator.detectConflicts(slots);
    expect(conflicts.hasConflict).toBe(false);
  });
});
