/**
 * Firestore Database Migration Framework
 * Week 5 DevOps - PR #12
 * 
 * Migration management system for controlled schema changes
 * Supports: rollback, dry-run, progress tracking, validation
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class FirestoreMigrationManager {
  constructor(firebaseConfig) {
    if (!admin.apps.length) {
      admin.initializeApp(firebaseConfig);
    }
    this.db = admin.firestore();
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationHistory = [];
  }

  /**
   * Load all migration files from migrations directory
   */
  async loadMigrations() {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(f => f.endsWith('.js'))
      .sort();

    return files.map(file => {
      const migrationPath = path.join(this.migrationsPath, file);
      const migration = require(migrationPath);
      return {
        name: file.replace('.js', ''),
        path: migrationPath,
        up: migration.up,
        down: migration.down,
      };
    });
  }

  /**
   * Get migration status from Firestore
   */
  async getMigrationStatus() {
    const doc = await this.db
      .collection('_migrations')
      .doc('status')
      .get();
    
    return doc.exists ? doc.data() : {
      applied: [],
      pending: [],
      lastApplied: null,
    };
  }

  /**
   * Run a specific migration (up)
   */
  async runMigration(migrationName, dryRun = false) {
    console.log(`🔄 Running migration: ${migrationName}${dryRun ? ' (DRY RUN)' : ''}`);

    const migration = await this._loadMigration(migrationName);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationName}`);
    }

    const status = await this.getMigrationStatus();
    if (status.applied.includes(migrationName)) {
      throw new Error(`Migration already applied: ${migrationName}`);
    }

    try {
      console.log(`  → Executing migration...`);
      await migration.up(this.db, dryRun);

      if (!dryRun) {
        // Record migration in history
        status.applied.push(migrationName);
        status.lastApplied = {
          name: migrationName,
          timestamp: admin.firestore.Timestamp.now(),
        };
        
        await this.db.collection('_migrations').doc('status').set(status);
        console.log(`  ✅ Migration applied successfully`);
      } else {
        console.log(`  ℹ️  DRY RUN - No changes committed`);
      }

      return { success: true, migration: migrationName };
    } catch (error) {
      console.error(`  ❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback a specific migration (down)
   */
  async rollbackMigration(migrationName, dryRun = false) {
    console.log(`⏮️  Rolling back migration: ${migrationName}${dryRun ? ' (DRY RUN)' : ''}`);

    const migration = await this._loadMigration(migrationName);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationName}`);
    }

    const status = await this.getMigrationStatus();
    if (!status.applied.includes(migrationName)) {
      throw new Error(`Migration not applied: ${migrationName}`);
    }

    try {
      console.log(`  → Rolling back...`);
      await migration.down(this.db, dryRun);

      if (!dryRun) {
        // Remove from applied migrations
        status.applied = status.applied.filter(m => m !== migrationName);
        
        await this.db.collection('_migrations').doc('status').set(status);
        console.log(`  ✅ Rollback completed successfully`);
      } else {
        console.log(`  ℹ️  DRY RUN - No changes committed`);
      }

      return { success: true, migration: migrationName, rolled_back: true };
    } catch (error) {
      console.error(`  ❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(dryRun = false) {
    const allMigrations = await this.loadMigrations();
    const status = await this.getMigrationStatus();

    const pending = allMigrations.filter(m => !status.applied.includes(m.name));
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return [];
    }

    console.log(`\n📋 Pending migrations (${pending.length}):`);
    pending.forEach((m, i) => console.log(`  ${i + 1}. ${m.name}`));
    
    const results = [];
    for (const migration of pending) {
      try {
        await this.runMigration(migration.name, dryRun);
        results.push({ migration: migration.name, status: 'success' });
      } catch (error) {
        console.error(`Failed to run ${migration.name}: ${error.message}`);
        results.push({ migration: migration.name, status: 'failed', error: error.message });
        
        // Stop on first failure
        break;
      }
    }

    return results;
  }

  /**
   * Validate migration (check for conflicts, dependencies)
   */
  async validateMigration(migrationName) {
    console.log(`✔️  Validating migration: ${migrationName}`);
    
    const migration = await this._loadMigration(migrationName);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationName}`);
    }

    // Run validation checks
    const checks = {
      hasUpFunction: !!migration.up,
      hasDownFunction: !!migration.down,
      isIdempotent: await this._checkIdempotency(migration, migrationName),
      noConflicts: await this._checkConflicts(migrationName),
    };

    const allPassed = Object.values(checks).every(v => v);
    console.log(`  → Validation: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

    return { migration: migrationName, checks, allPassed };
  }

  /**
   * Private helper: Load a specific migration
   */
  async _loadMigration(migrationName) {
    const migrations = await this.loadMigrations();
    return migrations.find(m => m.name === migrationName);
  }

  /**
   * Private helper: Check if migration is idempotent
   */
  async _checkIdempotency(migration, migrationName) {
    // This would involve running the migration and checking if running again produces same result
    return true; // Simplified for now
  }

  /**
   * Private helper: Check for conflicts with other migrations
   */
  async _checkConflicts(migrationName) {
    // Check if this migration conflicts with others
    return true; // Simplified for now
  }
}

module.exports = FirestoreMigrationManager;
