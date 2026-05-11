import type { CreateSchoolInput, School, SchoolServiceKey, SchoolServicePlanTier } from '@school-erp/shared';
import { getDocumentStore } from '../../lib/document-store.js';

interface CreateSchoolRecordInput {
  school: CreateSchoolInput;
  servicePlanTier: SchoolServicePlanTier;
  enabledServiceKeys: SchoolServiceKey[];
}

export class SchoolRepository {
  async findAll(): Promise<School[]> {
    const snap = await getDocumentStore().collection('schools').orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as School);
  }

  async findById(schoolId: string): Promise<School | null> {
    const doc = await getDocumentStore().collection('schools').doc(schoolId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as School;
  }

  async createFromOnboarding(schoolId: string, input: CreateSchoolRecordInput): Promise<School> {
    const now = new Date().toISOString();
    const school: Omit<School, 'id'> = {
      ...input.school,
      code: input.school.code.trim().toUpperCase(),
      studentCount: 0,
      servicePlanTier: input.servicePlanTier,
      enabledServiceKeys: input.enabledServiceKeys,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await getDocumentStore().collection('schools').doc(schoolId).set(school);
    return { id: schoolId, ...school };
  }

  async updateServicePlan(
    schoolId: string,
    servicePlanTier: SchoolServicePlanTier,
    enabledServiceKeys: SchoolServiceKey[],
  ): Promise<School> {
    await getDocumentStore().collection('schools').doc(schoolId).update({
      servicePlanTier,
      enabledServiceKeys,
      updatedAt: new Date().toISOString(),
    });

    return (await this.findById(schoolId)) as School;
  }
}
