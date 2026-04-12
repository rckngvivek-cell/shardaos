/**
 * BigQuery Analytics Integration Service
 * Syncs Firestore data to BigQuery and provides analytics queries
 * 
 * Module: apps/api/src/modules/analytics/bigquerySync.ts
 */

import { BigQuery } from "@google-cloud/bigquery";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "../../utils/logger";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

const db = getFirestore();
const DATASET_NAME = "school_erp_analytics";
const BATCH_SIZE = 1000;

/**
 * Initialize BigQuery dataset and tables on startup
 */
export const initializeBigQueryDataset = async () => {
  try {
    const dataset = bigquery.dataset(DATASET_NAME);
    const exists = await dataset.exists();

    if (!exists[0]) {
      logger.info("Creating BigQuery dataset:", { datasetName: DATASET_NAME });
      await bigquery.createDataset(DATASET_NAME, {
        location: "US",
        description: "School ERP Analytics Data Warehouse",
        labels: {
          source: "firestore",
          app: "school-erp",
        },
      });
    }

    // Create tables if not exist
    await createTablesIfNotExist();
    logger.info("BigQuery dataset initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize BigQuery:", error);
    throw error;
  }
};

/**
 * Sync Firestore collections to BigQuery
 * Called nightly via Cloud Scheduler
 */
export const syncFirestoreToBigQuery = async (schoolId: string) => {
  try {
    logger.info(`Starting BigQuery sync for school: ${schoolId}`);

    // Sync all collections
    await syncCollection(schoolId, "schools", "students");
    await syncCollection(schoolId, "schools", "attendance");
    await syncCollection(schoolId, "schools", "grades");
    await syncCollection(schoolId, "schools", "fees");
    await syncCollection(schoolId, "schools", "teachers");

    logger.info(`BigQuery sync completed for school: ${schoolId}`);
  } catch (error) {
    logger.error("BigQuery sync failed:", error);
    throw error;
  }
};

/**
 * Sync a specific Firestore collection to BigQuery table
 */
