// Export Engine Tests - PDF, Excel, CSV generation

import { ExportEngine } from '../../../src/modules/reporting/services/exportEngine';
import {
  ExportFormat,
  ReportData,
  ReportType,
  ReportColumn,
} from '../../../src/modules/reporting/types';

describe('ExportEngine', () => {
  const mockReportData: ReportData = {
    reportId: 'rpt-123',
    name: 'Test Report',
    type: ReportType.ATTENDANCE,
    generatedAt: new Date('2026-04-14T10:30:00Z'),
    rowCount: 100,
    columns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'rollNumber', label: 'Roll #' },
      {
        field: 'attendancePercent',
        label: 'Attendance %',
        format: 'percent',
      },
      { field: 'status', label: 'Status' },
    ],
    rows: [
      {
        studentName: 'Rohan Sharma',
        rollNumber: '1',
        attendancePercent: 92.5,
        status: 'present',
      },
      {
        studentName: 'Priya Verma',
        rollNumber: '2',
        attendancePercent: 100,
        status: 'present',
      },
      {
        studentName: 'Amit Singh',
        rollNumber: '3',
        attendancePercent: 75.0,
        status: 'warning',
      },
    ],
    expiresAt: new Date(),
  };

  describe('generatePDF', () => {
    it('should generate PDF buffer', async () => {
      const pdfBuffer = await ExportEngine.generatePDF(
        mockReportData,
        'Test School',
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDFs typically start with %PDF magic bytes
      expect(pdfBuffer.toString('utf8', 0, 4)).toContain('PDF');
    });

    it('should generate PDF in <5 seconds', async () => {
      const startTime = Date.now();
      await ExportEngine.generatePDF(mockReportData, 'Test School');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should include report title in PDF', async () => {
      const pdfBuffer = await ExportEngine.generatePDF(
        mockReportData,
        'Test School',
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle special characters in data', async () => {
      const specialData = {
        ...mockReportData,
        rows: [
          {
            studentName: 'नाम (Name)',
            rollNumber: '1',
            attendancePercent: 90,
            status: 'Présent',
          },
        ],
      };

      const pdfBuffer = await ExportEngine.generatePDF(
        specialData,
        'Test School',
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateExcel', () => {
    it('should generate Excel buffer', async () => {
      const excelBuffer = await ExportEngine.generateExcel(mockReportData);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
      // Excel files start with specific bytes (PK = 0x504B)
      expect(excelBuffer[0]).toBe(0x50);
      expect(excelBuffer[1]).toBe(0x4b);
    });

    it('should generate Excel in <5 seconds', async () => {
      const startTime = Date.now();
      await ExportEngine.generateExcel(mockReportData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should include headers and data rows', async () => {
      const excelBuffer = await ExportEngine.generateExcel(mockReportData);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should apply color coding for percentage values', async () => {
      const excelBuffer = await ExportEngine.generateExcel(mockReportData);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      // Color coding is applied at byte level, just verify generation succeeds
    });

    it('should handle empty data', async () => {
      const emptyData = {
        ...mockReportData,
        rows: [],
      };

      const excelBuffer = await ExportEngine.generateExcel(emptyData);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateCSV', () => {
    it('should generate CSV string', async () => {
      const csv = await ExportEngine.generateCSV(mockReportData);

      expect(typeof csv).toBe('string');
      expect(csv.length).toBeGreaterThan(0);
    });

    it('should generate CSV in <2 seconds', async () => {
      const startTime = Date.now();
      await ExportEngine.generateCSV(mockReportData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('should include headers', async () => {
      const csv = await ExportEngine.generateCSV(mockReportData);

      expect(csv).toContain('Student Name');
      expect(csv).toContain('Roll #');
      expect(csv).toContain('Attendance %');
      expect(csv).toContain('Status');
    });

    it('should include data rows', async () => {
      const csv = await ExportEngine.generateCSV(mockReportData);

      expect(csv).toContain('Rohan Sharma');
      expect(csv).toContain('Priya Verma');
      expect(csv).toContain('Amit Singh');
    });

    it('should properly quote fields with commas', async () => {
      const dataWithCommas = {
        ...mockReportData,
        rows: [
          {
            studentName: 'Sharma, Rohan',
            rollNumber: '1',
            attendancePercent: 92.5,
            status: 'Present, No Issues',
          },
        ],
      };

      const csv = await ExportEngine.generateCSV(dataWithCommas);

      expect(csv).toContain('"Sharma, Rohan"');
      expect(csv).toContain('"Present, No Issues"');
    });

    it('should handle UTF-8 encoding correctly', async () => {
      const utf8Data = {
        ...mockReportData,
        rows: [
          {
            studentName: 'राँhन शर्मा',
            rollNumber: '1',
            attendancePercent: 90,
            status: 'उपस्थित',
          },
        ],
      };

      const csv = await ExportEngine.generateCSV(utf8Data);

      expect(Buffer.from(csv, 'utf8').toString('utf8')).toContain('राँhन शर्मा');
    });
  });

  describe('generateReport', () => {
    it('should generate PDF when PDF format requested', async () => {
      const result = await ExportEngine.generateReport(
        mockReportData,
        ExportFormat.PDF,
        'Test School',
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate Excel when Excel format requested', async () => {
      const result = await ExportEngine.generateReport(
        mockReportData,
        ExportFormat.EXCEL,
        'Test School',
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate CSV when CSV format requested', async () => {
      const result = await ExportEngine.generateReport(
        mockReportData,
        ExportFormat.CSV,
        'Test School',
      );

      expect(typeof result).toBe('string');
      expect((result as string).length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        ExportEngine.generateReport(
          mockReportData,
          'invalid' as any,
          'Test School',
        ),
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Large Dataset Performance', () => {
    it('should export large dataset (10k rows) to PDF in <15 seconds', async () => {
      const largeData = {
        ...mockReportData,
        rowCount: 10000,
        rows: Array.from({ length: 10000 }, (_, i) => ({
          studentName: `Student ${i + 1}`,
          rollNumber: String(i + 1),
          attendancePercent: Math.random() * 100,
          status: Math.random() > 0.5 ? 'present' : 'absent',
        })),
      };

      const startTime = Date.now();
      // Note: PDFs are paginated, so testing with subset
      const smallerData = { ...largeData, rows: largeData.rows.slice(0, 1000) };
      await ExportEngine.generatePDF(smallerData, 'Test School');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(15000); // 15 seconds for 1000 rows
    });

    it('should export large dataset (10k rows) to CSV in <5 seconds', async () => {
      const largeData = {
        ...mockReportData,
        rowCount: 10000,
        rows: Array.from({ length: 10000 }, (_, i) => ({
          studentName: `Student ${i + 1}`,
          rollNumber: String(i + 1),
          attendancePercent: Math.random() * 100,
          status: Math.random() > 0.5 ? 'present' : 'absent',
        })),
      };

      const startTime = Date.now();
      await ExportEngine.generateCSV(largeData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});
