/**
 * Analytics Configuration
 * Centralized configuration for analytics setup
 */

import { AnalyticsService } from '../services/analytics';
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Analytics Configuration Interface
 */
export interface AnalyticsConfig {
  // Google Analytics 4
  ga4: {
    measurementId: string;
    apiSecret: string;
    enabled: boolean;
  };

  // Firestore
  firestore: {
    database: string;
    eventsCollection: string;
    metricsCollection: string;
  };

  // Settings
  settings: {
    environment: string;
    version: string;
    enabled: boolean;
    logToConsole: boolean;
    batchSize: number;
    flushIntervalMs: number;
  };
}

/**
 * Load analytics configuration from environment
 */
export function loadAnalyticsConfig(): AnalyticsConfig {
  return {
    ga4: {
      measurementId: process.env.GA4_MEASUREMENT_ID || '',
      apiSecret: process.env.GA4_API_SECRET || '',
      enabled: process.env.GA4_ENABLED === 'true',
    },

    firestore: {
      database: process.env.FIRESTORE_DATABASE || '(default)',
      eventsCollection: process.env.ANALYTICS_EVENTS_COLLECTION || 'analytics_events',
      metricsCollection: process.env.ANALYTICS_METRICS_COLLECTION || 'metrics',
    },

    settings: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '0.1.0',
      enabled: process.env.ANALYTICS_ENABLED !== 'false',
      logToConsole: process.env.NODE_ENV === 'development',
      batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '100'),
      flushIntervalMs: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL_MS || '5000'),
    },
  };
}

/**
 * Initialize analytics service
 */
export function initializeAnalytics(firestore: Firestore): AnalyticsService {
  const config = loadAnalyticsConfig();

  if (!config.settings.enabled) {
    console.warn('[Analytics] Analytics disabled in environment');
  }

  if (config.ga4.enabled) {
    if (!config.ga4.measurementId || !config.ga4.apiSecret) {
      console.warn('[Analytics] GA4_MEASUREMENT_ID or GA4_API_SECRET not configured');
    }
  }

  // Create and return analytics service
  const analyticsService = new AnalyticsService(firestore);

  // Log initialization
  analyticsService.logEvent({
    event_name: 'analytics_initialized',
    timestamp: new Date().toISOString(),
    properties: {
      environment: config.settings.environment,
      version: config.settings.version,
      ga4_enabled: config.ga4.enabled,
    },
    context: {
      environment: config.settings.environment,
      version: config.settings.version,
    },
  });

  return analyticsService;
}

/**
 * Validate analytics configuration
 */
export function validateAnalyticsConfig(config: AnalyticsConfig): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (config.ga4.enabled) {
    if (!config.ga4.measurementId) {
      errors.push('GA4_MEASUREMENT_ID not configured');
    }
    if (!config.ga4.apiSecret) {
      errors.push('GA4_API_SECRET not configured');
    }
  } else {
    warnings.push('GA4 is disabled - analytics will only be stored in Firestore');
  }

  if (config.settings.environment === 'production' && !config.settings.enabled) {
    warnings.push(
      'Analytics disabled in production - this may impact monitoring and observability'
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Print analytics configuration status
 */
export function printAnalyticsStatus(config: AnalyticsConfig): void {
  console.log('\n📊 Analytics Configuration');
  console.log('═'.repeat(50));

  console.log('🔧 Settings:');
  console.log(`  Environment: ${config.settings.environment}`);
  console.log(`  Version: ${config.settings.version}`);
  console.log(`  Enabled: ${config.settings.enabled ? '✅' : '❌'}`);
  console.log(`  Console Logging: ${config.settings.logToConsole ? '✅' : '❌'}`);

  console.log('\n📍 Storage:');
  console.log(`  Firestore DB: ${config.firestore.database}`);
  console.log(`  Events Collection: ${config.firestore.eventsCollection}`);
  console.log(`  Metrics Collection: ${config.firestore.metricsCollection}`);

  console.log('\n📈 Google Analytics 4:');
  console.log(`  Enabled: ${config.ga4.enabled ? '✅' : '❌'}`);
  if (config.ga4.enabled) {
    console.log(`  Measurement ID: ${config.ga4.measurementId.substring(0, 5)}...`);
    console.log(`  API Secret: ${config.ga4.apiSecret.substring(0, 5)}...`);
  }

  // Validate configuration
  const validation = validateAnalyticsConfig(config);

  if (validation.errors.length > 0) {
    console.log('\n⚠️ Errors:');
    validation.errors.forEach((err) => console.log(`  - ${err}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    validation.warnings.forEach((warn) => console.log(`  - ${warn}`));
  }

  console.log('\n' + '═'.repeat(50) + '\n');
}
