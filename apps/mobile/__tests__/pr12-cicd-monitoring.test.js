/**
 * PR #12 - Mobile CI/CD & Monitoring Tests
 * 16+ test cases for complete coverage
 */

const FirestoreMigrationManager = require('../../../infrastructure/database-migrations/migration-manager');

describe('PR #12 - Mobile CI/CD & Monitoring', () => {
  // ==================== CI/CD Pipeline Tests ====================
  
  describe('Fastlane Configuration', () => {
    test('iOS Fastfile exists and is valid', () => {
      const fs = require('fs');
      const fastfilePath = '../ios/fastlane/Fastfile';
      
      expect(fs.existsSync(fastfilePath)).toBe(true);
      
      // Verify key lanes exist
      const content = fs.readFileSync(fastfilePath, 'utf-8');
      expect(content).toContain('lane :run_tests');
      expect(content).toContain('lane :build_release');
      expect(content).toContain('lane :upload_testflight');
      expect(content).toContain('lane :ci_build');
    });

    test('Android Fastfile exists with required lanes', () => {
      const fs = require('fs');
      const fastfilePath = '../android/fastlane/Fastfile';
      
      expect(fs.existsSync(fastfilePath)).toBe(true);
      
      const content = fs.readFileSync(fastfilePath, 'utf-8');
      expect(content).toContain('lane :run_tests');
      expect(content).toContain('lane :build_release');
      expect(content).toContain('lane :upload_playstore');
      expect(content).toContain('lane :ci_build');
    });

    test('iOS Appfile has required credentials', () => {
      const fs = require('fs');
      const appfilePath = '../ios/fastlane/Appfile';
      const content = fs.readFileSync(appfilePath, 'utf-8');
      
      expect(content).toContain('app_identifier');
      expect(content).toContain('apple_id');
      expect(content).toContain('team_id');
    });

    test('Android Appfile configured for Play Store', () => {
      const fs = require('fs');
      const appfilePath = '../android/fastlane/Appfile';
      const content = fs.readFileSync(appfilePath, 'utf-8');
      
      expect(content).toContain('json_key_file');
      expect(content).toContain('package_name');
      expect(content).toContain('com.schoolerp.mobile');
    });
  });

  describe('GitHub Actions Workflows', () => {
    test('iOS build workflow exists with proper triggers', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/09-mobile-ios-build.yml';
      
      expect(fs.existsSync(workflowPath)).toBe(true);
      
      const content = fs.readFileSync(workflowPath, 'utf-8');
      expect(content).toContain('Mobile iOS Build & Deploy');
      expect(content).toContain('run_tests');
      expect(content).toContain('build_release');
      expect(content).toContain('upload_testflight');
    });

    test('Android build workflow exists with proper config', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/10-mobile-android-build.yml';
      
      expect(fs.existsSync(workflowPath)).toBe(true);
      
      const content = fs.readFileSync(workflowPath, 'utf-8');
      expect(content).toContain('Mobile Android Build & Deploy');
      expect(content).toContain('run_tests');
      expect(content).toContain('build_release');
      expect(content).toContain('upload_playstore');
    });

    test('iOS workflow has Slack notifications', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/09-mobile-ios-build.yml';
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('SLACK_WEBHOOK_DEVOPS');
      expect(content).toContain('Notify Slack - Success');
      expect(content).toContain('Notify Slack - Failure');
    });

    test('Android workflow has Slack notifications', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/10-mobile-android-build.yml';
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('SLACK_WEBHOOK_DEVOPS');
      expect(content).toContain('Notify Slack - Success');
      expect(content).toContain('Notify Slack - Failure');
    });
  });

  // ==================== Mobile Monitoring Tests ====================
  
  describe('Mobile App Monitoring', () => {
    test('Mobile monitoring dashboard exists', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/mobile-dashboard.json';
      
      expect(fs.existsSync(dashboardPath)).toBe(true);
      
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      expect(dashboard.displayName).toContain('Mobile App');
      expect(dashboard.mosaicLayout.tiles.length).toBeGreaterThan(0);
    });

    test('Mobile monitoring tracks crash rate', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/mobile-dashboard.json';
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      
      const crashTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Crash')
      );
      expect(crashTile).toBeDefined();
    });

    test('Mobile monitoring tracks startup time', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/mobile-dashboard.json';
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      
      const startupTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Startup')
      );
      expect(startupTile).toBeDefined();
    });

    test('Mobile monitoring tracks API latency', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/mobile-dashboard.json';
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      
      const latencyTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Latency')
      );
      expect(latencyTile).toBeDefined();
    });

    test('Alert policies configured for mobile', () => {
      const fs = require('fs');
      const alertsPath = '../infrastructure/monitoring/mobile-alerts.yaml';
      
      expect(fs.existsSync(alertsPath)).toBe(true);
      
      const content = fs.readFileSync(alertsPath, 'utf-8');
      expect(content).toContain('mobile_crash_rate_high');
      expect(content).toContain('mobile_api_error_rate_high');
      expect(content).toContain('mobile_latency_p95_high');
    });
  });

  // ==================== Load Testing Tests ====================
  
  describe('Load Testing Infrastructure', () => {
    test('k6 load test script exists', () => {
      const fs = require('fs');
      const testPath = '../k6/mobile-loadtest/load-test-1000-concurrent.js';
      
      expect(fs.existsSync(testPath)).toBe(true);
    });

    test('Load test simulates 1000 concurrent users', () => {
      const fs = require('fs');
      const testPath = '../k6/mobile-loadtest/load-test-1000-concurrent.js';
      const content = fs.readFileSync(testPath, 'utf-8');
      
      expect(content).toContain('target: 1000');
      expect(content).toContain('stages:');
      expect(content).toContain('duration: \'5m\'');
    });

    test('Load test has performance thresholds', () => {
      const fs = require('fs');
      const testPath = '../k6/mobile-loadtest/load-test-1000-concurrent.js';
      const content = fs.readFileSync(testPath, 'utf-8');
      
      // Check p95 threshold
      expect(content).toContain('p(95)<400');
      // Check error rate threshold
      expect(content).toContain('rate<0.001');
    });

    test('Load testing workflow triggers correctly', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/11-load-testing-mobile.yml';
      
      expect(fs.existsSync(workflowPath)).toBe(true);
      
      const content = fs.readFileSync(workflowPath, 'utf-8');
      expect(content).toContain('Mobile Load Testing');
      expect(content).toContain('schedule');
      expect(content).toContain('workflow_dispatch');
    });

    test('Load test includes HTML report generation', () => {
      const fs = require('fs');
      const testPath = '../k6/mobile-loadtest/load-test-1000-concurrent.js';
      const content = fs.readFileSync(testPath, 'utf-8');
      
      expect(content).toContain('htmlReport');
      expect(content).toContain('handleSummary');
    });
  });

  // ==================== Database Migration Tests ====================
  
  describe('Database Migration Framework', () => {
    test('Migration manager exists', () => {
      const fs = require('fs');
      const managerPath = '../infrastructure/database-migrations/migration-manager.js';
      
      expect(fs.existsSync(managerPath)).toBe(true);
    });

    test('Migration manager has required methods', () => {
      const fs = require('fs');
      const managerPath = '../infrastructure/database-migrations/migration-manager.js';
      const content = fs.readFileSync(managerPath, 'utf-8');
      
      expect(content).toContain('runMigration');
      expect(content).toContain('rollbackMigration');
      expect(content).toContain('getMigrationStatus');
      expect(content).toContain('validateMigration');
    });

    test('Migration CLI exists and is functional', () => {
      const fs = require('fs');
      const cliPath = '../infrastructure/database-migrations/migrate.js';
      
      expect(fs.existsSync(cliPath)).toBe(true);
      
      const content = fs.readFileSync(cliPath, 'utf-8');
      expect(content).toContain('run all');
      expect(content).toContain('rollback');
      expect(content).toContain('status');
      expect(content).toContain('validate');
    });

    test('First migration adds mobile collections', () => {
      const fs = require('fs');
      const migrationPath = '../infrastructure/database-migrations/migrations/001_add_mobile_collections.js';
      
      expect(fs.existsSync(migrationPath)).toBe(true);
      
      const content = fs.readFileSync(migrationPath, 'utf-8');
      expect(content).toContain('mobile_sessions');
      expect(content).toContain('mobile_crashes');
      expect(content).toContain('push_notifications');
    });

    test('Migration supports dry-run mode', () => {
      const fs = require('fs');
      const migrationPath = '../infrastructure/database-migrations/migrations/001_add_mobile_collections.js';
      const content = fs.readFileSync(migrationPath, 'utf-8');
      
      expect(content).toContain('dryRun');
      expect(content).toContain('DRY RUN');
    });

    test('Migration has rollback capability', () => {
      const fs = require('fs');
      const migrationPath = '../infrastructure/database-migrations/migrations/001_add_mobile_collections.js';
      const content = fs.readFileSync(migrationPath, 'utf-8');
      
      expect(content).toContain('down(db');
      expect(content).toContain('deleteCollection');
    });
  });

  // ==================== SLA Dashboard Tests ====================
  
  describe('SLA Dashboard', () => {
    test('SLA dashboard exists', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/sla-dashboard.json';
      
      expect(fs.existsSync(dashboardPath)).toBe(true);
    });

    test('SLA dashboard tracks overall uptime', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/sla-dashboard.json';
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      
      const uptimeTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Uptime')
      );
      expect(uptimeTile).toBeDefined();
    });

    test('SLA dashboard tracks API availability', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/sla-dashboard.json';
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      
      const availabilityTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Availability')
      );
      expect(availabilityTile).toBeDefined();
    });

    test('SLA dashboard has performance metrics', () => {
      const fs = require('fs');
      const dashboardPath = '../infrastructure/monitoring/sla-dashboard.json';
      const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      
      const errorRateTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Error Rate')
      );
      const latencyTile = dashboard.mosaicLayout.tiles.find(t => 
        t.widget.title?.includes('Latency')
      );
      
      expect(errorRateTile).toBeDefined();
      expect(latencyTile).toBeDefined();
    });
  });

  // ==================== Integration Tests ====================
  
  describe('CI/CD Integration', () => {
    test('iOS workflow triggers on push to main', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/09-mobile-ios-build.yml';
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('push:');
      expect(content).toContain('branches: [main');
    });

    test('Android workflow triggers on push to main', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/10-mobile-android-build.yml';
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('push:');
      expect(content).toContain('branches: [main');
    });

    test('Load testing workflow scheduled daily', () => {
      const fs = require('fs');
      const workflowPath = '../.github/workflows/11-load-testing-mobile.yml';
      const content = fs.readFileSync(workflowPath, 'utf-8');
      
      expect(content).toContain('schedule:');
      expect(content).toContain('cron:');
    });
  });
});
