import type { AuditLog } from '@school-erp/shared';
import { getDocumentStore } from '../../../lib/document-store.js';

const COLLECTION = 'platform_audit_log';

export class AuditLogRepository {
  private get col() {
    return getDocumentStore().collection(COLLECTION);
  }

  async listRecent(limit = 40): Promise<AuditLog[]> {
    const snap = await this.col.orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AuditLog);
  }

  async listSince(sinceIso: string, limit = 200): Promise<AuditLog[]> {
    const snap = await this.col
      .where('timestamp', '>=', sinceIso)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AuditLog);
  }
}
