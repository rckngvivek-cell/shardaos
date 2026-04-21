/**
 * Migration: 001_add_mobile_collections.js
 * Week 5 - Add new collections for mobile app support
 */

module.exports = {
  description: 'Add mobile app collections and indexes',
  
  async up(db, dryRun = false) {
    console.log('    Creating mobile app collections...');

    // 1. Create mobile_sessions collection with indexes
    const sessionsRef = db.collection('mobile_sessions');
    
    if (!dryRun) {
      // Add sample document to ensure collection exists
      await sessionsRef.doc('_init').set({
        type: 'metadata',
        createdAt: new Date(),
        version: 1,
      });

      // Create indexes (Cloud Firestore will create automatically)
      console.log('    ✓ mobile_sessions collection created');
    } else {
      console.log('    [DRY RUN] Would create mobile_sessions collection');
    }

    // 2. Create mobile_crashes collection
    const crashesRef = db.collection('mobile_crashes');
    
    if (!dryRun) {
      await crashesRef.doc('_init').set({
        type: 'metadata',
        createdAt: new Date(),
      });
      console.log('    ✓ mobile_crashes collection created');
    } else {
      console.log('    [DRY RUN] Would create mobile_crashes collection');
    }

    // 3. Create push_notifications collection
    const notificationsRef = db.collection('push_notifications');
    
    if (!dryRun) {
      await notificationsRef.doc('_init').set({
        type: 'metadata',
        createdAt: new Date(),
      });
      console.log('    ✓ push_notifications collection created');
    } else {
      console.log('    [DRY RUN] Would create push_notifications collection');
    }

    // 4. Add mobile_device_id field to users collection
    console.log('    Adding mobile_device_id to users...');
    
    if (!dryRun) {
      const usersSnapshot = await db.collection('users').limit(100).get();
      const batch = db.batch();
      
      usersSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          mobile_device_id: null,
          lastMobileSync: null,
        });
      });
      
      await batch.commit();
      console.log(`    ✓ Updated ${usersSnapshot.size} users with mobile_device_id`);
    } else {
      console.log('    [DRY RUN] Would add mobile_device_id to users');
    }

    console.log('    ✅ Migration completed');
  },

  async down(db, dryRun = false) {
    console.log('    Rolling back mobile collections...');

    if (!dryRun) {
      // Delete collections
      await deleteCollection(db, 'mobile_sessions', 100);
      await deleteCollection(db, 'mobile_crashes', 100);
      await deleteCollection(db, 'push_notifications', 100);
      
      // Remove fields from users
      const usersSnapshot = await db.collection('users').limit(100).get();
      const batch = db.batch();
      
      usersSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          mobile_device_id: admin.firestore.FieldValue.delete(),
          lastMobileSync: admin.firestore.FieldValue.delete(),
        });
      });
      
      await batch.commit();
      console.log('    ✅ Rollback completed');
    } else {
      console.log('    [DRY RUN] Would delete mobile collections');
    }
  }
};

async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  if (batchSize < 100) {
    resolve();
    return;
  }

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}
