/**
 * Jest Setup File
 * Configures Firestore emulator and test environment
 */

// Configure Firestore emulator for local testing
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';

console.log(`Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`Firebase Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
