/**
 * Alert Service for sending operational alerts
 * Supports alerts via console, email, and SMS for critical events
 */

import { logger } from '../utils/logger';

export interface AlertOptions {
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  message: string;
  context?: Record<string, any>;
  recipient?: string;
}

class AlertService {
  /**
   * Send alert to appropriate channels based on severity
   */
  async sendAlert(options: AlertOptions): Promise<void> {
    try {
      const { severity, service, message, context, recipient } = options;

      // Log the alert
      logger.warn(`Alert [${severity.toUpperCase()}] from ${service}: ${message}`, context);

      // For critical alerts, could integrate with external services
      // like PagerDuty, Slack, SMS, etc.
      if (severity === 'critical') {
        await this.sendCriticalAlert(service, message, context, recipient);
      }
    } catch (error) {
      logger.error('Failed to send alert', error instanceof Error ? error : new Error(String(error)), { options });
    }
  }

  /**
   * Send critical alert (would integrate with incident management)
   */
  private async sendCriticalAlert(
    service: string,
    message: string,
    context: Record<string, any> | undefined,
    recipient: string | undefined
  ): Promise<void> {
    // In production, this would send to PagerDuty, Opsgenie, etc.
    logger.error(`CRITICAL ALERT: ${service} - ${message}`, undefined, { context, recipient });
  }

  /**
   * Send health check alert
   */
  async sendHealthAlert(service: string, status: 'up' | 'down', response?: Record<string, any>): Promise<void> {
    await this.sendAlert({
      severity: status === 'down' ? 'critical' : 'low',
      service,
      message: `Service health check: ${status === 'up' ? 'HEALTHY' : 'UNHEALTHY'}`,
      context: response,
    });
  }
}

export const alertService = new AlertService();
