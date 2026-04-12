import { createApp } from './app';
import { env } from './config/env';
import { initializePubSub } from './services/pubsub-service';
import { setupCloudLogging } from './services/cloud-logging';

const app = createApp();

// Detect if GCP credentials are available
function hasGcpCredentials(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GCP_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID
  );
}

async function startup(): Promise<void> {
  try {
    const hasGcp = hasGcpCredentials();
    
    if (!hasGcp) {
      console.log('⚠️  No GCP credentials detected - running in standalone mode');
      console.log('   - PubSub: disabled');
      console.log('   - Cloud Logging: disabled');
      console.log('   - All data pipeline features: disabled\n');
    }

    // Initialize PubSub topics (optional - only if GCP available)
    if (hasGcp) {
      try {
        await initializePubSub();
        console.log(`✓ PubSub initialized for data pipeline`);
      } catch (error) {
        console.warn(`⚠️  PubSub initialization failed (will continue without data pipeline)`);;
      }

      // Initialize Cloud Logging (optional - only if GCP available)
      try {
        await setupCloudLogging(true);
        console.log(`✓ Cloud Logging configured`);
      } catch (error) {
        console.warn(`⚠️  Cloud Logging setup failed (will continue with console logging)`);
      }
    }

    // Start HTTP server
    app.listen(env.PORT, () => {
      console.log(`\n🚀 School ERP API running on http://localhost:${env.PORT}/api/v1`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Mode: ${hasGcp ? 'Full (with data pipeline)' : 'Standalone (core API only)'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startup();
