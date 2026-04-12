// Reporting Routes - API endpoints for report generation, scheduling, and retrieval

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  ReportGenerationRequest,
  ReportScheduleRequest,
  ReportType,
  ScheduleFrequency,
  ExportFormat,
} from '../modules/reporting/types';
import { ReportBuilderService } from '../modules/reporting/services/reportBuilder';
import { SchedulingEngine } from '../modules/reporting/services/schedulingEngine';
import { REPORT_TEMPLATES, getAllTemplates } from '../modules/reporting/templates';

const router = Router();

// Request validation schemas
const ReportGenerationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(ReportType),
  filters: z.object({
    dateRange: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .optional(),
    section: z.array(z.string()).optional(),
    subject: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
  }),
  columns: z.array(
    z.object({
      field: z.string(),
      label: z.string(),
      width: z.number().optional(),
      format: z
        .enum(['text', 'number', 'percent', 'currency', 'date'])
        .optional(),
    }),
  ),
  sortBy: z
    .array(
      z.object({
        field: z.string(),
        order: z.enum(['asc', 'desc']),
      }),
    )
    .optional(),
  groupBy: z.string().optional(),
  exportFormat: z.nativeEnum(ExportFormat).optional(),
});

const ScheduleReportSchema = z.object({
  reportId: z.string(),
  frequency: z.nativeEnum(ScheduleFrequency),
  time: z.string(), // HH:MM format
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.number().optional(),
  recipients: z.array(z.string().email()),
  format: z.nativeEnum(ExportFormat),
});

/**
 * GET /api/v1/schools/:schoolId/reports/templates
 * Get all available report templates
 */
router.get('/:schoolId/reports/templates', (req: Request, res: Response) => {
  try {
    const templates = getAllTemplates();

    res.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        columnsCount: t.defaultColumns.length,
      })),
      count: templates.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/schools/:schoolId/reports/templates/:templateId
 * Get specific template details
 */
router.get(
  '/:schoolId/reports/templates/:templateId',
  (req: Request, res: Response) => {
    try {
      const { schoolId, templateId } = req.params as { schoolId: string; templateId: string };
      const template = REPORT_TEMPLATES[templateId];

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

/**
 * POST /api/v1/schools/:schoolId/reports/create
 * Create and generate a custom report
 */
router.post('/:schoolId/reports/create', async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params as { schoolId: string };
    const userId = 'user-123'; // TODO: Get from auth middleware

    // Validate request
    const validated = ReportGenerationSchema.parse(req.body);

    // Create report definition
    const reportDef = await ReportBuilderService.createReportDefinition(
      schoolId,
      userId,
      validated,
    );

    // Execute report
    const execution = await ReportBuilderService.executeReport(
      schoolId,
      reportDef,
      validated.exportFormat || ExportFormat.PDF,
    );

    res.json({
      success: true,
      data: {
        reportId: execution.reportId,
        executionId: execution.id,
        downloadUrl: execution.downloadUrl,
        expiresAt: execution.expiresAt,
        rowCount: execution.rowCount,
        fileSize: execution.fileSize,
        status: execution.status,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/schools/:schoolId/reports/from-template/:templateId
 * Generate report from pre-built template
 */
router.post(
  '/:schoolId/reports/from-template/:templateId',
  async (req: Request, res: Response) => {
    try {
      const { schoolId, templateId } = req.params as { schoolId: string; templateId: string };
      const { filters, exportFormat } = req.body;
      const userId = 'user-123'; // TODO: Get from auth middleware

      const execution = await ReportBuilderService.generateFromTemplate(
        schoolId,
        userId,
        templateId,
        filters,
        exportFormat || ExportFormat.PDF,
      );

      res.json({
        success: true,
        data: {
          reportId: execution.reportId,
          executionId: execution.id,
          downloadUrl: execution.downloadUrl,
          expiresAt: execution.expiresAt,
          rowCount: execution.rowCount,
          fileSize: execution.fileSize,
          status: execution.status,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

/**
 * POST /api/v1/schools/:schoolId/reports/:reportId/schedule
 * Schedule a report for recurring delivery
 */
router.post(
  '/:schoolId/reports/:reportId/schedule',
  async (req: Request, res: Response) => {
    try {
      const { schoolId, reportId } = req.params as { schoolId: string; reportId: string };
      const userId = 'user-123'; // TODO: Get from auth middleware

      const validated = ScheduleReportSchema.parse(req.body);

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        validated,
      );

      res.json({
        success: true,
        data: {
          scheduleId: schedule.id,
          reportId: schedule.reportId,
          frequency: schedule.frequency,
          nextRun: schedule.nextRun,
          recipients: schedule.recipients,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

/**
 * GET /api/v1/schools/:schoolId/reports/:reportId/download
 * Download generated report
 */
router.get(
  '/:schoolId/reports/:reportId/download',
  async (req: Request, res: Response) => {
    try {
      const { schoolId, reportId } = req.params;
      // TODO: Fetch from Cloud Storage or generate dynamically
      res.json({
        success: true,
        message: 'Report download endpoint',
        reportId,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

/**
 * GET /api/v1/schools/:schoolId/reports
 * Get list of generated reports
 */
router.get('/:schoolId/reports', async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    // TODO: Fetch from Firestore
    res.json({
      success: true,
      data: [],
      count: 0,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
