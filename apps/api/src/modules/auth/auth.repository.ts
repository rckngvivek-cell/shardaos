import type { AuthPlane, UserRole } from '@school-erp/shared';
import { getFirestoreDb } from '../../lib/firebase.js';
import type {
  StoredAuthCredential,
  StoredAuthOtpChallenge,
  StoredAuthSession,
  StoredOwnerBootstrapSession,
  StoredOwnerBootstrapState,
} from './auth.types.js';

const CREDENTIAL_COLLECTION = 'auth_credentials';
const SESSION_COLLECTION = 'auth_sessions';
const OTP_CHALLENGE_COLLECTION = 'auth_otp_challenges';
const OWNER_BOOTSTRAP_STATE_COLLECTION = 'owner_bootstrap_state';
const OWNER_BOOTSTRAP_SESSION_COLLECTION = 'owner_bootstrap_sessions';
export const OWNER_BOOTSTRAP_STATE_DOC_ID = 'primary';

export class AuthRepository {
  private get credentials() {
    return getFirestoreDb().collection(CREDENTIAL_COLLECTION);
  }

  private get sessions() {
    return getFirestoreDb().collection(SESSION_COLLECTION);
  }

  private get otpChallenges() {
    return getFirestoreDb().collection(OTP_CHALLENGE_COLLECTION);
  }

  private get ownerBootstrapState() {
    return getFirestoreDb().collection(OWNER_BOOTSTRAP_STATE_COLLECTION);
  }

  private get ownerBootstrapSessions() {
    return getFirestoreDb().collection(OWNER_BOOTSTRAP_SESSION_COLLECTION);
  }

  async findCredentialByEmail(email: string, plane?: AuthPlane): Promise<StoredAuthCredential | null> {
    let query: FirebaseFirestore.Query = this.credentials.where('emailNormalized', '==', email.trim().toLowerCase()).limit(2);

    if (plane) {
      query = query.where('plane', '==', plane);
    }

    const snap = await query.get();
    if (snap.empty) {
      return null;
    }

    return this.toCredential(snap.docs[0]);
  }

  async findCredentialByUid(uid: string, plane?: AuthPlane): Promise<StoredAuthCredential | null> {
    let query: FirebaseFirestore.Query = this.credentials.where('uid', '==', uid).limit(2);

    if (plane) {
      query = query.where('plane', '==', plane);
    }

    const snap = await query.get();
    if (snap.empty) {
      return null;
    }

    return this.toCredential(snap.docs[0]);
  }

  async findOwnerCredential(): Promise<StoredAuthCredential | null> {
    const snap = await this.credentials
      .where('plane', '==', 'platform')
      .where('role', '==', 'owner')
      .limit(1)
      .get();

    return snap.empty ? null : this.toCredential(snap.docs[0]);
  }

  async saveCredential(
    id: string,
    payload: Omit<StoredAuthCredential, 'id'>,
  ): Promise<StoredAuthCredential> {
    await this.credentials.doc(id).set(payload);
    return { id, ...payload };
  }

