import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env.js';

let app: App;

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp({
      credential: cert(env.GOOGLE_APPLICATION_CREDENTIALS),
      projectId: env.FIREBASE_PROJECT_ID,
    });
  } else {
    app = initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  }

  return app;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}
