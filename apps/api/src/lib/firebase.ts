import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { env } from '../config/env';
import { AppError } from './app-error';

function normalizePrivateKey(privateKey?: string) {
  return privateKey?.replace(/\\n/g, '\n');
}

export function requireFirebaseProjectId() {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new AppError(
      500,
      'FIREBASE_CONFIG_MISSING',
      'FIREBASE_PROJECT_ID must be set when Firebase auth or storage is enabled'
    );
  }

  return env.FIREBASE_PROJECT_ID;
}

function hasEmulatorHost() {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

function createApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const projectId = requireFirebaseProjectId();

  if (hasEmulatorHost()) {
    return initializeApp({
      projectId
    });
  }

  const hasInlineCredentials = Boolean(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

  return initializeApp({
    projectId,
    credential: hasInlineCredentials
      ? cert({
          projectId,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY)
        })
      : applicationDefault()
  });
}

export function getFirebaseApp() {
  return createApp();
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}

export function getDb() {
  return getFirestoreDb();
}