  async updateCredential(id: string, patch: Partial<Omit<StoredAuthCredential, 'id'>>): Promise<void> {
    await this.credentials.doc(id).set(
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async createSession(id: string, payload: Omit<StoredAuthSession, 'id'>): Promise<StoredAuthSession> {
    await this.sessions.doc(id).set(payload);
    return { id, ...payload };
  }

  async createOtpChallenge(
    id: string,
    payload: Omit<StoredAuthOtpChallenge, 'id'>,
  ): Promise<StoredAuthOtpChallenge> {
    await this.otpChallenges.doc(id).set(payload);
    return { id, ...payload };
  }

  async findOtpChallengeById(id: string): Promise<StoredAuthOtpChallenge | null> {
    const doc = await this.otpChallenges.doc(id).get();
    return doc.exists ? this.toOtpChallenge(doc) : null;
  }

  async updateOtpChallenge(id: string, patch: Partial<Omit<StoredAuthOtpChallenge, 'id'>>): Promise<void> {
    await this.otpChallenges.doc(id).set(
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async revokeActiveOtpChallengesForUid(uid: string, plane: AuthPlane): Promise<void> {
    const snap = await this.otpChallenges
      .where('uid', '==', uid)
      .where('plane', '==', plane)
      .where('consumedAt', '==', null)
      .where('revokedAt', '==', null)
      .get();

    if (snap.empty) {
      return;
    }

    const batch = getFirestoreDb().batch();
    const revokedAt = new Date().toISOString();
    snap.docs.forEach((doc) => {
      batch.set(
        doc.ref,
        {
          revokedAt,
          updatedAt: revokedAt,
        },
        { merge: true },
      );
    });
    await batch.commit();
  }

  async findOwnerBootstrapState(): Promise<StoredOwnerBootstrapState | null> {
    const doc = await this.ownerBootstrapState.doc(OWNER_BOOTSTRAP_STATE_DOC_ID).get();
    return doc.exists ? this.toOwnerBootstrapState(doc) : null;
  }

  async saveOwnerBootstrapState(
    payload: Omit<StoredOwnerBootstrapState, 'id'>,
  ): Promise<StoredOwnerBootstrapState> {
    await this.ownerBootstrapState.doc(OWNER_BOOTSTRAP_STATE_DOC_ID).set(payload, { merge: true });
    return { id: OWNER_BOOTSTRAP_STATE_DOC_ID, ...payload };
  }

  async createOwnerBootstrapSession(
    id: string,
    payload: Omit<StoredOwnerBootstrapSession, 'id'>,
  ): Promise<StoredOwnerBootstrapSession> {
    await this.ownerBootstrapSessions.doc(id).set(payload);
    return { id, ...payload };
  }

  async findOwnerBootstrapSessionById(id: string): Promise<StoredOwnerBootstrapSession | null> {
    const doc = await this.ownerBootstrapSessions.doc(id).get();
    return doc.exists ? this.toOwnerBootstrapSession(doc) : null;
  }

  async deleteOwnerBootstrapSession(id: string): Promise<void> {
    await this.ownerBootstrapSessions.doc(id).delete();
  }

  async findSessionById(id: string): Promise<StoredAuthSession | null> {
    const doc = await this.sessions.doc(id).get();
    return doc.exists ? this.toSession(doc) : null;
  }

  async updateSession(id: string, patch: Partial<Omit<StoredAuthSession, 'id'>>): Promise<void> {
    await this.sessions.doc(id).set(
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async revokeSession(id: string): Promise<void> {
    await this.updateSession(id, { revokedAt: new Date().toISOString() });
  }

  async revokeSessionsForUid(uid: string, plane: AuthPlane): Promise<void> {
    const snap = await this.sessions
      .where('uid', '==', uid)
      .where('plane', '==', plane)
      .where('revokedAt', '==', null)
      .get();

    if (snap.empty) {
      return;
    }

    const batch = getFirestoreDb().batch();
    const revokedAt = new Date().toISOString();
    snap.docs.forEach((doc) => {
      batch.set(
        doc.ref,
        {
          revokedAt,
          updatedAt: revokedAt,
        },
        { merge: true },
      );
    });
    await batch.commit();
  }

  private toCredential(
    doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
  ): StoredAuthCredential {
    return { id: doc.id, ...(doc.data() as Omit<StoredAuthCredential, 'id'>) };
  }

  private toSession(
    doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
  ): StoredAuthSession {
    return { id: doc.id, ...(doc.data() as Omit<StoredAuthSession, 'id'>) };
  }

  private toOwnerBootstrapState(
    doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
  ): StoredOwnerBootstrapState {
    return { id: doc.id, ...(doc.data() as Omit<StoredOwnerBootstrapState, 'id'>) };
  }

  private toOtpChallenge(
    doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
  ): StoredAuthOtpChallenge {
    return { id: doc.id, ...(doc.data() as Omit<StoredAuthOtpChallenge, 'id'>) };
  }

  private toOwnerBootstrapSession(
    doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
  ): StoredOwnerBootstrapSession {
    return { id: doc.id, ...(doc.data() as Omit<StoredOwnerBootstrapSession, 'id'>) };
  }
}
