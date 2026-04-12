// Bulk Import Routes

import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import BulkImportParser from './parser';
import BulkImportValidator from './validator';
import BulkImportProcessor from './processor';
import { ImportType, ParsedRecord } from './types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/bulk-import/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * POST /api/v1/schools/:schoolId/bulk-import
 * Upload and process bulk import file
 */
router.post(
  '/:schoolId/bulk-import',
  upload.single('file'),
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const { type, dryRun } = req.body;
      const file = req.file as any;

      // Validate input
      if (!file) {
        return res
          .status(400)
          .json({ error: 'No file provided' });
      }

      if (!type || !Object.values(ImportType).includes(type)) {
        return res
          .status(400)
          .json({ error: 'Invalid or missing import type' });
      }

      const fileSize = BulkImportParser.getFileSizeMB(file.buffer);
      if (fileSize > 10) {
        return res
          .status(400)
          .json({ error: 'File size exceeds 10 MB limit' });
      }

      // Parse headers
      const content = file.buffer.toString('utf-8');
      const headerValidation = BulkImportParser.validateHeaders(content, type);
      
      if (!headerValidation.valid) {
        return res.status(400).json({
          error: 'Invalid CSV headers',
          missingHeaders: headerValidation.missingHeaders,
        });
      }

      // Parse CSV
      const parsedRecords: ParsedRecord[] = await BulkImportParser.parseCSV(
        content,
        type
      );

      if (parsedRecords.length === 0) {
        return res.status(400).json({
          error: 'No valid records in CSV file',
        });
      }

      // Extract valid records for validation
      const validRecords = parsedRecords.filter(r => r.valid).map(r => r.data);

      // Validate records
      const validation = await BulkImportValidator.validate(
        parsedRecords,
        type,
        schoolId
      );

      // If dry run, return validation results
      if (dryRun === 'true' || dryRun === true) {
        return res.status(200).json({
          sessionId: uuidv4(),
          status: 'validated',
          ...BulkImportValidator.formatValidationResponse(validation),
        });
      }

      // Check if we can proceed
      if (!BulkImportValidator.canProceed(validation)) {
        return res.status(400).json({
          error: 'Validation failed. Fix errors before importing.',
          ...BulkImportValidator.formatValidationResponse(validation),
        });
      }

      // Process records (actual import)
      const sessionId = uuidv4();
      const session = await BulkImportProcessor.processRecords(
        sessionId,
        schoolId,
        type,
        validRecords,
        false
      );

      const response = BulkImportProcessor.toApiResponse(session);

      // Add performance metrics
      const performanceMet = BulkImportProcessor.validatePerformance(session);
      
      res.status(201).json({
        ...response,
        performanceMet,
        message: performanceMet 
          ? 'Import completed successfully within performance targets'
          : 'Import completed but exceeded performance targets',
      });

      // Clean up uploaded file
      if (file.path) {
        const fs = require('fs').promises;
        fs.unlink(file.path).catch(console.error);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Bulk import error:', error);
      
      res.status(500).json({
        error: 'Import processing failed',
        message,
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/bulk-import/status/:sessionId
 * Get import session status
 */
router.get(
  '/:schoolId/bulk-import/status/:sessionId',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

      // TODO: Fetch session from database
      // For now, return placeholder response
      res.status(200).json({
        sessionId,
        schoolId,
        status: 'pending',
        message: 'Session tracking implementation pending',
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch session status',
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/bulk-import/history
 * Get import history
 */
router.get(
  '/:schoolId/bulk-import/history',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const limitVal = Array.isArray(req.query.limit) ? parseInt(req.query.limit[0]) : parseInt((req.query.limit as string) ?? '10');
      const offsetVal = Array.isArray(req.query.offset) ? parseInt(req.query.offset[0]) : parseInt((req.query.offset as string) ?? '0');

      // TODO: Fetch history from database
      res.status(200).json({
        schoolId,
        imports: [],
        total: 0,
        message: 'History tracking implementation pending',
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch import history',
      });
    }
  }
);

export default router;
