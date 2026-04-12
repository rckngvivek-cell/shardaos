// CSV Parser for Bulk Import

import { ParsedRecord, ImportType, StudentRecordSchema, TeacherRecordSchema } from './types';

export class BulkImportParser {
  /**
   * Parse CSV file and extract records
   * Handles both students and teachers
   */
  static async parseCSV(fileContent: string, type: ImportType): Promise<ParsedRecord[]> {
    try {
      const lines = fileContent.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header and one data row');
      }

      // Parse header
      const headers = this.parseCSVLine(lines[0]);
      if (headers.length === 0) {
        throw new Error('No headers found in CSV');
      }

      // Parse data rows
      const records: ParsedRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const row = i + 1; // +1 because row 1 is header
        let cleanRecord: any = {};
        try {
          const values = this.parseCSVLine(line);
          const record: any = {};

          // Map values to headers
          for (let j = 0; j < headers.length; j++) {
            record[headers[j]] = values[j] || '';
          }

          // Remove empty fields
          cleanRecord = this.cleanRecord(record);
          
          // Validate against schema
          const schema = type === ImportType.STUDENTS ? StudentRecordSchema : TeacherRecordSchema;
          const validation = schema.safeParse(cleanRecord);

          if (validation.success) {
            records.push({
              row,
              data: validation.data,
              valid: true,
            });
          } else {
            records.push({
              row,
              data: cleanRecord as any,
              valid: false,
              errors: validation.error.errors.map(e => 
                `${e.path.join('.')}: ${e.message}`
              ),
            });
          }
        } catch (error) {
          records.push({
            row,
            data: cleanRecord as any,
            valid: false,
            errors: [error instanceof Error ? error.message : 'Parse error'],
          });
        }
      }

      return records;
    } catch (error) {
      throw new Error(`CSV Parse Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Field delimiter
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  }
  private static cleanRecord(record: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === 'string') {
        cleaned[key] = value.trim();
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Validate required headers are present
   */
  static validateHeaders(fileContent: string, type: ImportType): {
    valid: boolean;
    missingHeaders: string[];
  } {
    const lines = fileContent.split('\n');
    if (lines.length === 0) {
      return { valid: false, missingHeaders: ['No data in file'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredHeaders = type === ImportType.STUDENTS
      ? ['firstname', 'lastname', 'email', 'phone', 'rollnumber', 'section', 'dob', 'gender']
      : ['firstname', 'lastname', 'email', 'phone', 'subject', 'experience'];

    const missingHeaders = requiredHeaders.filter(
      req => !headers.includes(req.toLowerCase())
    );

    return {
      valid: missingHeaders.length === 0,
      missingHeaders,
    };
  }

  /**
   * Get file size in MB
   */
  static getFileSizeMB(buffer: Buffer): number {
    return buffer.length / (1024 * 1024);
  }
}

export default BulkImportParser;
