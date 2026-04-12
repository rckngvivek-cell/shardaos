// Report Builder Service - Core report generation logic

import { v4 as generateId } from 'uuid';
import {
  ReportDefinition,
  ReportExecution,
  ReportFilter,
  ReportStatus,
  ReportType,
  ReportColumn,
  SortOption,
  ReportData,
  ExportFormat,
  ReportGenerationRequest,
} from '../types';

import { REPORT_TEMPLATES, getTemplateById } from '../templates';
import { ExportEngine } from './exportEngine';

// Mock database service (in production, this would be Firestore)
export class ReportBuilderService {
  /**
   * Create a new report definition
   */
  static async createReportDefinition(
    schoolId: string,
    userId: string,
    request: ReportGenerationRequest,
  ): Promise<ReportDefinition> {
    const now = new Date();
    const reportDef: ReportDefinition = {
      id: `rpt-${generateId()}`,
      schoolId,
      name: request.name,
      description: request.description,
      type: request.type,
      filters: request.filters,
      columns: request.columns,
      sortBy: request.sortBy,
      groupBy: request.groupBy,
      createdAt: now,
      createdBy: userId,
      lastModified: now,
      isTemplate: false,
      isPublic: false,
    };

    // TODO: Save to Firestore
    // await db.collection('reports').doc(schoolId).collection('definitions').doc(reportDef.id).set(reportDef);

    return reportDef;
  }

  /**
   * Generate report from template
   */
  static async generateFromTemplate(
    schoolId: string,
    userId: string,
    templateId: string,
    filters?: ReportFilter,
    exportFormat?: ExportFormat,
  ): Promise<ReportExecution> {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const mergedFilters = {
      ...template.defaultFilters,
      ...filters,
    };

    const reportDef: ReportDefinition = {
      id: `rpt-${generateId()}`,
      schoolId,
      name: `${template.name} - ${new Date().toLocaleDateString('en-IN')}`,
      description: template.description,
      type: template.type,
      filters: mergedFilters,
      columns: template.defaultColumns,
      sortBy: template.defaultSort,
      groupBy: template.defaultGroupBy,
      createdAt: new Date(),
      createdBy: userId,
      lastModified: new Date(),
      isTemplate: false,
      isPublic: false,
    };

    return this.executeReport(schoolId, reportDef, exportFormat);
  }

