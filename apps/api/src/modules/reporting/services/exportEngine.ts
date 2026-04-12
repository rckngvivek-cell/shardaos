// Export Engine - PDF, Excel, CSV generation

import PDFDocument from 'pdfkit';
import { Workbook } from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import {
  ReportColumn,
  ReportData,
  ExportFormat,
} from '../types';

export class ExportEngine {
  /**
   * Generate PDF report
   */
  static async generatePDF(
    data: ReportData,
    schoolName: string,
    schoolLogo?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
        });

        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => {
          buffers.push(chunk);
        });

        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        doc.on('error', reject);

        // Header
        this.addPDFHeader(doc, schoolName, data.name, data.generatedAt);

        // Title
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(data.name, { align: 'center' })
          .moveDown(0.5);

        // Metadata
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated: ${data.generatedAt.toLocaleString('en-IN')}`, {
            align: 'right',
          })
          .text(`Records: ${data.rowCount}`, { align: 'right' })
          .moveDown(1);

        // Table
        this.addPDFTable(doc, data.columns, data.rows);

        // Footer
        this.addPDFFooter(doc, data.reportId);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel report
   */
  static async generateExcel(data: ReportData): Promise<Buffer> {
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Report', {
        pageSetup: {
          paperSize: 8, // A4
          orientation: 'portrait',
        } as any,
      });

      // Title
      const titleRow = worksheet.addRow([data.name]);
      titleRow.font = { bold: true, size: 14 };
      worksheet.mergeCells(`A1:${String.fromCharCode(65 + data.columns.length - 1)}1`);

      // Metadata
      const metaRow = worksheet.addRow([`Generated: ${data.generatedAt.toLocaleString('en-IN')}`]);
      metaRow.font = { size: 10, italic: true };
      worksheet.mergeCells(
        `A2:${String.fromCharCode(65 + data.columns.length - 1)}2`,
      );

      worksheet.addRow([]); // Blank row

      // Headers
      const headerRow = worksheet.addRow(data.columns.map((c) => c.label));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Data rows
      data.rows.forEach((row: Record<string, any>) => {
        const values = data.columns.map((col: ReportColumn) => {
          const value = row[col.field];
          if (col.format === 'currency' && typeof value === 'number') {
            return `₹${value.toFixed(2)}`;
          }
          if (col.format === 'percent' && typeof value === 'number') {
            return `${value.toFixed(2)}%`;
          }
          if (col.format === 'date' && value instanceof Date) {
            return value.toLocaleDateString('en-IN');
          }
          return value !== null && value !== undefined ? String(value) : '';
        });

        const dataRow = worksheet.addRow(values);

        // Color code grades/percentages
        data.columns.forEach((col: ReportColumn, idx: number) => {
          const value = row[col.field];
          if ((col.format === 'percent' || col.label.includes('%')) && typeof value === 'number') {
            if (value < 75) {
              dataRow.getCell(idx + 1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }, // Red
              };
              dataRow.getCell(idx + 1).font = { color: { argb: 'FFFFFFFF' } };
            } else if (value >= 95) {
              dataRow.getCell(idx + 1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00B050' }, // Green
              };
              dataRow.getCell(idx + 1).font = { color: { argb: 'FFFFFFFF' } };
            } else {
              dataRow.getCell(idx + 1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' }, // Yellow
              };
            }
          }
        });
      });

      // Auto-fit columns
      worksheet.columns = data.columns.map((col, idx) => ({
        key: `col${idx}`,
        width: (col.width || col.label.length) + 2,
      }));

      // Note: autoFilter feature requires specific implementation
      // Commented out for now to avoid type errors with exceljs version
      // const filterRange = `A4:${String.fromCharCode(65 + data.columns.length - 1)}${data.rows.length + 4}`;
      // worksheet.autoFilter = filterRange;

      // Generate buffer
      return workbook.xlsx.writeBuffer() as any;
    } catch (error) {
      throw new Error(`Failed to generate Excel: ${error}`);
    }
  }

  /**
   * Generate CSV report
   */
  static async generateCSV(data: ReportData): Promise<string> {
    try {
      const headers = data.columns.map((c) => c.label);

      const rows = data.rows.map((row: Record<string, any>) =>
        data.columns.map((col: ReportColumn) => {
          const value = row[col.field];
          if (col.format === 'currency' && typeof value === 'number') {
            return value.toFixed(2);
          }
          if (col.format === 'date' && value instanceof Date) {
            return value.toLocaleDateString('en-IN');
          }
          return value !== null && value !== undefined ? String(value) : '';
        }),
      );

      const csv = stringify([headers, ...rows], {
        quoted: true,
        quoted_string: true,
        escape: '"',
      });

      return csv;
    } catch (error) {
      throw new Error(`Failed to generate CSV: ${error}`);
    }
  }

  /**
   * Generate Report in specified format
   */
  static async generateReport(
    data: ReportData,
    format: ExportFormat,
    schoolName: string = 'School',
    schoolLogo?: string,
  ): Promise<Buffer | string> {
    switch (format) {
      case ExportFormat.PDF:
        return this.generatePDF(data, schoolName, schoolLogo);
      case ExportFormat.EXCEL:
        return this.generateExcel(data);
      case ExportFormat.CSV:
        return this.generateCSV(data) as Promise<string>;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Helper methods
  private static addPDFHeader(
    doc: any,
    schoolName: string,
    reportTitle: string,
    generatedAt: Date,
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(schoolName, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('CONFIDENTIAL', { align: 'center' })
      .moveDown(1);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
  }

  private static addPDFTable(
    doc: InstanceType<typeof PDFDocument>,
    columns: ReportColumn[],
    rows: any[],
  ): void {
    const columnWidths = columns.map((c) => c.width || 80);
    const tableX = 40;
    const tableY = doc.y;
    let currentY = tableY;

    // Headers
    let currentX = tableX;
    columns.forEach((col, idx) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(col.label, currentX, currentY, {
          width: columnWidths[idx],
          height: 20,
          align: 'left',
        });
      currentX += columnWidths[idx];
    });

    doc.moveTo(tableX, currentY + 20).lineTo(tableX + columnWidths.reduce((a, b) => a + b, 0), currentY + 20).stroke();
    currentY += 30;

    // Data rows (limit to 100 rows per page to avoid overflow)
    const rowsPerPage = 100;
    rows.slice(0, rowsPerPage).forEach((row) => {
      currentX = tableX;

      columns.forEach((col, idx) => {
        const value = row[col.field];
        const displayValue = this.formatCellValue(value, col.format);

        doc
          .font('Helvetica')
          .fontSize(9)
          .text(displayValue, currentX, currentY, {
            width: columnWidths[idx],
            height: 15,
            align: 'left',
          });

        currentX += columnWidths[idx];
      });

      currentY += 20;
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
      }
    });
  }

  private static addPDFFooter(
    doc: InstanceType<typeof PDFDocument>,
    reportId: string,
  ): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Report ID: ${reportId} | Page ${i + 1} of ${pageCount}`, 40, 750, {
          align: 'center',
        });
    }
  }

  private static formatCellValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'currency':
        return `₹${typeof value === 'number' ? value.toFixed(2) : value}`;
      case 'percent':
        return `${typeof value === 'number' ? value.toFixed(2) : value}%`;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString('en-IN') : String(value);
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      default:
        return String(value);
    }
  }
}