async function syncCollection(
  schoolId: string,
  collectionPath: string,
  tableName: string
) {
  const query = db
    .collection(collectionPath)
    .doc(schoolId)
    .collection(tableName);

  let lastDoc = null;
  let totalRows = 0;

  // Process in batches
  while (true) {
    let batch = query.limit(BATCH_SIZE);

    if (lastDoc) {
      batch = batch.startAfter(lastDoc);
    }

    const snapshot = await batch.get();

    if (snapshot.empty) break;

    const rows = snapshot.docs.map((doc) => ({
      ...doc.data(),
      _id: doc.id,
      school_id: schoolId,
      _exported_at: new Date(),
    }));

    // Insert into BigQuery
    const dataset = bigquery.dataset(DATASET_NAME);
    const table = dataset.table(tableName);

    try {
      await table.insert(rows, { skipInvalidRows: true });
      totalRows += rows.length;
      logger.info(
        `Inserted ${rows.length} rows into ${tableName} table (Total: ${totalRows})`
      );
    } catch (error) {
      logger.error(`Error inserting into ${tableName}:`, error);
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  logger.info(
    `Sync complete for ${tableName}: ${totalRows} total rows processed`
  );
}

/**
 * Create BigQuery tables if they don't exist
 */
async function createTablesIfNotExist() {
  const dataset = bigquery.dataset(DATASET_NAME);

  // Table schemas
  const tables = {
    students: [
      { name: "school_id", type: "STRING", mode: "REQUIRED" },
      { name: "student_id", type: "STRING", mode: "REQUIRED" },
      { name: "name", type: "STRING", mode: "NULLABLE" },
      { name: "email", type: "STRING", mode: "NULLABLE" },
      { name: "section", type: "STRING", mode: "NULLABLE" },
      { name: "roll_number", type: "INTEGER", mode: "NULLABLE" },
      { name: "enrollment_date", type: "DATE", mode: "NULLABLE" },
      { name: "status", type: "STRING", mode: "NULLABLE" },
      { name: "_exported_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    attendance: [
      { name: "school_id", type: "STRING", mode: "REQUIRED" },
      { name: "attendance_id", type: "STRING", mode: "REQUIRED" },
      { name: "student_id", type: "STRING", mode: "NULLABLE" },
      { name: "date", type: "DATE", mode: "NULLABLE" },
      { name: "status", type: "STRING", mode: "NULLABLE" },
      { name: "marked_by", type: "STRING", mode: "NULLABLE" },
      { name: "_exported_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    grades: [
      { name: "school_id", type: "STRING", mode: "REQUIRED" },
      { name: "grade_id", type: "STRING", mode: "REQUIRED" },
      { name: "student_id", type: "STRING", mode: "NULLABLE" },
      { name: "subject", type: "STRING", mode: "NULLABLE" },
      { name: "marks", type: "FLOAT", mode: "NULLABLE" },
      { name: "term", type: "STRING", mode: "NULLABLE" },
      { name: "graded_at", type: "TIMESTAMP", mode: "NULLABLE" },
      { name: "_exported_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    fees: [
      { name: "school_id", type: "STRING", mode: "REQUIRED" },
      { name: "fee_id", type: "STRING", mode: "REQUIRED" },
      { name: "student_id", type: "STRING", mode: "NULLABLE" },
      { name: "amount", type: "FLOAT", mode: "NULLABLE" },
      { name: "due_date", type: "DATE", mode: "NULLABLE" },
      { name: "paid_date", type: "DATE", mode: "NULLABLE" },
      { name: "status", type: "STRING", mode: "NULLABLE" },
      { name: "_exported_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    events: [
      { name: "school_id", type: "STRING", mode: "REQUIRED" },
      { name: "event_id", type: "STRING", mode: "REQUIRED" },
      { name: "event_name", type: "STRING", mode: "NULLABLE" },
      { name: "user_id", type: "STRING", mode: "NULLABLE" },
      { name: "timestamp", type: "TIMESTAMP", mode: "NULLABLE" },
      { name: "properties", type: "JSON", mode: "NULLABLE" },
      { name: "_stored_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
    nps_responses: [
      { name: "school_id", type: "STRING", mode: "REQUIRED" },
      { name: "response_id", type: "STRING", mode: "REQUIRED" },
      { name: "parent_id", type: "STRING", mode: "NULLABLE" },
      { name: "student_id", type: "STRING", mode: "NULLABLE" },
      { name: "score", type: "INTEGER", mode: "NULLABLE" },
      { name: "feedback", type: "STRING", mode: "NULLABLE" },
      { name: "context", type: "STRING", mode: "NULLABLE" },
      { name: "response_date", type: "DATE", mode: "NULLABLE" },
      { name: "_exported_at", type: "TIMESTAMP", mode: "NULLABLE" },
    ],
  };

  for (const [tableName, schema] of Object.entries(tables)) {
    try {
      const table = dataset.table(tableName);
      const exists = await table.exists();

      if (!exists[0]) {
        logger.info(`Creating table: ${tableName}`);
        await dataset.createTable(tableName, { schema });
      }
    } catch (error) {
      logger.error(`Failed to create table ${tableName}:`, error);
    }
  }
}

/**
 * Execute analytics query and return results
 */
export const queryBigQuery = async (
  query: string,
  params?: Record<string, any>
) => {
  try {
    const options: any = {
      query,
      location: "US",
      useLegacySql: false,
    };

    if (params) {
      options.params = params;
    }

    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    logger.error("BigQuery query failed:", error);
    throw error;
  }
};

/**
 * Execute analytics query with caching
 */
const queryCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export const queryBigQueryCached = async (
  query: string,
  cacheKey: string,
  params?: Record<string, any>
) => {
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.info(`Cache hit for: ${cacheKey}`);
    return cached.data;
  }

  const data = await queryBigQuery(query, params);
  queryCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

export default {
  initializeBigQueryDataset,
  syncFirestoreToBigQuery,
  queryBigQuery,
  queryBigQueryCached,
};
