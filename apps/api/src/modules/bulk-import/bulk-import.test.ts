// Bulk Import Tests

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import BulkImportParser from '../parser';
import BulkImportValidator from '../validator';
import BulkImportProcessor from '../processor';
import { ImportType, StudentRecord, ParsedRecord } from '../types';

describe('BulkImportParser', () => {
  const validStudentCSV = `firstName,lastName,email,phone,rollNumber,section,dob,gender
John,Doe,john@school.edu,9876543210,101,A,2010-01-15,M
Jane,Smith,jane@school.edu,9876543211,102,A,2009-06-20,F`;

  test('should parse valid student CSV', async () => {
    const records = await BulkImportParser.parseCSV(validStudentCSV, ImportType.STUDENTS);
    
    expect(records).toHaveLength(2);
    expect(records[0].valid).toBe(true);
    expect(records[0].data).toHaveProperty('email', 'john@school.edu');
  });

  test('should detect invalid email format', async () => {
    const invalidCSV = `firstName,lastName,email,phone,rollNumber,section,dob,gender
John,Doe,invalid-email,9876543210,101,A,2010-01-15,M`;

    const records = await BulkImportParser.parseCSV(invalidCSV, ImportType.STUDENTS);
    
    expect(records[0].valid).toBe(false);
    expect(records[0].errors).toBeDefined();
  });

  test('should detect invalid phone format', async () => {
    const invalidCSV = `firstName,lastName,email,phone,rollNumber,section,dob,gender
John,Doe,john@school.edu,123,101,A,2010-01-15,M`;

    const records = await BulkImportParser.parseCSV(invalidCSV, ImportType.STUDENTS);
    
    expect(records[0].valid).toBe(false);
  });

  test('should trim whitespace from fields', async () => {
    const csvWithWhitespace = `firstName,lastName,email,phone,rollNumber,section,dob,gender
  John  ,  Doe  ,john@school.edu,9876543210,101,A,2010-01-15,M`;

    const records = await BulkImportParser.parseCSV(csvWithWhitespace, ImportType.STUDENTS);
    
    expect(records[0].valid).toBe(true);
    expect(records[0].data.firstName).toBe('John');
  });

  test('should validate required headers', () => {
    const invalidHeaders = `name,age\nJohn,25`;
    
    const validation = BulkImportParser.validateHeaders(
      invalidHeaders,
      ImportType.STUDENTS
    );

    expect(validation.valid).toBe(false);
    expect(validation.missingHeaders.length).toBeGreaterThan(0);
  });

  test('should calculate file size correctly', () => {
    const buffer = Buffer.from('test data');
    const sizeMB = BulkImportParser.getFileSizeMB(buffer);
    
    expect(sizeMB).toBeCloseTo(0, 5);
  });
});