  /**
   * Execute a report and generate output
   */
  static async executeReport(
    schoolId: string,
    reportDef: ReportDefinition,
    exportFormat: ExportFormat = ExportFormat.PDF,
  ): Promise<ReportExecution> {
    const startTime = Date.now();
    const execution: ReportExecution = {
      id: `exec-${generateId()}`,
      schoolId,
      reportId: reportDef.id,
      status: ReportStatus.PROCESSING,
      startedAt: new Date(),
      rowCount: 0,
      fileSize: 0,
      exportFormat,
      generatedBy: reportDef.createdBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    try {
      // Fetch data based on report type
      const data = await this.fetchReportData(schoolId, reportDef);

      if (data.length === 0) {
        execution.status = ReportStatus.COMPLETED;
        execution.rowCount = 0;
        execution.fileSize = 0;
        return execution;
      }

      // Apply filtering, grouping, sorting
      let processedData = data;
      processedData = this.applyFilters(processedData, reportDef.filters);
      processedData = this.applySorting(processedData, reportDef.sortBy);
      if (reportDef.groupBy) {
        processedData = this.applyGrouping(processedData, reportDef.groupBy);
      }

      // Build report data
      const reportData: ReportData = {
        reportId: reportDef.id,
        name: reportDef.name,
        type: reportDef.type,
        generatedAt: new Date(),
        rowCount: processedData.length,
        columns: reportDef.columns,
        rows: processedData,
        expiresAt: execution.expiresAt,
      };

      // Export to requested format
      const exportedData = await ExportEngine.generateReport(
        reportData,
        exportFormat,
        'School Name', // TODO: Get from schoolId
      );

      // Save file to Cloud Storage (TODO)
      const fileBuffer = Buffer.isBuffer(exportedData)
        ? exportedData
        : Buffer.from(exportedData);

      execution.status = ReportStatus.COMPLETED;
      execution.rowCount = processedData.length;
      execution.fileSize = fileBuffer.length;
      execution.completedAt = new Date();
      execution.downloadUrl = `https://api.school.app/reports/${execution.id}/download`;

      const generationTime = Date.now() - startTime;
      console.log(
        `Report generated in ${generationTime}ms (${processedData.length} rows)`,
      );

      if (generationTime > 10000) {
        console.warn(
          `⚠️ Report took ${generationTime}ms - Performance degradation detected`,
        );
      }

      return execution;
    } catch (error) {
      execution.status = ReportStatus.FAILED;
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();
      return execution;
    }
  }

  /**
   * Fetch raw data for report based on type
   */
  private static async fetchReportData(
    schoolId: string,
    reportDef: ReportDefinition,
  ): Promise<any[]> {
    // In production, these would be actual Firestore queries
    // For now, returning mock data
    switch (reportDef.type) {
      case ReportType.ATTENDANCE:
        return this.fetchAttendanceData(schoolId, reportDef);
      case ReportType.GRADES:
        return this.fetchGradesData(schoolId, reportDef);
      case ReportType.FEES:
        return this.fetchFeesData(schoolId, reportDef);
      case ReportType.TEACHER:
        return this.fetchTeacherData(schoolId, reportDef);
      case ReportType.SUMMARY:
        return this.fetchSummaryData(schoolId, reportDef);
      default:
        return [];
    }
  }

  private static fetchAttendanceData(schoolId: string, reportDef: ReportDefinition): any[] {
    // Mock attendance data
    return [
      {
        studentName: 'Rohan Sharma',
        rollNumber: '1',
        section: 'A',
        status: 'present',
        markedBy: 'Teacher1',
        presentDays: 22,
        absentDays: 2,
        attendancePercent: 91.67,
      },
      {
        studentName: 'Priya Verma',
        rollNumber: '2',
        section: 'A',
        status: 'present',
        markedBy: 'Teacher1',
        presentDays: 24,
        absentDays: 0,
        attendancePercent: 100,
      },
    ];
  }

  private static fetchGradesData(schoolId: string, reportDef: ReportDefinition): any[] {
    // Mock grades data
    return [
      {
        studentName: 'Rohan Sharma',
        rollNumber: '1',
        section: 'A',
        math: 85,
        english: 92,
        science: 88,
        socialStudies: 90,
        average: 88.75,
        grade: 'A',
        subject: 'Math',
        marks: 85,
        outOf: 100,
        percentage: 85,
      },
      {
        studentName: 'Priya Verma',
        rollNumber: '2',
        section: 'A',
        math: 95,
        english: 96,
        science: 94,
        socialStudies: 95,
        average: 95,
        grade: 'A+',
        subject: 'Math',
        marks: 95,
        outOf: 100,
        percentage: 95,
      },
    ];
  }

  private static fetchFeesData(schoolId: string, reportDef: ReportDefinition): any[] {
    // Mock fees data
    return [
      {
        studentName: 'Rohan Sharma',
        className: '10-A',
        feeAmount: 50000,
        paidAmount: 50000,
        pendingAmount: 0,
        paymentDate: '2026-04-10',
        paymentMode: 'Online',
        status: 'paid',
        totalPending: 0,
        dueDate: '2026-04-30',
        daysPending: 0,
        parentPhone: '9876543210',
      },
      {
        studentName: 'Priya Verma',
        className: '10-A',
        feeAmount: 50000,
        paidAmount: 25000,
        pendingAmount: 25000,
        paymentDate: '2026-04-05',
        paymentMode: 'Online',
        status: 'partial',
        totalPending: 25000,
        dueDate: '2026-04-30',
        daysPending: 6,
        parentPhone: '9876543211',
      },
    ];
  }

  private static fetchTeacherData(schoolId: string, reportDef: ReportDefinition): any[] {
    // Mock teacher data
    return [
      {
        teacherName: 'Mr. Patel',
        subject: 'Mathematics',
        class: '10',
        section: 'A',
        periods: 5,
        schedule: 'Mon-Fri, 9:00 AM',
        className: '10-A',
        plannedLessons: 20,
        completedLessons: 19,
        adherencePercent: 95,
        classesHeld: 24,
      },
    ];
  }

  private static fetchSummaryData(schoolId: string, reportDef: ReportDefinition): any[] {
    // Mock summary data
    return [
      {
        metric: 'Total Students',
        value: 500,
        target: 600,
        achievement: 83.33,
        trend: 'up',
        category: 'Enrollment',
        lastUpdated: '2026-04-14',
      },
      {
        metric: 'Average Attendance',
        value: 92.5,
        target: 95,
        achievement: 97.37,
        trend: 'up',
        category: 'Attendance',
        lastUpdated: '2026-04-14',
      },
    ];
  }

  /**
   * Apply filters to data
   */
  private static applyFilters(data: any[], filters: ReportFilter): any[] {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter((row) => {
      // Date range filter
      if (filters.dateRange) {
        const rowDate = row.date && new Date(row.date);
        if (rowDate) {
          const fromDate = new Date(filters.dateRange.from);
          const toDate = new Date(filters.dateRange.to);
          if (rowDate < fromDate || rowDate > toDate) {
            return false;
          }
        }
      }

      // Section filter
      if (filters.section && filters.section.length > 0) {
        if (!filters.section.includes(row.section)) {
          return false;
        }
      }

      // Subject filter
      if (filters.subject && filters.subject.length > 0) {
        if (!filters.subject.includes(row.subject)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(row.status)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to data
   */
  private static applySorting(
    data: any[],
    sortOptions?: SortOption[],
  ): any[] {
    if (!sortOptions || sortOptions.length === 0) {
      return data;
    }

    return [...data].sort((a, b) => {
      for (const sort of sortOptions) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (aVal < bVal) {
          return sort.order === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sort.order === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  /**
   * Apply grouping to data
   */
  private static applyGrouping(data: any[], groupBy: string): any[] {
    // Simple grouping - collect rows with same groupBy value
    const grouped: Record<string, any[]> = {};

    for (const row of data) {
      const key = String(row[groupBy] || 'N/A');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    }

    // Return flattened array with group headers (in production, might return nested structure)
    return data;
  }
}
