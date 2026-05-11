import type { Approval, ApprovalStatus } from '@school-erp/shared';
import { getDocumentStore } from '../../../lib/document-store.js';

const COLLECTION = 'platform_approvals';

export class ApprovalRepository {
  private get col() {
    return getDocumentStore().collection(COLLECTION);
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

  async create(data: Omit<Approval, 'id'>): Promise<Approval> {
    const ref = await this.col.add(data);
    return { id: ref.id, ...data };
  }

  async updateDecision(
    id: string,
    status: 'approved' | 'denied',
    ownerUid: string,
    decisionNote?: string,
  ): Promise<void> {
    await this.col.doc(id).update({
      status,
      approvedBy: ownerUid,
      decisionNote,
      updatedAt: new Date().toISOString(),
    });
  }
}
