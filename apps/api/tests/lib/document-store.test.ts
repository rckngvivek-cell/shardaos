import { getDocumentStore, resetDocumentStoreForTests } from '../../src/lib/document-store.js';

describe('document store', () => {
  beforeEach(() => {
    resetDocumentStoreForTests();
  });

  it('stores, queries, sorts, and counts documents', async () => {
    const store = getDocumentStore();
    const schools = store.collection('schools');

    await schools.doc('school-a').set({ name: 'A', isActive: true, createdAt: '2026-04-01T00:00:00.000Z' });
    await schools.doc('school-b').set({ name: 'B', isActive: true, createdAt: '2026-04-02T00:00:00.000Z' });
    await schools.doc('school-c').set({ name: 'C', isActive: false, createdAt: '2026-04-03T00:00:00.000Z' });

    const count = await schools.where('isActive', '==', true).count().get();
    const snap = await schools.where('isActive', '==', true).orderBy('createdAt', 'desc').limit(1).get();

    expect(count.data().count).toBe(2);
    expect(snap.docs.map((doc) => doc.id)).toEqual(['school-b']);
  });

  it('applies transaction writes only after the callback succeeds', async () => {
    const store = getDocumentStore();
    const stateRef = store.collection('owner_bootstrap_state').doc('primary');
    const credentialRef = store.collection('auth_credentials').doc('platform:owner@example.com');

    const owner = await store.runTransaction(async (transaction) => {
      const stateDoc = await transaction.get(stateRef);
      expect(stateDoc.exists).toBe(false);

      transaction.set(stateRef, { consumedAt: '2026-04-01T00:00:00.000Z' });
      transaction.set(credentialRef, { email: 'owner@example.com', role: 'owner' });
      return { email: 'owner@example.com' };
    });

    expect(owner.email).toBe('owner@example.com');
    expect((await stateRef.get()).exists).toBe(true);
    expect((await credentialRef.get()).get('role')).toBe('owner');
  });
});
