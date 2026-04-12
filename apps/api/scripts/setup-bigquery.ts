/**
 * BigQuery Schema Setup for Exam Module Data Pipeline
 * 
 * Creates the necessary BigQuery tables for exam events:
 * - exams_log: All exam creation events
 * - submissions_log: All exam submission events 
 * - results_log: All exam grading/result events
 * 
 * Usage:
 *   npx ts-node scripts/setup-bigquery.ts
 */

import { BigQuery } from '@google-cloud/bigquery';

const bigQuery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID || 'school-erp-dev',
});

const DATASET_ID = 'school_erp';

// Exam Log Table Schema
const examsLogSchema = [
  { name: 'examId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'schoolId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'title', type: 'STRING', mode: 'REQUIRED' },
  { name: 'subject', type: 'STRING', mode: 'NULLABLE' },
  { name: 'totalMarks', type: 'INT64', mode: 'REQUIRED' },
  { name: 'createdAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'status', type: 'STRING', mode: 'REQUIRED' },
  { name: '_event_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: '_created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
];

// Submissions Log Table Schema
const submissionsLogSchema = [
  { name: 'submissionId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'examId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'schoolId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'studentId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'submittedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'answerCount', type: 'INT64', mode: 'NULLABLE' },
  { name: 'status', type: 'STRING', mode: 'REQUIRED' },
  { name: '_event_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: '_created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
];

// Results Log Table Schema
const resultsLogSchema = [
  { name: 'resultId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'examId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'schoolId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'studentId', type: 'STRING', mode: 'REQUIRED' },
  { name: 'score', type: 'FLOAT64', mode: 'REQUIRED' },
  { name: 'totalMarks', type: 'FLOAT64', mode: 'REQUIRED' },
  { name: 'percentage', type: 'FLOAT64', mode: 'REQUIRED' },
  { name: 'grade', type: 'STRING', mode: 'REQUIRED' },
  { name: 'gradedAt', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'status', type: 'STRING', mode: 'REQUIRED' },
  { name: '_event_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: '_created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
];

async function createDataset(): Promise<void> {
  try {
    console.log(`[BigQuery] Checking if dataset ${DATASET_ID} exists...`);
    
    const dataset = bigQuery.dataset(DATASET_ID);
    const [exists] = await dataset.exists();

    if (!exists) {
      console.log(`[BigQuery] Creating dataset ${DATASET_ID}...`);
      const [newDataset] = await bigQuery.createDataset(DATASET_ID, {
        location: 'asia-south1',
        description: 'School ERP analytics dataset for exam module',
        labels: {
          environment: 'production',
          module: 'exam',
          source: 'data-pipeline',
        },
      });
      console.log(`✓ Dataset created: ${DATASET_ID}`);
    } else {
      console.log(`✓ Dataset already exists: ${DATASET_ID}`);
    }
  } catch (error) {
    console.error('[BigQuery] Error creating dataset:', error);
    throw error;
  }
}

async function createTable(
  tableId: string,
  schema: any[],
  description: string,
): Promise<void> {
  try {
    const dataset = bigQuery.dataset(DATASET_ID);
    const table = dataset.table(tableId);
    const [exists] = await table.exists();

    if (!exists) {
      console.log(`[BigQuery] Creating table ${tableId}...`);
      
      const options = {
        schema,
        description,
        location: 'asia-south1',
        partitioningField: '_created_at',
        timePartitioning: {
          type: 'DAY' as any,
          field: '_created_at',
          expirationMs: 7776000000, // 90 days retention
        },
        clustering: {
          fields: ['schoolId', 'examId'],
        },
        labels: {
          module: 'exam',
          data_type: 'log',
        },
      };

      const [createdTable] = await dataset.createTable(tableId, options);
      console.log(`✓ Table created: ${DATASET_ID}.${tableId}`);
    } else {
      console.log(`✓ Table already exists: ${DATASET_ID}.${tableId}`);
    }
  } catch (error) {
    console.error(`[BigQuery] Error creating table ${tableId}:`, error);
    throw error;
  }
}

async function setupBigQuery(): Promise<void> {
  try {
    console.log('🔧 Starting BigQuery setup for exam module...\n');

    // Create dataset
    await createDataset();
    console.log();

    // Create tables
    await createTable(
      'exams_log',
      examsLogSchema,
      'Log of all exam creation events'
    );
    
    await createTable(
      'submissions_log',
      submissionsLogSchema,
      'Log of all exam submission events'
    );
    
    await createTable(
      'results_log',
      resultsLogSchema,
      'Log of all exam grading/result events'
    );

    console.log('\n✅ BigQuery setup completed successfully!');
    console.log(`\nDataset: ${DATASET_ID}`);
    console.log('Tables created:');
    console.log(`  - ${DATASET_ID}.exams_log`);
    console.log(`  - ${DATASET_ID}.submissions_log`);
    console.log(`  - ${DATASET_ID}.results_log`);
  } catch (error) {
    console.error('\n❌ BigQuery setup failed:', error);
    process.exit(1);
  }
}

// Run setup if executed directly
if (require.main === module) {
  setupBigQuery();
}

export { setupBigQuery, createDataset, createTable };
