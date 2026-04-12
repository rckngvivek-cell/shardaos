import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Server-side Analytics Service
 * Handles event logging for API calls, errors, and business events
 * Stores events in Firestore + sends to Google Analytics 4
 */

export interface AnalyticsEvent {
  event_name: string;
  timestamp: string;
  user_id?: string;
  user_role?: string;
  properties: Record<string, any>;
  context: {
    environment: string;
    version: string;
  };
}

export class AnalyticsService {
  private readonly db: Firestore;
  private readonly collectionName = 'analytics_events';
  private readonly metricsCollectionName = 'metrics';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  /**
   * Log event to Firestore for historical analysis
   * Also sends to Google Analytics via HTTP
   * @param event - Analytics event to log
   */
  async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // 1. Store in Firestore for BigQuery sync and historical analysis
      const docRef = await this.db.collection(this.collectionName).add({
        ...event,
        _stored_at: new Date().toISOString(),
        _indexed: true,
      });

      console.log(`[Analytics] Event logged: ${event.event_name} (${docRef.id})`);

      // 2. Send to Google Analytics (GA4 Measurement Protocol)
      if (process.env.GA4_ENABLED === 'true') {
        await this.sendToGA4(event).catch((err) =>
          console.warn('[Analytics] GA4 send failed:', err.message)
        );
      }

      // 3. Update real-time counters in Firestore
      await this.updateRealTimeMetrics(event).catch((err) =>
        console.warn('[Analytics] Metrics update failed:', err.message)
      );
    } catch (error) {
      console.error('[Analytics] Event logging error:', error);
      // Don't throw - analytics failures should not break API functionality
    }
  }

  /**
   * Send event to Google Analytics 4 via Measurement Protocol
   */
  private async sendToGA4(event: AnalyticsEvent): Promise<void> {
    const gaUrl = 'https://www.google-analytics.com/mp/collect';
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.warn('[Analytics] GA4 credentials not configured');
      return;
    }

    const payload = {
      measurement_id: measurementId,
      api_secret: apiSecret,
      events: [
        {
          name: event.event_name,
          params: {
            ...event.properties,
            user_id: event.user_id,
            user_role: event.user_role,
            timestamp_micros: new Date(event.timestamp).getTime() * 1000,
            session_engaged: '1',
          },
        },
      ],
    };

    // Use AbortController for timeout since fetch doesn't support timeout option
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(gaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GA4 failed with status ${response.status}`);
    }
  }

  /**
   * Update real-time metrics aggregates
   * Used for dashboard quick stats
   */
  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hourStr = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH

    // Daily metrics document
    const dailyMetricsRef = this.db
      .collection(this.metricsCollectionName)
      .doc(`daily_${dateStr}`);

    // Hourly metrics document
    const hourlyMetricsRef = this.db
      .collection(this.metricsCollectionName)
      .doc(`hourly_${hourStr}`);

    // Update daily metrics
    await dailyMetricsRef.set(
      {
        date: dateStr,
        total_events: FieldValue.increment(1),
        [event.event_name]: FieldValue.increment(1),
        unique_users: event.user_id ? [event.user_id] : [],
        last_updated: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update hourly metrics
    await hourlyMetricsRef.set(
      {
        hour: hourStr,
        total_events: FieldValue.increment(1),
        [event.event_name]: FieldValue.increment(1),
        last_updated: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  /**
   * Log API endpoint call with latency metrics
   * This is the primary event for monitoring API health
   */
  async logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number,
    userId?: string,
    userRole?: string,
    requestId?: string,
    dbQueryTimeMs?: number
  ): Promise<void> {
    await this.logEvent({
      event_name: 'api_request',
      timestamp: new Date().toISOString(),
      user_id: userId,
      user_role: userRole,
      properties: {
        endpoint,
        method,
        status_code: statusCode,
        latency_ms: latencyMs,
        request_id: requestId,
        db_query_time_ms: dbQueryTimeMs,
        is_success: statusCode >= 200 && statusCode < 300,
        is_error: statusCode >= 400,
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  /**
   * Log error event
   * Used for error tracking and alerting
   */
  async logError(
    errorType: string,
    message: string,
    endpoint?: string,
    userId?: string,
    statusCode?: number,
    stacktrace?: string
  ): Promise<void> {
    await this.logEvent({
      event_name: 'api_error',
      timestamp: new Date().toISOString(),
      user_id: userId,
      properties: {
        error_type: errorType,
        error_message: message,
        endpoint,
        status_code: statusCode,
        severity: this.getSeverity(errorType),
        stacktrace: process.env.NODE_ENV !== 'production' ? stacktrace : undefined,
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    eventType: 'login' | 'logout' | 'signup' | 'password_reset',
    userId: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    await this.logEvent({
      event_name: `user_${eventType}`,
      timestamp: new Date().toISOString(),
      user_id: userId,
      properties: {
        success,
        failure_reason: reason,
        timestamp: new Date().toISOString(),
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  /**
   * Log feature usage event
   */
  async logFeatureUsage(
    featureName: string,
    action: 'view' | 'create' | 'update' | 'delete' | 'export',
    userId: string,
    userRole: string,
    itemCount?: number,
    durationMs?: number
  ): Promise<void> {
    await this.logEvent({
      event_name: 'feature_accessed',
      timestamp: new Date().toISOString(),
      user_id: userId,
      user_role: userRole,
      properties: {
        feature_name: featureName,
        action,
        item_count: itemCount,
        duration_ms: durationMs,
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  /**
   * Log business event (school, student, attendance created)
   */
  async logBusinessEvent(
    eventType: 'school_created' | 'student_enrolled' | 'attendance_marked' | 'grade_entered',
    userId: string,
    properties: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      event_name: eventType,
      timestamp: new Date().toISOString(),
      user_id: userId,
      properties,
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  /**
   * Determine error severity level
   */
  private getSeverity(
    errorType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      validation_error: 'low',
      not_found: 'low',
      bad_request: 'low',
      auth_error: 'medium',
      forbidden: 'medium',
      timeout: 'high',
      server_error: 'high',
      database_error: 'critical',
      service_unavailable: 'critical',
    };
    return severityMap[errorType] || 'medium';
  }

  /**
   * Get real-time metrics for dashboard
   */
  async getRealTimeMetrics(hoursBack: number = 24): Promise<any> {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const snapshot = await this.db
      .collection(this.collectionName)
      .where('timestamp', '>=', cutoffTime.toISOString())
      .get();

    const events = snapshot.docs.map((doc: any) => doc.data());

    // Calculate metrics
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map((e: any) => e.user_id).filter(Boolean));
    const errorEvents = events.filter((e: any) => e.event_name === 'api_error');
    const apiRequests = events.filter((e: any) => e.event_name === 'api_request');

    const latencies = apiRequests
      .map((e: any) => e.properties?.latency_ms || 0)
      .sort((a: number, b: number) => a - b);

    return {
      total_events: totalEvents,
      unique_users: uniqueUsers.size,
      error_count: errorEvents.length,
      error_rate: totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0,
      api_requests: apiRequests.length,
      latency: {
        p50: latencies[Math.floor(latencies.length * 0.5)],
        p95: latencies[Math.floor(latencies.length * 0.95)],
        p99: latencies[Math.floor(latencies.length * 0.99)],
        mean: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
