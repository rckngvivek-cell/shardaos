// Timetable Routes

import express, { Router, Request, Response } from 'express';
import TimetableService from './service';
import TimetableValidator from './validator';
import { TimeSlotSchema } from './types';

const router = Router();
const timetableService = new TimetableService();

/**
 * POST /api/v1/schools/:schoolId/timetables
 * Create new timetable
 */
router.post(
  '/:schoolId/timetables',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const { classId, section, slots } = req.body;

      if (!classId || !section || !slots) {
        return res.status(400).json({
          error: 'Missing required fields: classId, section, slots',
        });
      }

      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          error: 'Slots must be a non-empty array',
        });
      }

      // Validate slots
      const validation = await timetableService.validateTimetable(slots);
      
      const timetable = await timetableService.createTimetable(
        schoolId,
        classId,
        {
          classId,
          section,
          slots,
        }
      );

      res.status(201).json({
        ...timetable,
        validationResult: validation,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Timetable creation error:', error);
      
      res.status(400).json({
        error: 'Failed to create timetable',
        message,
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/timetables/:timetableId
 * Get specific timetable
 */
router.get(
  '/:schoolId/timetables/:timetableId',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const timetableId = Array.isArray(req.params.timetableId) ? req.params.timetableId[0] : req.params.timetableId;

      const timetable = await timetableService.getTimetable(schoolId, timetableId);

      if (!timetable) {
        return res.status(404).json({
          error: 'Timetable not found',
        });
      }

      res.status(200).json(timetable);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch timetable',
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/timetables
 * Get all timetables for school
 */
router.get(
  '/:schoolId/timetables',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;

      const timetables = await timetableService.getTimetables(schoolId);

      res.status(200).json({
        schoolId,
        count: timetables.length,
        timetables,
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch timetables',
      });
    }
  }
);

/**
 * PUT /api/v1/schools/:schoolId/timetables/:timetableId
 * Update timetable
 */
router.put(
  '/:schoolId/timetables/:timetableId',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const timetableId = Array.isArray(req.params.timetableId) ? req.params.timetableId[0] : req.params.timetableId;
      const { slots } = req.body;

      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          error: 'Slots must be a non-empty array',
        });
      }

      const timetable = await timetableService.updateTimetable(schoolId, timetableId, slots);

      res.status(200).json(timetable);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(400).json({
        error: 'Failed to update timetable',
        message,
      });
    }
  }
);

/**
 * DELETE /api/v1/schools/:schoolId/timetables/:timetableId
 * Delete timetable
 */
router.delete(
  '/:schoolId/timetables/:timetableId',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const timetableId = Array.isArray(req.params.timetableId) ? req.params.timetableId[0] : req.params.timetableId;

      await timetableService.deleteTimetable(schoolId, timetableId);

      res.status(200).json({
        message: 'Timetable deleted successfully',
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete timetable',
      });
    }
  }
);

/**
 * POST /api/v1/schools/:schoolId/timetables/validate
 * Validate timetable for conflicts
 */
router.post(
  '/:schoolId/timetables/validate',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const { slots } = req.body;

      if (!Array.isArray(slots)) {
        return res.status(400).json({
          error: 'Slots must be an array',
        });
      }

      const validation = await timetableService.validateTimetable(slots);
      const conflicts = await timetableService.checkConflicts(schoolId, slots);

      res.status(200).json({
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        conflicts: conflicts.conflicts,
      });

    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
      });
    }
  }
);

export default router;
