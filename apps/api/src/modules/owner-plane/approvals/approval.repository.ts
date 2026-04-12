import type { Approval, ApprovalStatus } from '@school-erp/shared';
import { getFirestoreDb } from '../../../lib/firebase.js';

const COLLECTION = 'platform_approvals';

export class ApprovalRepository {
  private get col() {
    return getFirestoreDb().collection(COLLECTION);
  }

  async list(status?: ApprovalStatus): Promise<Approval[]> {
    const snap = await this.col.orderBy('createdAt', 'desc').get();
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Approval);
    return status ? all.filter((a) => a.status === status) : all;
  }

  async countPending(): Promise<number> {
    const snap = await this.col.where('status', '==', 'pending').get();
    return snap.size;
  }

  async findById(id: string): Promise<Approval | null> {
    const doc = await this.col.doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Approval) : null;
  }

  async updateDecision(id: string, status: 'approved' | 'denied', ownerUid: string): Promise<void> {
    await this.col.doc(id).update({
      status,
      approvedBy: ownerUid,
      updatedAt: new Date().toISOString(),
    });
  }
}
