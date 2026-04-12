/**
 * Analytics Service - BigQuery Management
 * Data Agent - Phase 1
 * 
 * Handles:
 * - Query execution and caching
 * - Sample data generation and loading
 * - Dashboard metrics aggregation
 * - Data validation
 */

import { BigQuery } from '@google-cloud/bigquery';
import { ALL_DASHBOARD_QUERIES, DashboardMetrics } from '../data/dashboard-queries';
import { ANALYTICS_SCHEMA, AnalyticsEvent, MetricsDaily, NPSResponse, RevenueTransaction } from '../data/bigquery-schema';

export class AnalyticsService {
  private bigquery: BigQuery;
  private datasetId = 'school_erp_analytics';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 3600000; // 1 hour

  constructor(projectId?: string) {
    this.bigquery = new BigQuery({
      projectId: projectId || process.env.GCP_PROJECT_ID,
    });
  }

  /**
   * Initialize BigQuery dataset and tables
   */
  async initialize(): Promise<void> {
    console.log('Initializing BigQuery dataset...');

    try {
      // Create dataset
      const dataset = this.bigquery.dataset(this.datasetId);
      const [exists] = await dataset.exists();

      if (!exists) {
        console.log(`Creating dataset: ${this.datasetId}`);
        await this.bigquery.createDataset(this.datasetId, {
          location: 'US',
          description: 'School ERP Analytics data warehouse',
        });
      }

      // Create tables
      for (const [key, schema] of Object.entries(ANALYTICS_SCHEMA)) {
        console.log(`Checking table: ${schema.name}`);
        const table = dataset.table(schema.name);
        const [tableExists] = await table.exists();

        if (!tableExists) {
          console.log(`Creating table: ${schema.name}`);
          const bigQuerySchema = schema.fields.map((field) => ({
            name: field.name,
            type: field.type,
            mode: field.mode || 'NULLABLE',
            description: field.description,
          }));

          await dataset.createTable(schema.name, {
            schema: bigQuerySchema,
            description: `Analytics table: ${schema.name}`,
          });
        }
      }

      console.log('✅ BigQuery initialization complete');
    } catch (error) {
      console.error('BigQuery initialization error:', error);
      throw error;
    }
  }

  /**
   * Execute dashboard query with caching
   */
  async executeDashboardQuery(
    queryKey: keyof typeof ALL_DASHBOARD_QUERIES
  ): Promise<any[]> {
    const config = ALL_DASHBOARD_QUERIES[queryKey];
    const cacheKey = config.cacheKey;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < config.refreshInterval * 1000) {
      console.log(`Cache hit: ${cacheKey}`);
      return cached.data;
    }

