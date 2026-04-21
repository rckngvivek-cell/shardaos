import type { School } from '@school-erp/shared';
import { getFirestoreDb } from '../../lib/firebase.js';

export class SchoolRepository {
  async findAll(): Promise<School[]> {
    const snap = await getFirestoreDb().collection('schools').orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as School);
  }

  async findById(schoolId: string): Promise<School | null> {
    const doc = await getFirestoreDb().collection('schools').doc(schoolId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as School;
  }
}
