/**
 * Firestore → BigQuery Real-Time Sync Function
 * Data Agent - Phase 1 Pipeline
 * 
 * Cloud Function that listens to Firestore document changes
 * and syncs them to BigQuery in real-time.
 * 
 * Deploy with:
 * gcloud functions deploy syncFirestoreToBQ \
 *   --runtime nodejs20 \
 *   --trigger-topic firestore-export-topic \
 *   --entry-point syncFirestoreToBQ
 */

import * as functions from 'firebase-functions';
import { BigQuery } from '@google-cloud/bigquery';
import * as admin from 'firebase-admin';

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

const DATASET_ID = 'school_erp_analytics';
const BATCH_SIZE = 1000; // Insert 1000 rows at a time

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Maps Firestore collection → BigQuery table with transformation
 */
const COLLECTION_MAPPING: Record<
  string,
  {
    table: string;
    transform: (doc: any) => Record<string, any>;
  }
> = {
  'schools/{schoolId}/analytics/events': {
    table: 'events',
    transform: (doc) => ({
      timestamp: new Date(doc.timestamp || Date.now()),
      event_type: doc.event_type,
      school_id: doc.school_id,
      user_id: doc.user_id,
      data: doc.data ? JSON.stringify(doc.data) : null,
    }),
  },

  'schools/{schoolId}/analytics/metrics_daily': {
    table: 'metrics_daily',
    transform: (doc) => ({
      date: doc.date,
      school_id: doc.school_id,
      active_users: doc.active_users || 0,
      reports_generated: doc.reports_generated || 0,
      errors_count: doc.errors_count || 0,
      api_calls: doc.api_calls || 0,
    }),
  },

  'schools/{schoolId}/analytics/nps_responses': {
    table: 'nps_responses',
    transform: (doc) => ({
      timestamp: new Date(doc.timestamp || Date.now()),
      school_id: doc.school_id,
      response_value: doc.response_value,
      feedback_text: doc.feedback_text || null,
      user_id: doc.user_id || null,
    }),
  },

  'schools/{schoolId}/analytics/revenue': {
    table: 'revenue_transactions',
    transform: (doc) => ({
      date: doc.date,
      school_id: doc.school_id,
      amount: parseFloat(doc.amount || 0),
      transaction_type: doc.transaction_type,
      status: doc.status,
      invoice_id: doc.invoice_id || null,
    }),
  },
};

/**
 * Main Cloud Function: Sync events to BigQuery
 * Triggered by Pub/Sub topic from Firestore export
 */
export const syncFirestoreToBQ = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB',
  })
  .pubsub.topic('firestore-export-topic')
  .onPublish(async (message) => {
    try {
      const docPayload = JSON.parse(
        Buffer.from(message.data, 'base64').toString()
      );

      console.log('Processing Firestore document:', {
        name: docPayload.name,
        operation: docPayload.updateMask?.fieldPaths || 'CREATE',
      });

      // Determine table from document path
      const path = docPayload.name;
      let table = null;
      let transform = null;

      for (const [pattern, mapping] of Object.entries(COLLECTION_MAPPING)) {
        if (path.includes(pattern.replace('/{schoolId}', ''))) {
          table = mapping.table;
          transform = mapping.transform;
          break;
        }
      }

      if (!table || !transform) {
        console.log(`No mapping found for: ${path}`);
        return;
      }

      // Transform and insert
      const dataset = bigquery.dataset(DATASET_ID);
      const tableRef = dataset.table(table);

      const transformed = transform(docPayload.fields);
      console.log(`Inserting into ${table}:`, transformed);

      await tableRef.insert(transformed, {
        skipInvalidRows: true,
        ignoreUnknownValues: true,
      });

      console.log(`✅ Successfully inserted into ${table}`);
    } catch (error) {
      console.error('Error syncing to BigQuery:', error);
      // Re-throw to trigger dead-letter queue if configured
      throw error;
    }
  });

/**
 * HTTP-triggered function for on-demand sync
 * POST /sync-firestore-to-bq with Firestore collection path
 */
export const syncFirestoreToBQHTTP = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB',
  })
  .https.onRequest(async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(400).send('POST only');
      }

      const { collectionPath, limit = 100 } = req.body;

      if (!collectionPath) {
        return res.status(400).send('collectionPath required');
      }

      console.log(`Manual sync requested for: ${collectionPath}`);

      const db = admin.firestore();
      let query = db.collectionGroup(collectionPath.split('/').pop());

      if (collectionPath.includes('/')) {
        query = db.collection(collectionPath);
      }

      const snapshot = await query.limit(limit).get();

      let successCount = 0;
      const errors: string[] = [];

      const dataset = bigquery.dataset(DATASET_ID);
      const rows: Record<string, any>[] = [];

      snapshot.forEach((doc) => {
        const pattern = Object.keys(COLLECTION_MAPPING).find((p) =>
          collectionPath.includes(p.split('/').pop()!)
        );

        if (pattern) {
          const mapping = COLLECTION_MAPPING[pattern];
          const transformed = mapping.transform(doc.data());
          rows.push(transformed);
        }
      });

      // Batch insert
      if (rows.length > 0) {
        const pattern = Object.keys(COLLECTION_MAPPING).find((p) =>
          collectionPath.includes(p.split('/').pop()!)
        );
        const table =
          pattern && COLLECTION_MAPPING[pattern]
            ? COLLECTION_MAPPING[pattern].table
            : null;

        if (table) {
          const tableRef = dataset.table(table);
          await tableRef.insert(rows, {
            skipInvalidRows: true,
            ignoreUnknownValues: true,
          });
          successCount = rows.length;
        }
      }

      res.json({
        success: true,
        synced: successCount,
        errors,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

/**
 * Scheduled function: Daily aggregation
 * Runs at 1 AM UTC daily to aggregate metrics
 */
export const aggregateMetricsDaily = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
  })
  .pubsub.schedule('0 1 * * *') // 1 AM UTC daily
  .onRun(async (context) => {
    try {
      console.log('Starting daily metrics aggregation...');

      const client = bigquery;
      const query = `
        INSERT INTO school_erp_analytics.metrics_daily
        SELECT 
          DATE(timestamp) as date,
          school_id,
          COUNT(DISTINCT user_id) as active_users,
          SUM(IF(event_type = 'report_generated', 1, 0)) as reports_generated,
          SUM(IF(event_type LIKE '%error%', 1, 0)) as errors_count,
          COUNT(*) as api_calls
        FROM school_erp_analytics.events
        WHERE DATE(timestamp) = CURRENT_DATE() - 1
        GROUP BY date, school_id;
      `;

      const options = {
        query: query,
        location: 'US',
      };

      const [job] = await client.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      console.log(`✅ Daily aggregation complete: ${rows?.length || 0} rows`);
    } catch (error) {
      console.error('Aggregation error:', error);
      throw error;
    }
  });
