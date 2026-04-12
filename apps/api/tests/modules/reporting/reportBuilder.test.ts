// Report Builder Service Tests

import {
  ReportBuilderService,
} from '../../../src/modules/reporting/services/reportBuilder';
import {
  ReportType,
  ReportStatus,
  ExportFormat,
  ReportGenerationRequest,
} from '../../../src/modules/reporting/types';

describe('ReportBuilderService', () => {
  const schoolId = 'school-123';
  const userId = 'user-456';

  describe('createReportDefinition', () => {
    it('should create a new report definition', async () => {
      const request: ReportGenerationRequest = {
        name: 'Test Attendance Report',
        description: 'Test description',
        type: ReportType.ATTENDANCE,
        filters: {},
        columns: [
          { field: 'studentName', label: 'Student Name' },
          { field: 'status', label: 'Status' },
        ],
      };

      const result = await ReportBuilderService.createReportDefinition(
        schoolId,
        userId,
        request,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(request.name);
      expect(result.type).toBe(ReportType.ATTENDANCE);
      expect(result.createdBy).toBe(userId);
      expect(result.id).toMatch(/^rpt-/);
    });

    it('should set correct timestamps', async () => {
      const request: ReportGenerationRequest = {
        name: 'Test Report',
        type: ReportType.GRADES,
        filters: {},
        columns: [],
      };

      const before = new Date();
      const result = await ReportBuilderService.createReportDefinition(
        schoolId,
        userId,
        request,
      );
      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('executeReport', () => {
    it('should execute report and return execution record', async () => {
      const reportDef = {
        id: 'rpt-123',
        schoolId,
        name: 'Test Attendance',
        type: ReportType.ATTENDANCE,
        filters: {},
        columns: [
          { field: 'studentName', label: 'Student Name' },
          { field: 'status', label: 'Status' },
        ],
        createdAt: new Date(),
        createdBy: userId,
        lastModified: new Date(),
        isTemplate: false,
        isPublic: false,
      };

      const execution = await ReportBuilderService.executeReport(
        schoolId,
        reportDef,
        ExportFormat.PDF,
      );

      expect(execution).toBeDefined();
      expect(execution.reportId).toBe(reportDef.id);
      expect(execution.status).toBe(ReportStatus.COMPLETED);
      expect(execution.rowCount).toBeGreaterThanOrEqual(0);
      expect(execution.exportFormat).toBe(ExportFormat.PDF);
    });

    it('should set expiration to 7 days from now', async () => {
      const reportDef = {
        id: 'rpt-123',
        schoolId,
        name: 'Test Report',
        type: ReportType.GRADES,
        filters: {},
        columns: [],
        createdAt: new Date(),
        createdBy: userId,
        lastModified: new Date(),
        isTemplate: false,
        isPublic: false,
      };

      const before = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const execution = await ReportBuilderService.executeReport(
        schoolId,
        reportDef,
      );
      const after = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 1000);

      expect(execution.expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(execution.expiresAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should handle report generation errors gracefully', async () => {
      const reportDef = {
        id: 'rpt-123',
        schoolId,
        name: 'Test Report',
        type: ReportType.ATTENDANCE,
        filters: {},
        columns: [],
        createdAt: new Date(),
        createdBy: userId,
        lastModified: new Date(),
        isTemplate: false,
        isPublic: false,
      };

      const execution = await ReportBuilderService.executeReport(
        schoolId,
        reportDef,
      );

      // Even with potential errors, should return an execution record
      expect(execution).toBeDefined();
      expect(execution.id).toBeDefined();
    });
  });

  describe('generateFromTemplate', () => {
    it('should generate report from pre-built template', async () => {
      const execution = await ReportBuilderService.generateFromTemplate(
        schoolId,
        userId,
        'daily_attendance_summary',
        undefined,
        ExportFormat.CSV,
      );

      expect(execution).toBeDefined();
      expect(execution.exportFormat).toBe(ExportFormat.CSV);
      expect(execution.status).toBe(ReportStatus.COMPLETED);
    });

    it('should override template filters with provided filters', async () => {
      const customFilters = {
        dateRange: {
          from: '2026-04-01',
          to: '2026-04-14',
        },
        section: ['A', 'B'],
      };

      const execution = await ReportBuilderService.generateFromTemplate(
        schoolId,
        userId,
        'daily_attendance_summary',
        customFilters,
      );

      expect(execution).toBeDefined();
      expect(execution.status).toBe(ReportStatus.COMPLETED);
    });

    it('should throw error for invalid template', async () => {
      await expect(
        ReportBuilderService.generateFromTemplate(
          schoolId,
          userId,
          'non-existent-template',
        ),
      ).rejects.toThrow('Template not found');
    });
  });

  describe('Performance Tests', () => {
    it('should generate attendance report in <10 seconds', async () => {
      const reportDef = {
        id: 'rpt-perf-1',
        schoolId,
        name: 'Performance Test Attendance',
        type: ReportType.ATTENDANCE,
        filters: {},
        columns: [
          { field: 'studentName', label: 'Student' },
          { field: 'status', label: 'Status' },
          { field: 'attendancePercent', label: 'Attendance %' },
        ],
        createdAt: new Date(),
        createdBy: userId,
        lastModified: new Date(),
        isTemplate: false,
        isPublic: false,
      };

      const startTime = Date.now();
      await ReportBuilderService.executeReport(schoolId, reportDef);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it('should generate grades report in <10 seconds', async () => {
      const reportDef = {
        id: 'rpt-perf-2',
        schoolId,
        name: 'Performance Test Grades',
        type: ReportType.GRADES,
        filters: {},
        columns: [
          { field: 'studentName', label: 'Student' },
          { field: 'average', label: 'Average' },
        ],
        createdAt: new Date(),
        createdBy: userId,
        lastModified: new Date(),
        isTemplate: false,
        isPublic: false,
      };

      const startTime = Date.now();
      await ReportBuilderService.executeReport(schoolId, reportDef);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // 10 seconds
    });
  });
});
