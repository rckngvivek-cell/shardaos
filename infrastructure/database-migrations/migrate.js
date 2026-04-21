#!/usr/bin/env node

/**
 * Database Migration CLI
 * Usage:
 *   node migrate.js run [migrationName|all]         # Run migration(s)
 *   node migrate.js rollback [migrationName]        # Rollback migration
 *   node migrate.js status                          # Show migration status
 *   node migrate.js validate [migrationName]        # Validate migration
 *   node migrate.js run --dry-run [migrationName]   # Test migration
 */

const path = require('path');
const FirestoreMigrationManager =  require('./migration-manager');

// Get Firebase credentials from environment
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

const manager = new FirestoreMigrationManager(firebaseConfig);

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];
  const dryRun = args.includes('--dry-run');

  console.log('\n📦 Firestore Migration Manager\n');

  try {
    switch (command) {
      case 'run':
        if (subcommand === 'all' || !subcommand) {
          console.log('Running all pending migrations...\n');
          const results = await manager.runPendingMigrations(dryRun);
          console.log('\n📊 Results:');
          console.log(JSON.stringify(results, null, 2));
        } else {
          await manager.runMigration(subcommand, dryRun);
        }
        break;

      case 'rollback':
        if (!subcommand) {
          console.error('❌ Migration name required for rollback');
          process.exit(1);
        }
        await manager.rollbackMigration(subcommand, dryRun);
        break;

      case 'status':
        const status = await manager.getMigrationStatus();
        console.log('Applied migrations:');
        status.applied.forEach(m => console.log(`  ✓ ${m}`));
        if (status.lastApplied) {
          console.log(`\nLast applied: ${status.lastApplied.name} at ${status.lastApplied.timestamp}`);
        }
        break;

      case 'validate':
        if (!subcommand) {
          console.error('❌ Migration name required for validation');
          process.exit(1);
        }
        await manager.validateMigration(subcommand);
        break;

      default:
        printHelp();
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Usage: node migrate.js <command> [options]

Commands:
  run [migrationName|all]       Run migration(s). Use --dry-run to test
  rollback [migrationName]      Rollback a migration
  status                        Show migration history
  validate [migrationName]      Validate a migration

Options:
  --dry-run                     Test without applying changes

Examples:
  node migrate.js run all
  node migrate.js run 001_add_mobile_collections --dry-run
  node migrate.js rollback 001_add_mobile_collections
  node migrate.js status
  `);
}

main().then(() => {
  console.log('\n✅ Done\n');
  process.exit(0);
});
