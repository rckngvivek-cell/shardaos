/**
 * Firestore Module
 * Convenience wrapper for accessing Firestore DB instance
 */

import { getDb } from './firebase';

// Export db instance for use throughout the app
export const db = getDb();

// Re-export common Firestore types and utilities
export { getDb, getFirestoreDb, getFirebaseApp } from './firebase';
