// Bulk Import Processor - Handles batch inserts to Firestore

import { db } from '../../lib/firestore';
import { 
  ImportSessionState, 
  ImportType, 
  StudentRecord, 
  TeacherRecord,
  BulkImportResponse 
} from './types';

export class BulkImportProcessor {
  private static readonly BATCH_SIZE = 50;

  /**
   * Process validated records and insert into Firestore
   */
  static async processRecords(
    sessionId: string,
    schoolId: string,
    type: ImportType,
    records: (StudentRecord | TeacherRecord)[],
    dryRun: boolean = false
  ): Promise<ImportSessionState> {
    const session: ImportSessionState = {
      sessionId,
      schoolId,
      type,
      status: 'processing',
      totalRecords: records.length,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      dryRun,
      errors: [],
      startedAt: new Date(),
      fileName: `${type}-bulk-import-${Date.now()}.csv`,
    };

    try {
      if (dryRun) {
        // Validation only - don't write to DB
        session.status = 'completed';
        session.processedRecords = records.length;
        session.successfulRecords = records.length;
        session.completedAt = new Date();
        return session;
      }

      // Process in batches
      for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
        const batch = records.slice(i, i + this.BATCH_SIZE);
        const result = await this.processBatch(
          batch,
          schoolId,
          type,
          session
        );

        session.processedRecords += batch.length;
        session.successfulRecords += result.successful;
        session.failedRecords += result.failed;
        session.errors.push(...result.errors);
      }

      session.status = 'completed';
      session.completedAt = new Date();

    } catch (error) {
      session.status = 'failed';
      session.completedAt = new Date();
      session.errors.push({
        row: 0,
        field: 'system',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return session;
  }

  /**
   * Process a single batch of records
   */
  private static async processBatch(
    batch: (StudentRecord | TeacherRecord)[],
    schoolId: string,
    type: ImportType,
    session: ImportSessionState
  ): Promise<{ successful: number; failed: number; errors: any[] }> {
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    const writeBatch = db.batch();

    try {
      for (let i = 0; i < batch.length; i++) {
        const record = batch[i];
        const docRef = this.getDocumentRef(schoolId, type, record);

        try {
          writeBatch.set(docRef, {
            ...record,
            schoolId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          successful++;
        } catch (error) {
          failed++;
          errors.push({
            row: session.processedRecords + i + 2, // +2 for header and 0-index
            field: 'system',
            error: error instanceof Error ? error.message : 'Write failed',
          });
        }
      }

      // Commit batch
      await writeBatch.commit();
      
    } catch (error) {
      failed += batch.length;
      errors.push({
        row: 0,
        field: 'batch',
        error: error instanceof Error ? error.message : 'Batch commit failed',
      });
    }

    return { successful, failed, errors };
  }

  /**
   * Get Firestore document reference for record
   */
  private static getDocumentRef(
    schoolId: string,
    type: ImportType,
    record: StudentRecord | TeacherRecord
  ) {
    const email = 'email' in record ? record.email : '';
    
    switch (type) {
      case ImportType.STUDENTS:
        return db
          .collection('schools')
          .doc(schoolId)
          .collection('students')
          .doc(email);
      
      case ImportType.TEACHERS:
        return db
          .collection('schools')
          .doc(schoolId)
          .collection('teachers')
          .doc(email);
      
      case ImportType.CLASSES:
        const className = 'name' in record ? (record as any).name : 'unknown';
        return db
          .collection('schools')
          .doc(schoolId)
          .collection('classes')
          .doc(className);
      
      default:
        throw new Error(`Unknown import type: ${type}`);
    }
  }

  /**
   * Format session state for API response
   */
  static toApiResponse(session: ImportSessionState): BulkImportResponse {
    const timeSeconds = session.completedAt
      ? Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    return {
      sessionId: session.sessionId,
      status: session.status,
      recordsProcessed: session.processedRecords,
      recordsSuccessful: session.successfulRecords,
      recordsFailed: session.failedRecords,
      errors: session.errors,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      timeSeconds: session.completedAt ? timeSeconds : undefined,
    };
  }

  /**
   * Validate processing performance (< 30 sec for 500 records)
   */
  static validatePerformance(session: ImportSessionState): boolean {
    if (!session.completedAt) return false;
    
    const timeMs = session.completedAt.getTime() - session.startedAt.getTime();
    const timeSec = timeMs / 1000;
    
    // Target: 500 records in 30 seconds max
    const recordsPerSecond = session.successfulRecords / timeSec;
    const targetRPS = 500 / 30; // ~16.67 records/sec

    return recordsPerSecond >= targetRPS;
  }
}

export default BulkImportProcessor;
