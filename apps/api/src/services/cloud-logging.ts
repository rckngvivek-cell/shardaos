/**
 * Cloud Logging Configuration for Exam Module Data Pipeline
 * 
 * Sets up structured logging for development and staging environments
 * Configures retention policies and log levels
 */

import { Logging } from '@google-cloud/logging';

interface LoggingConfig {
  projectId: string;
  logName: string;
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  retentionDays: number;
}

const DEVELOPMENT_CONFIG: LoggingConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'school-erp-dev',
  logName: 'school-erp-api-development',
  severity: 'DEBUG',
  retentionDays: 7,
};

const STAGING_CONFIG: LoggingConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'school-erp-dev',
  logName: 'school-erp-api-staging',
  severity: 'INFO',
  retentionDays: 30,
};

const PRODUCTION_CONFIG: LoggingConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'school-erp',
  logName: 'school-erp-api-production',
  severity: 'WARNING',
  retentionDays: 90,
};

export function getLoggingConfig(): LoggingConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'development':
      return DEVELOPMENT_CONFIG;
    case 'staging':
      return STAGING_CONFIG;
    case 'production':
      return PRODUCTION_CONFIG;
    default:
      return DEVELOPMENT_CONFIG;
  }
}

export class CloudLoggingService {
  private logging: Logging | null;
  private config: LoggingConfig;
  private isEnabled: boolean;

  constructor(config?: LoggingConfig, enableCloudLogging: boolean = true) {
    this.config = config || getLoggingConfig();
    this.isEnabled = enableCloudLogging;
    this.logging = null;
    
    if (enableCloudLogging) {
      try {
        this.logging = new Logging({
          projectId: this.config.projectId,
        });
      } catch (error) {
        console.warn('[CloudLogging] Failed to initialize client - operating in disabled mode');
        this.logging = null;
        this.isEnabled = false;
      }
    }
  }

  /**
   * Log an info-level message
   */
  async info(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled || !this.logging) {
      console.log(`[${this.config.logName}] INFO: ${message}`, metadata || '');
      return;
    }

    const log = this.logging.log(this.config.logName);
    const entry = log.entry(
      {
        severity: 'INFO',
        labels: {
          environment: process.env.NODE_ENV || 'development',
          service: 'school-erp-api',
          module: 'exam-data-pipeline',
        },
      },
      {
        message,
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    );

    try {
      await log.write(entry);
    } catch (error) {
      console.error('[CloudLogging] Failed to write info log', error);
    }
  }

  /**
   * Log a warning-level message
   */
  async warn(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled || !this.logging) {
      console.warn(`[${this.config.logName}] WARNING: ${message}`, metadata || '');
      return;
    }

    const log = this.logging.log(this.config.logName);
    const entry = log.entry(
      {
        severity: 'WARNING',
        labels: {
          environment: process.env.NODE_ENV || 'development',
          service: 'school-erp-api',
          module: 'exam-data-pipeline',
        },
      },
      {
        message,
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    );

    try {
      await log.write(entry);
    } catch (error) {
      console.error('[CloudLogging] Failed to write warning log', error);
    }
  }

  /**
   * Log an error-level message
   */
  async error(
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled || !this.logging) {
      console.error(`[${this.config.logName}] ERROR: ${message}`, error || '', metadata || '');
      return;
    }

    const log = this.logging.log(this.config.logName);
    const entry = log.entry(
      {
        severity: 'ERROR',
        labels: {
          environment: process.env.NODE_ENV || 'development',
          service: 'school-erp-api',
          module: 'exam-data-pipeline',
        },
      },
      {
        message,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5),
        } : undefined,
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    );

    try {
      await log.write(entry);
    } catch (err) {
      console.error('[CloudLogging] Failed to write error log', err);
    }
  }

  /**
   * Log a debug-level message (only in development)
   */
  async debug(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled || !this.logging) {
      if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
        console.debug(`[${this.config.logName}] DEBUG: ${message}`, metadata || '');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      const log = this.logging.log(this.config.logName);
      const entry = log.entry(
        {
          severity: 'DEBUG',
          labels: {
            environment: process.env.NODE_ENV || 'development',
            service: 'school-erp-api',
            module: 'exam-data-pipeline',
          },
        },
        {
          message,
          ...metadata,
          timestamp: new Date().toISOString(),
        }
      );

      try {
        await log.write(entry);
      } catch (error) {
        console.debug('[CloudLogging] Failed to write debug log', error);
      }
    }
  }

  /**
   * Log Pub/Sub event
   */
  async logPubSubEvent(
    topicName: string,
    eventType: string,
    messageId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(`Pub/Sub event published`, {
      topicName,
      eventType,
      messageId,
      ...metadata,
    });
  }

  /**
   * Log BigQuery ingestion
   */
  async logBigQueryIngestion(
    tableName: string,
    rowCount: number,
    latencyMs: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(`BigQuery ingestion completed`, {
      tableName,
      rowCount,
      latencyMs,
      ...metadata,
    });
  }

  /**
   * Log pipeline status
   */
  async logPipelineStatus(
    pipelineName: string,
    status: 'STARTED' | 'RUNNING' | 'STOPPED' | 'ERROR',
    metrics?: {
      messagesProcessed?: number;
      errorsCount?: number;
      latencyAvgMs?: number;
    }
  ): Promise<void> {
    await this.info(`Pipeline status updated`, {
      pipelineName,
      status,
      metrics,
    });
  }
}

// Singleton instance
let cloudLoggingInstance: CloudLoggingService | null = null;

export function getCloudLoggingService(): CloudLoggingService {
  if (!cloudLoggingInstance) {
    cloudLoggingInstance = new CloudLoggingService();
  }
  return cloudLoggingInstance;
}

/**
 * Generate gcloud command to configure log retention
 */
export function generateLogRetentionCommand(logName: string, retentionDays: number): string {
  const retentionSeconds = retentionDays * 24 * 60 * 60;
  
  return `gcloud logging sinks update _Default \\
  --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="school-erp-api"' \\
  --log-name='projects/school-erp-dev/logs/${logName}' \\
  --retention-days=${retentionDays}`;
}

/**
 * Setup script for Cloud Logging
 */
export async function setupCloudLogging(enableCloudLogging: boolean = true): Promise<void> {
  try {
    const config = getLoggingConfig();
    console.log(`🔧 Setting up Cloud Logging for ${process.env.NODE_ENV || 'development'}...\n`);

    const service = new CloudLoggingService(config, enableCloudLogging);

    if (!enableCloudLogging) {
      console.log(`⚠️  Cloud Logging disabled - using console logging instead`);
      return;
    }

    // Test logging
    await service.info('Cloud Logging service initialized', {
      environment: process.env.NODE_ENV,
      logName: config.logName,
      retentionDays: config.retentionDays,
    });

    console.log(`✓ Cloud Logging configured`);
    console.log(`  Log Name: ${config.logName}`);
    console.log(`  Severity Level: ${config.severity}`);
    console.log(`  Retention: ${config.retentionDays} days`);
    console.log('\n✅ Cloud Logging setup completed!');

    // Print configuration commands
    console.log('\nTo apply retention policy, run:');
    console.log(generateLogRetentionCommand(config.logName, config.retentionDays));
  } catch (error) {
    console.warn('⚠️  Cloud Logging setup failed:', error);
    // Don't throw - Cloud Logging is optional
  }
}

if (require.main === module) {
  setupCloudLogging();
}
