// Bulk Import Validator

import { ParsedRecord, ValidationResult, ImportType, StudentRecord, TeacherRecord } from './types';

export class BulkImportValidator {
  /**
   * Validate parsed records for duplicates and business rules
   */
  static async validate(
    records: ParsedRecord[],
    type: ImportType,
    schoolId: string,
    existingData?: Map<string, any>
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      recordsProcessed: records.length,
      recordsValid: 0,
      recordsInvalid: 0,
      errors: [],
      duplicates: [],
    };

    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const seenRollNumbers = new Map<string, Set<string>>();

    for (const record of records) {
      if (!record.valid) {
        result.recordsInvalid++;
        if (record.errors) {
          record.errors.forEach(error => {
            result.errors.push({
              row: record.row,
              field: 'unknown',
              error,
            });
          });
        }
        continue;
      }

      const data = record.data as StudentRecord | TeacherRecord;
      const validationErrors: Array<{ field: string; error: string }> = [];

      // Check for duplicates within batch
      if ('email' in data) {
        if (seenEmails.has(data.email)) {
          result.duplicates.push({
            row: record.row,
            field: 'email',
            value: data.email,
            existingId: 'batch-duplicate',
          });
        } else {
          seenEmails.add(data.email);
        }

        // Check against existing data if provided
        if (existingData?.has(`email:${data.email}`)) {
          result.duplicates.push({
            row: record.row,
            field: 'email',
            value: data.email,
            existingId: existingData.get(`email:${data.email}`),
          });
        }
      }

      if ('phone' in data) {
        if (seenPhones.has(data.phone)) {
          validationErrors.push({
            field: 'phone',
            error: 'Phone number already exists in this batch',
          });
        } else {
          seenPhones.add(data.phone);
        }

        // Check against existing data
        if (existingData?.has(`phone:${data.phone}`)) {
          result.duplicates.push({
            row: record.row,
            field: 'phone',
            value: data.phone,
            existingId: existingData.get(`phone:${data.phone}`),
          });
        }
      }

      // Student-specific validations
      if (type === ImportType.STUDENTS && 'rollNumber' in data) {
        const student = data as StudentRecord;
        const sectionKey = student.section;
        
        if (!seenRollNumbers.has(sectionKey)) {
          seenRollNumbers.set(sectionKey, new Set());
        }

        const sectionSet = seenRollNumbers.get(sectionKey)!;
        if (sectionSet.has(student.rollNumber)) {
          validationErrors.push({
            field: 'rollNumber',
            error: `Roll number already exists in section ${sectionKey}`,
          });
        } else {
          sectionSet.add(student.rollNumber);
        }

        // Validate DOB
        const dob = new Date(student.dob);
        const now = new Date();
        const age = now.getFullYear() - dob.getFullYear();
        
        if (age < 3 || age > 25) {
          validationErrors.push({
            field: 'dob',
            error: `Age (${age}) outside valid range (3-25)`,
          });
        }
      }

      // Teacher-specific validations
      if (type === ImportType.TEACHERS && 'subject' in data) {
        const teacher = data as TeacherRecord;
        
        if (teacher.experience < 0) {
          validationErrors.push({
            field: 'experience',
            error: 'Experience cannot be negative',
          });
        }
      }

      if (validationErrors.length > 0) {
        result.recordsInvalid++;
        validationErrors.forEach(ve => {
          result.errors.push({
            row: record.row,
            field: ve.field,
            error: ve.error,
          });
        });
      } else {
        result.recordsValid++;
      }
    }

    return result;
  }

  /**
   * Check if validation passed (can proceed with import)
   */
  static canProceed(validation: ValidationResult): boolean {
    return validation.recordsInvalid === 0 && validation.duplicates.length === 0;
  }

  /**
   * Format validation result for API response
   */
  static formatValidationResponse(validation: ValidationResult) {
    return {
      recordsProcessed: validation.recordsProcessed,
      recordsValid: validation.recordsValid,
      recordsInvalid: validation.recordsInvalid,
      canProceed: this.canProceed(validation),
      errors: validation.errors,
      duplicates: validation.duplicates,
    };
  }
}

export default BulkImportValidator;
