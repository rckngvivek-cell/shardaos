// Timetable Validator - Conflict Detection

import {
  TimeSlot,
  DayOfWeek,
  ConflictDetection,
  TimetableValidationResult,
} from './types';

export class TimetableValidator {
  /**
   * Check for time conflicts
   */
  static detectConflicts(slots: TimeSlot[]): ConflictDetection {
    const conflicts: ConflictDetection['conflicts'] = [];

    // Check for overlapping slots
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];

        // Check if same day
        if (slot1.day !== slot2.day) continue;

        // Check for time overlap
        if (this.timesOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)) {
          // Check for teacher conflict
          if (slot1.teacher === slot2.teacher) {
            conflicts.push({
              type: 'teacher',
              description: `Teacher ${slot1.teacher} assigned to two classes at same time`,
              slot1,
              slot2,
            });
          }

          // Check for classroom conflict
          if (slot1.classroom === slot2.classroom) {
            conflicts.push({
              type: 'classroom',
              description: `Classroom ${slot1.classroom} assigned to two classes at same time`,
              slot1,
              slot2,
            });
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * Validate timetable structure
   */
  static validate(slots: TimeSlot[]): TimetableValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum slots
    if (slots.length === 0) {
      errors.push('Timetable must have at least one slot');
    }

    // Check for duplicate periods in same day/class
    const periodMap = new Map<string, TimeSlot>();
    for (const slot of slots) {
      const key = `${slot.day}-${slot.period}`;
      if (periodMap.has(key)) {
        errors.push(
          `Duplicate period ${slot.period} on day ${slot.day}`
        );
      } else {
        periodMap.set(key, slot);
      }
    }

    // Check time format validity
    for (const slot of slots) {
      const startValid = this.isValidTime(slot.startTime);
      const endValid = this.isValidTime(slot.endTime);

      if (!startValid) errors.push(`Invalid start time format: ${slot.startTime}`);
      if (!endValid) errors.push(`Invalid end time format: ${slot.endTime}`);

      // Check if end time > start time
      if (startValid && endValid && !this.isEndTimeAfterStart(slot.startTime, slot.endTime)) {
        errors.push(
          `End time must be after start time for ${slot.subject}`
        );
      }
    }

    // Check for covered workdays
    const daysWithClasses = new Set(slots.map(s => s.day));
    if (daysWithClasses.size < 5) {
      warnings.push(`Only ${daysWithClasses.size} days covered; minimum 5 recommended`);
    }

    // Check for equally distributed classes
    const classesPerDay = new Map<DayOfWeek, number>();
    for (const slot of slots) {
      classesPerDay.set(slot.day, (classesPerDay.get(slot.day) || 0) + 1);
    }

    const counts = Array.from(classesPerDay.values());
    const avgClasses = counts.reduce((a, b) => a + b, 0) / counts.length;
    for (const [day, count] of classesPerDay.entries()) {
      if (Math.abs(count - avgClasses) > 2) {
        warnings.push(`Day ${day} has ${count} classes (others avg ${avgClasses.toFixed(1)})`);
      }
    }

    // Check for conflicts
    const conflicts = this.detectConflicts(slots);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      conflicts,
    };
  }

  /**
   * Find free slots for a teacher
   */
  static findFreeSlotsForTeacher(
    slots: TimeSlot[],
    teacher: string,
    day?: DayOfWeek
  ): TimeSlot[] {
    return slots.filter(slot => slot.teacher !== teacher && (!day || slot.day === day));
  }

  /**
   * Find free periods/classrooms for a day
   */
  static findFreePeriodsForDay(slots: TimeSlot[], day: DayOfWeek): number[] {
    const usedPeriods = new Set(
      slots.filter(s => s.day === day).map(s => s.period)
    );

    const freePeriods: number[] = [];
    for (let i = 1; i <= 10; i++) {
      if (!usedPeriods.has(i)) {
        freePeriods.push(i);
      }
    }

    return freePeriods;
  }

  /**
   * Check if two time ranges overlap
   */
  private static timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  /**
   * Check if time format is valid (HH:MM)
   */
  private static isValidTime(time: string): boolean {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) return false;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
  }

  /**
   * Check if end time is after start time
   */
  private static isEndTimeAfterStart(start: string, end: string): boolean {
    const startMins = this.timeToMinutes(start);
    const endMins = this.timeToMinutes(end);
    return endMins > startMins;
  }

  /**
   * Convert time string to minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export default TimetableValidator;
