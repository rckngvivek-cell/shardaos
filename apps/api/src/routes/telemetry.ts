import express, { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics';
import {
  validateTelemetryEvents,
  TelemetryEvent,
} from '../types/telemetry';

/**
 * Telemetry Routes
 * Endpoints for client-side event submission
 */

export function createTelemetryRouter(analyticsService: AnalyticsService): Router {
  const router = express.Router();

  /**
   * POST /api/v1/telemetry
   * Accept batch of telemetry events from client
   *
   * Request body:
   * {
   *   events: [
   *     {
   *       event_name: "page_view",
   *       timestamp: "2026-05-06T10:30:00Z",
   *       user_id: "user123",
   *       session_id: "session123",
   *       properties: { page_path: "/students" },
   *       context: { device_type: "desktop", ... }
   *     },
   *     ...
   *   ]
   * }
   *
   * Response: { success: true, events_processed: 10 }
   */
  router.post('/telemetry', async (req: Request, res: Response) => {
    try {
      const { events } = req.body;

      // Validate incoming events
      const validation = validateTelemetryEvents(events);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      const validatedEvents = validation.data || [];
      const processedEvents: string[] = [];

      // Process each event
      for (const event of validatedEvents) {
        try {
          // Enrich event with request context
          const enrichedEvent: TelemetryEvent = {
            ...event,
            context: {
              ...event.context,
              user_agent: req.get('user-agent') || 'unknown',
              ip_address: getClientIp(req),
            },
          };

          // Log the event
          await analyticsService.logEvent(enrichedEvent);
          processedEvents.push(event.event_name);
        } catch (error) {
          console.error('[Telemetry] Failed to process event:', error);
          // Continue processing other events
        }
      }

      // Return success response
      return res.status(200).json({
        success: true,
        events_processed: processedEvents.length,
        events: processedEvents,
      });
    } catch (error: any) {
      console.error('[Telemetry] Request error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/v1/telemetry/dashboard-stats
   * Get real-time dashboard statistics
   * Used for analytics dashboard
   *
   * Query params:
   * ?hours_back=24 (default 24 hours)
   *
   * Response:
   * {
   *   dau: 150,
   *   error_rate: 0.2,
   *   api_latency: { p50: 100, p95: 250, p99: 500 },
   *   feature_usage: { student_enrollment: 45, attendance: 120 },
   *   timestamp: "2026-05-06T10:30:00Z"
   * }
   */
  router.get('/telemetry/dashboard-stats', async (req: Request, res: Response) => {
    try {
      const hoursBack = parseInt(req.query.hours_back as string) || 24;

      const metrics = await analyticsService.getRealTimeMetrics(hoursBack);

      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[Telemetry] Dashboard stats error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * POST /api/v1/telemetry/test
   * Test endpoint for verifying analytics integration
   * Only enabled in development
   */
  if (process.env.NODE_ENV === 'development') {
    router.post('/telemetry/test', async (req: Request, res: Response) => {
      const testEvent: TelemetryEvent = {
        event_name: 'test_event',
        timestamp: new Date().toISOString(),
        user_id: 'test_user_123',
        properties: {
          test: true,
          timestamp: new Date().getTime(),
        },
        context: {
          environment: 'development',
          version: '0.1.0',
          device_type: 'desktop',
        },
      };

      await analyticsService.logEvent(testEvent);

      return res.status(200).json({
        success: true,
        message: 'Test event logged successfully',
        event: testEvent,
      });
    });
  }

  return router;
}

/**
 * Helper function to extract client IP from request
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}