describe('BulkImportValidator', () => {
  const validRecords: ParsedRecord[] = [
    {
      row: 2,
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@school.edu',
        phone: '9876543210',
        rollNumber: '101',
        section: 'A',
        dob: '2010-01-15',
        gender: 'M',
      } as StudentRecord,
      valid: true,
    },
  ];

  test('should validate correct records', async () => {
    const result = await BulkImportValidator.validate(
      validRecords,
      ImportType.STUDENTS,
      'school1'
    );

    expect(result.recordsValid).toBe(1);
    expect(result.recordsInvalid).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect duplicate emails within batch', async () => {
    const duplicateRecords: ParsedRecord[] = [
      {
        row: 2,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@school.edu',
          phone: '9876543210',
          rollNumber: '101',
          section: 'A',
          dob: '2010-01-15',
          gender: 'M',
        } as StudentRecord,
        valid: true,
      },
      {
        row: 3,
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'john@school.edu', // Same email
          phone: '9876543211',
          rollNumber: '102',
          section: 'A',
          dob: '2009-06-20',
          gender: 'F',
        } as StudentRecord,
        valid: true,
      },
    ];

    const result = await BulkImportValidator.validate(
      duplicateRecords,
      ImportType.STUDENTS,
      'school1'
    );

    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  test('should detect invalid age', async () => {
    const invalidAgeRecords: ParsedRecord[] = [
      {
        row: 2,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@school.edu',
          phone: '9876543210',
          rollNumber: '101',
          section: 'A',
          dob: '1990-01-15', // Age ~36
          gender: 'M',
        } as StudentRecord,
        valid: true,
      },
    ];

    const result = await BulkImportValidator.validate(
      invalidAgeRecords,
      ImportType.STUDENTS,
      'school1'
    );

    expect(result.recordsInvalid).toBeGreaterThan(0);
  });

  test('should detect duplicate roll numbers in same section', async () => {
    const duplicateRollRecords: ParsedRecord[] = [
      {
        row: 2,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@school.edu',
          phone: '9876543210',
          rollNumber: '101',
          section: 'A',
          dob: '2010-01-15',
          gender: 'M',
        } as StudentRecord,
        valid: true,
      },
      {
        row: 3,
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@school.edu',
          phone: '9876543211',
          rollNumber: '101', // Same roll in same section
          section: 'A',
          dob: '2009-06-20',
          gender: 'F',
        } as StudentRecord,
        valid: true,
      },
    ];

    const result = await BulkImportValidator.validate(
      duplicateRollRecords,
      ImportType.STUDENTS,
      'school1'
    );

    expect(result.recordsInvalid).toBeGreaterThan(0);
  });

  test('should allow duplicate roll numbers in different sections', async () => {
    const differentSectionRecords: ParsedRecord[] = [
      {
        row: 2,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@school.edu',
          phone: '9876543210',
          rollNumber: '101',
          section: 'A',
          dob: '2010-01-15',
          gender: 'M',
        } as StudentRecord,
        valid: true,
      },
      {
        row: 3,
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@school.edu',
          phone: '9876543211',
          rollNumber: '101', // Same roll but different section
          section: 'B',
          dob: '2009-06-20',
          gender: 'F',
        } as StudentRecord,
        valid: true,
      },
    ];

    const result = await BulkImportValidator.validate(
      differentSectionRecords,
      ImportType.STUDENTS,
      'school1'
    );

    expect(result.recordsValid).toBe(2);
  });

  test('should determine if can proceed', async () => {
    const result = await BulkImportValidator.validate(
      validRecords,
      ImportType.STUDENTS,
      'school1'
    );

    expect(BulkImportValidator.canProceed(result)).toBe(true);
  });
});

describe('BulkImportProcessor', () => {
  test('should format session response correctly', () => {
    const session = {
      sessionId: 'session-123',
      schoolId: 'school-1',
      type: ImportType.STUDENTS,
      status: 'completed' as const,
      totalRecords: 100,
      processedRecords: 100,
      successfulRecords: 95,
      failedRecords: 5,
      dryRun: false,
      errors: [],
      startedAt: new Date('2026-04-14T10:00:00Z'),
      completedAt: new Date('2026-04-14T10:00:28Z'),
      fileName: 'students-bulk-import-1713092400000.csv',
    };

    const response = BulkImportProcessor.toApiResponse(session);

    expect(response.sessionId).toBe('session-123');
    expect(response.recordsProcessed).toBe(100);
    expect(response.recordsSuccessful).toBe(95);
    expect(response.timeSeconds).toBe(28);
  });

  test('should validate performance met for 500 records in 30 seconds', () => {
    const session = {
      sessionId: 'session-123',
      schoolId: 'school-1',
      type: ImportType.STUDENTS,
      status: 'completed' as const,
      totalRecords: 500,
      processedRecords: 500,
      successfulRecords: 500,
      failedRecords: 0,
      dryRun: false,
      errors: [],
      startedAt: new Date(Date.now() - 30000),
      completedAt: new Date(),
      fileName: 'test.csv',
    };

    const performanceMet = BulkImportProcessor.validatePerformance(session);
    expect(performanceMet).toBe(true);
  });
});

describe('BulkImportIntegration', () => {
  test('complete workflow: parse -> validate -> format', async () => {
    const csv = `firstName,lastName,email,phone,rollNumber,section,dob,gender
John,Doe,john@school.edu,9876543210,101,A,2010-01-15,M
Jane,Smith,jane@school.edu,9876543211,102,A,2009-06-20,F`;

    // Parse
    const parsed = await BulkImportParser.parseCSV(csv, ImportType.STUDENTS);
    expect(parsed.length).toBe(2);

    // Validate
    const validation = await BulkImportValidator.validate(
      parsed,
      ImportType.STUDENTS,
      'school1'
    );
    expect(validation.recordsValid).toBe(2);

    // Check can proceed
    const canProceed = BulkImportValidator.canProceed(validation);
    expect(canProceed).toBe(true);
  });
});
