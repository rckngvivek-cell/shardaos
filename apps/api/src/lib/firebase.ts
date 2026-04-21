import { applicationDefault, initializeApp, cert, getApps, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env.js';

let app: App;

export type FirebaseCredentialSource =
  | { kind: 'none' }
  | { kind: 'applicationDefault' }
  | { kind: 'serviceAccount'; serviceAccount: ServiceAccount };

/**
 * Supports the standard GOOGLE_APPLICATION_CREDENTIALS path as well as
 * inline JSON service-account content for controlled operator workflows.
 */
export function resolveFirebaseCredentialSource(
  rawGoogleApplicationCredentials = env.GOOGLE_APPLICATION_CREDENTIALS,
): FirebaseCredentialSource {
  const trimmed = rawGoogleApplicationCredentials.trim();
  if (!trimmed) {
    return { kind: 'none' };
  }

  if (trimmed.startsWith('{')) {
    return {
      kind: 'serviceAccount',
      serviceAccount: JSON.parse(trimmed) as ServiceAccount,
    };
  }

  return { kind: 'applicationDefault' };
}

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const credentialSource = resolveFirebaseCredentialSource();
  const appOptions: {
    projectId?: string;
    credential?: ReturnType<typeof cert> | ReturnType<typeof applicationDefault>;
  } = {};

  if (env.FIREBASE_PROJECT_ID) {
    appOptions.projectId = env.FIREBASE_PROJECT_ID;
  }

  if (credentialSource.kind === 'applicationDefault') {
    appOptions.credential = applicationDefault();
  }

  if (credentialSource.kind === 'serviceAccount') {
    appOptions.credential = cert(credentialSource.serviceAccount);
  }

  app = initializeApp(appOptions);
  return app;
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}
