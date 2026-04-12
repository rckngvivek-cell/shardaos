/**
 * Client-Side Analytics Service
 * Tracks user interactions and sends events to backend
 * Integrates with Google Analytics 4 for web tracking
 */

export interface ClientEvent {
  event_name: string;
  properties?: Record<string, any>;
}

class AnalyticsClient {
  private apiEndpoint = '/api/v1/telemetry';
  private sessionId: string;
  private userId?: string;
  private userRole?: string;
  private sessionStartTime: number;
  private pageViewCount = 0;
  private apiCallCount = 0;
  private eventBuffer: any[] = [];
  private batchSize = 10;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initializeTracking();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize tracking mechanisms
   */
  private initializeTracking(): void {
    // Track initial page view
    this.trackPageView();

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_paused', {
          duration_ms: Date.now() - this.sessionStartTime,
        });
      } else {
        this.trackEvent('session_resumed', {
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Track route changes (for SPA)
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    // Ensure events are sent before page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
      this.trackSessionEnd();
    });

    // Track visibility
    window.addEventListener('blur', () => {
      this.trackEvent('page_blur', { timestamp: new Date().toISOString() });
    });

    window.addEventListener('focus', () => {
      this.trackEvent('page_focus', { timestamp: new Date().toISOString() });
    });
  }

  /**
   * Set user context after authentication
   * @param userId - Firebase UID
   * @param role - User role (admin, teacher, student, parent)
   */
  setUser(userId: string, role: 'admin' | 'teacher' | 'student' | 'parent'): void {
    this.userId = userId;
    this.userRole = role;

    // Track login event
    this.trackEvent('user_login', {
      role,
      timestamp: new Date().toISOString(),
    });

    // Store in localStorage for persistence
    localStorage.setItem('analytics_user_id', userId);
    localStorage.setItem('analytics_user_role', role);
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    this.trackEvent('user_logout', {
      session_duration_ms: Date.now() - this.sessionStartTime,
    });

    this.userId = undefined;
    this.userRole = undefined;
    localStorage.removeItem('analytics_user_id');
    localStorage.removeItem('analytics_user_role');
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    this.pageViewCount++;

    this.trackEvent('page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
      page_view_number: this.pageViewCount,
      referrer: document.referrer || null,
      device_type: this.getDeviceType(),
    });
  }

  /**
   * Track feature access
   */
  trackFeatureAccess(
    featureName: string,
    action: 'view' | 'create' | 'update' | 'delete' | 'export',
    properties?: Record<string, any>
  ): void {
    this.trackEvent('feature_accessed', {
      feature_name: featureName,
      action,
      ...properties,
      device_type: this.getDeviceType(),
    });
  }

  /**
   * Track API call timing
   */
  trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number,
    success: boolean
  ): void {
    this.apiCallCount++;

    this.trackEvent('api_call_tracked', {
      endpoint,
      method,
      status_code: statusCode,
      latency_ms: latencyMs,
      success,
      api_call_number: this.apiCallCount,
    });
  }

  /**
   * Track error events
   */
  trackError(errorType: string, message: string, properties?: Record<string, any>): void {
    this.trackEvent('client_error', {
      error_type: errorType,
      error_message: message,
      page_path: window.location.pathname,
      ...properties,
      severity: this.getErrorSeverity(errorType),
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event = {
      event_name: eventName,
      user_id: this.userId,
      user_role: this.userRole,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties: properties || {},
      context: {
        page_path: window.location.pathname,
        device_type: this.getDeviceType(),
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      },
    };

    // Add to buffer
    this.eventBuffer.push(event);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      this.flushEvents();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties);
    }
  }

  /**
   * Flush buffered events to backend
   */
  private flushEvents(): void {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    // Send via beacon API (most reliable for unload scenarios)
    const payload = JSON.stringify({ events });

    // Try beacon first (most reliable)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.apiEndpoint, payload);
    }

    // Also try fetch with keepalive for redundancy
    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true,
    }).catch((err) => {
      console.warn('[Analytics] Send failed:', err);
      // Restore events to buffer if send fails in development
      if (process.env.NODE_ENV === 'development') {
        this.eventBuffer = [...events, ...this.eventBuffer];
      }
    });
  }

  /**
   * Track session end
   */
  private trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;

    this.trackEvent('session_end', {
      session_duration_ms: sessionDuration,
      page_views: this.pageViewCount,
      api_calls: this.apiCallCount,
    });

    // Immediate flush
    if (this.eventBuffer.length > 0) {
      this.flushEvents();
    }
  }

  /**
   * Manually flush events (useful for react apps between route changes)
   */
  flush(): void {
    this.flushEvents();
  }

  /**
   * Get device type based on viewport width
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Determine error severity
   */
  private getErrorSeverity(errorType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      api_error: 'medium',
      render_error: 'high',
      permission_error: 'medium',
      network_error: 'high',
      timeout_error: 'high',
      security_error: 'critical',
    };
    return severityMap[errorType] || 'low';
  }

  /**
   * Get session info
   */
  getSessionInfo(): any {
    return {
      session_id: this.sessionId,
      user_id: this.userId,
      user_role: this.userRole,
      duration_ms: Date.now() - this.sessionStartTime,
      page_views: this.pageViewCount,
      api_calls: this.apiCallCount,
      device_type: this.getDeviceType(),
    };
  }

  /**
   * Restore user session from localStorage
   */
  restoreSession(): void {
    const userId = localStorage.getItem('analytics_user_id');
    const userRole = localStorage.getItem('analytics_user_role');

    if (userId && userRole) {
      this.userId = userId;
      this.userRole = userRole as any;
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsClient();

// Auto-restore session on initialization
analytics.restoreSession();
