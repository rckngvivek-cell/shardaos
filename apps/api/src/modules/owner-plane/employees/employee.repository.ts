import type { Employee } from '@school-erp/shared';
import { getFirestoreDb } from '../../../lib/firebase.js';

const COLLECTION = 'platform_employees';

export class EmployeeRepository {
  private get col() {
    return getFirestoreDb().collection(COLLECTION);
  }

  async countActive(): Promise<number> {
    const snap = await this.col.where('isActive', '==', true).get();
    return snap.size;
  }

  async findAll(): Promise<Employee[]> {
    const snap = await this.col.orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Employee);
  }

  async findById(id: string): Promise<Employee | null> {
    const doc = await this.col.doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Employee) : null;
  }

  async findByUid(uid: string): Promise<Employee | null> {
    const snap = await this.col.where('uid', '==', uid).limit(1).get();
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Employee);
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const snap = await this.col.where('email', '==', email).limit(1).get();
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Employee);
  }

  async create(data: Omit<Employee, 'id'>): Promise<Employee> {
    const ref = await this.col.add(data);
    return { id: ref.id, ...data };
  }

  async update(id: string, data: Partial<Employee>): Promise<void> {
    await this.col.doc(id).update({ ...data, updatedAt: new Date().toISOString() });
  }

  async deactivate(id: string): Promise<void> {
    await this.col.doc(id).update({ isActive: false, updatedAt: new Date().toISOString() });
  }

  async activate(id: string): Promise<void> {
    await this.col.doc(id).update({ isActive: true, updatedAt: new Date().toISOString() });
  }
}