    try {
      console.log(`Executing query: ${config.name}`);
      const [rows] = await this.bigquery.query({
        query: config.query,
        location: 'US',
        useQueryCache: true,
      });

      // Cache result
      this.cache.set(cacheKey, { data: rows, timestamp: Date.now() });

      return rows;
    } catch (error) {
      console.error(`Query error [${queryKey}]:`, error);
      throw error;
    }
  }

  /**
   * Get all dashboard metrics
   */
  async getAllDashboardMetrics(): Promise<DashboardMetrics> {
    console.log('Fetching all dashboard metrics...');

    const [activeUsers, reports, revenue, errors] = await Promise.all([
      this.executeDashboardQuery('activeUsers'),
      this.executeDashboardQuery('reportsGenerated'),
      this.executeDashboardQuery('revenueTrend'),
      this.executeDashboardQuery('errorRate'),
    ]);

    return {
      activeUsers,
      reportsGenerated: reports,
      revenueTrend: revenue,
      errorRate: errors,
    };
  }

  /**
   * Load sample data for testing
   */
  async loadSampleData(): Promise<{ eventsLoaded: number; metricsLoaded: number }> {
    console.log('Loading sample data for testing...');

    const dataset = this.bigquery.dataset(this.datasetId);

    // Sample events (last 30 days)
    const events: AnalyticsEvent[] = [];
    const schools = ['school_001', 'school_002', 'school_003'];
    const users = [
      'user_001',
      'user_002',
      'user_003',
      'user_004',
      'user_005',
    ];
    const eventTypes = [
      'user_login',
      'dashboard_viewed',
      'report_generated',
      'api_call',
      'payment_completed',
    ];

    // Generate 1000 sample events
    const now = Date.now();
    for (let i = 0; i < 1000; i++) {
      const timestamp = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
      events.push({
        timestamp,
        event_type:
          eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
        school_id: schools[Math.floor(Math.random() * schools.length)],
        user_id: users[Math.floor(Math.random() * users.length)],
        data: {
          session_id: `session_${i}`,
          duration_ms: Math.floor(Math.random() * 10000),
          device: Math.random() > 0.5 ? 'mobile' : 'desktop',
        },
      });
    }

    try {
      // Insert events
      const eventsTable = dataset.table('events');
      const insertResult = await eventsTable.insert(
        events.map((e) => ({
          timestamp: e.timestamp,
          event_type: e.event_type,
          school_id: e.school_id,
          user_id: e.user_id,
          data: JSON.stringify(e.data),
        })),
        { skipInvalidRows: true }
      );

      console.log(`✅ Inserted ${events.length} sample events`);

      // Generate metrics
      const metrics: MetricsDaily[] = [];
      for (const school of schools) {
        const today = new Date();
        metrics.push({
          date: today.toISOString().split('T')[0],
          school_id: school,
          active_users: Math.floor(Math.random() * 100) + 10,
          reports_generated: Math.floor(Math.random() * 50),
          errors_count: Math.floor(Math.random() * 10),
          api_calls: Math.floor(Math.random() * 1000) + 100,
        });
      }

      const metricsTable = dataset.table('metrics_daily');
      await metricsTable.insert(metrics, { skipInvalidRows: true });

      console.log(`✅ Inserted ${metrics.length} sample metrics`);

      return { eventsLoaded: events.length, metricsLoaded: metrics.length };
    } catch (error) {
      console.error('Sample data loading error:', error);
      throw error;
    }
  }

  /**
   * Verify BigQuery connectivity and query capability
   */
  async verify(): Promise<{ healthy: boolean; eventCount: number; timestamp: string }> {
    try {
      const [rows] = await this.bigquery.query({
        query:
          'SELECT COUNT(*) as event_count FROM `school_erp_analytics.events` LIMIT 1',
        location: 'US',
      });

      const eventCount = rows[0]?.event_count || 0;

      return {
        healthy: true,
        eventCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('BigQuery verification failed:', error);
      return {
        healthy: false,
        eventCount: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Record an analytics event to BigQuery
   */
  async recordEvent(event: AnalyticsEvent): Promise<void> {
    const dataset = this.bigquery.dataset(this.datasetId);
    const table = dataset.table('events');

    try {
      await table.insert(
        {
          timestamp: event.timestamp,
          event_type: event.event_type,
          school_id: event.school_id,
          user_id: event.user_id,
          data: event.data ? JSON.stringify(event.data) : null,
        },
        { skipInvalidRows: true }
      );
    } catch (error) {
      console.error('Error recording event:', error);
      // Don't throw - analytics should not block main operations
    }
  }

  /**
   * Batch insert NPS responses
   */
  async recordNPSResponses(responses: NPSResponse[]): Promise<number> {
    const dataset = this.bigquery.dataset(this.datasetId);
    const table = dataset.table('nps_responses');

    try {
      const rows = responses.map((r) => ({
        timestamp: r.timestamp,
        school_id: r.school_id,
        response_value: r.response_value,
        feedback_text: r.feedback_text || null,
        user_id: r.user_id || null,
      }));

      const [insertResult] = await table.insert(rows, {
        skipInvalidRows: true,
      });

      console.log(`Inserted ${rows.length} NPS responses`);
      return rows.length;
    } catch (error) {
      console.error('Error recording NPS responses:', error);
      return 0;
    }
  }

  /**
   * Record revenue transactions
   */
  async recordRevenueTransaction(transaction: RevenueTransaction): Promise<void> {
    const dataset = this.bigquery.dataset(this.datasetId);
    const table = dataset.table('revenue_transactions');

    try {
      await table.insert(
        {
          date: transaction.date,
          school_id: transaction.school_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          status: transaction.status,
          invoice_id: transaction.invoice_id || null,
        },
        { skipInvalidRows: true }
      );
    } catch (error) {
      console.error('Error recording revenue transaction:', error);
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

// Export singleton
export const analyticsService = new AnalyticsService();
