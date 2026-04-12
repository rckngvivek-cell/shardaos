// Timetable Service

import { db } from '../../lib/firestore';
import { Timetable, TimetableResponse, TimeSlot, TimetableSchema } from './types';
import TimetableValidator from './validator';
import { v4 as uuidv4 } from 'uuid';

export class TimetableService {
  /**
   * Create new timetable
   */
  async createTimetable(schoolId: string, classId: string, data: any): Promise<TimetableResponse> {
    try {
      // Validate input
      const validation = TimetableSchema.safeParse({
        ...data,
        schoolId,
        classId,
      });

      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`);
      }

      const timetable = validation.data;
      const id = uuidv4();

      // Validate timetable for conflicts
      const validationResult = TimetableValidator.validate(timetable.slots);
      if (!validationResult.valid && validationResult.conflicts.hasConflict) {
        throw new Error(
          `Timetable conflicts detected: ${validationResult.conflicts.conflicts[0].description}`
        );
      }

      const now = new Date();
      const doc = {
        ...timetable,
        id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await db
        .collection('schools')
        .doc(schoolId)
        .collection('timetables')
        .doc(id)
        .set(doc);

      return {
        ...doc,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

    } catch (error) {
      throw new Error(
        `Failed to create timetable: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get timetable by ID
   */
  async getTimetable(schoolId: string, timetableId: string): Promise<TimetableResponse | null> {
    try {
      const doc = await db
        .collection('schools')
        .doc(schoolId)
        .collection('timetables')
        .doc(timetableId)
        .get();

      if (!doc.exists) return null;

      const data = doc.data() as any;
      return {
        ...data,
        id: timetableId,
      };

    } catch (error) {
      throw new Error(`Failed to fetch timetable: ${error}`);
    }
  }

  /**
   * Get all timetables for a school
   */
  async getTimetables(schoolId: string): Promise<TimetableResponse[]> {
    try {
      const snapshot = await db
        .collection('schools')
        .doc(schoolId)
        .collection('timetables')
        .get();

      return snapshot.docs.map(doc => ({
        ...(doc.data() as any),
        id: doc.id,
      }));

    } catch (error) {
      throw new Error(`Failed to fetch timetables: ${error}`);
    }
  }

  /**
   * Update timetable
   */
  async updateTimetable(
    schoolId: string,
    timetableId: string,
    slots: TimeSlot[]
  ): Promise<TimetableResponse> {
    try {
      const existing = await this.getTimetable(schoolId, timetableId);
      if (!existing) {
        throw new Error('Timetable not found');
      }

      // Validate new slots
      const validationResult = TimetableValidator.validate(slots);
      if (!validationResult.valid && validationResult.conflicts.hasConflict) {
        throw new Error(
          `Timetable conflicts detected: ${validationResult.conflicts.conflicts[0].description}`
        );
      }

      const now = new Date();
      await db
        .collection('schools')
        .doc(schoolId)
        .collection('timetables')
        .doc(timetableId)
        .update({
          slots,
          version: (existing.version || 1) + 1,
          updatedAt: now.toISOString(),
        });

      return {
        ...existing,
        slots,
        version: (existing.version || 1) + 1,
        updatedAt: now.toISOString(),
      };

    } catch (error) {
      throw new Error(
        `Failed to update timetable: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate timetable before save
   */
  async validateTimetable(slots: TimeSlot[]): Promise<any> {
    const validation = TimetableValidator.validate(slots);
    return validation;
  }

  /**
   * Delete timetable
   */
  async deleteTimetable(schoolId: string, timetableId: string): Promise<void> {
    try {
      await db
        .collection('schools')
        .doc(schoolId)
        .collection('timetables')
        .doc(timetableId)
        .delete();

    } catch (error) {
      throw new Error(`Failed to delete timetable: ${error}`);
    }
  }

  /**
   * Check for conflicts with existing timetables
   */
  async checkConflicts(schoolId: string, slots: TimeSlot[]): Promise<any> {
    const validation = TimetableValidator.validate(slots);
    return {
      valid: !validation.conflicts.hasConflict,
      conflicts: validation.conflicts,
    };
  }
}

export default TimetableService;
