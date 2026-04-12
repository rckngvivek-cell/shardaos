import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics';

/**
 * Express middleware for automatic analytics logging
 * Tracks all API calls, latency, and errors
 * Logs 3+ events per API call:
 * 1. api_request_started (on middleware entry)
 * 2. api_request_completed (on response send)
 * 3. api_error (if error occurs)
 */

export function analyticsMiddleware(analyticsService: AnalyticsService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.get('x-request-id') || generateRequestId();

    // Attach request context for downstream handlers
    (req as any).requestId = requestId;
    (req as any).analyticsService = analyticsService;

    // Event 1: Log request started
    analyticsService
      .logEvent({
        event_name: 'api_request_started',
        timestamp: new Date().toISOString(),
        user_id: (req as any).user?.uid,
        user_role: (req as any).user?.role,
        properties: {
          endpoint: req.path,
          method: req.method,
          request_id: requestId,
          query_params: Object.keys(req.query).length,
        },
        context: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '0.1.0',
        },
      })
      .catch(console.error);

    // Intercept response.send() to track completion
    const originalSend = res.send;
    res.send = function (this: any, data: any) {
      const latency = Date.now() - startTime;
      const responseSize = JSON.stringify(data).length;

      // Event 2: Log request completed with timing
      analyticsService.logApiCall(
        req.path,
        req.method,
        res.statusCode,
        latency,
        (req as any).user?.uid,
        (req as any).user?.role,
        requestId
      ).catch(console.error);

      // Event 3 (if error): Categorized error event
      if (res.statusCode >= 400) {
        let errorType = 'server_error';
        if (res.statusCode >= 400 && res.statusCode < 500) {
          if (res.statusCode === 401) errorType = 'auth_error';
          else if (res.statusCode === 403) errorType = 'forbidden';
          else if (res.statusCode === 404) errorType = 'not_found';
          else if (res.statusCode === 429) errorType = 'rate_limit';
          else errorType = 'client_error';
        }

        analyticsService.logError(
          errorType,
          `API ${req.method} ${req.path} returned ${res.statusCode}`,
          req.path,
          (req as any).user?.uid,
          res.statusCode
        ).catch(console.error);
      }

      // Log additional context in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${req.method} ${req.path} - ${res.statusCode} (${latency}ms)`);
      }

      return originalSend.call(this, data);
    };

    // Intercept errors
    const originalJson = res.json;
    res.json = function (this: any, data: any) {
      const latency = Date.now() - startTime;

      if (res.statusCode >= 400) {
        let errorType = 'server_error';
        if (res.statusCode >= 400 && res.statusCode < 500) {
          if (res.statusCode === 401) errorType = 'auth_error';
          else if (res.statusCode === 403) errorType = 'forbidden';
          else if (res.statusCode === 404) errorType = 'not_found';
          else if (res.statusCode === 429) errorType = 'rate_limit';
          else errorType = 'client_error';
        }

        analyticsService.logError(
          errorType,
          data?.error?.message || `API ${req.method} ${req.path} returned ${res.statusCode}`,
          req.path,
          (req as any).user?.uid,
          res.statusCode,
          data?.error?.stack
        ).catch(console.error);
      }

      return originalJson.call(this, data);
    };

    // Catch any errors thrown by route handlers
    const originalNext = next;
    next = function (this: any, err?: any) {
      if (err) {
        const latency = Date.now() - startTime;
        const statusCode = err.status || err.statusCode || 500;

        analyticsService.logError(
          err.code || 'unhandled_error',
          err.message,
          req.path,
          (req as any).user?.uid,
          statusCode,
          err.stack
        ).catch(console.error);
      }

      return originalNext.call(this, err);
    };

    next();
  };
}

/**
 * Utility function to generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to attach analytics service to routes
 * Usage: router.get('/endpoint', (req, res) => {
 *   const analytics = (req as any).analyticsService;
 *   analytics.logBusinessEvent('feature', userId, {...});
 * });
 */
export function getAnalyticsService(req: Request): AnalyticsService {
  return (req as any).analyticsService;
}

/**
 * Helper to get request ID from request
 */
export function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}
