import type { CollectionReference } from 'firebase-admin/firestore';

import { getDb } from '../lib/firebase';
import type {
  CreateSchoolInput,
  School,
  SchoolQuery,
  UpdateSchoolInput
} from '../models/schools';
import { AppError } from '../lib/app-error';
import type { SchoolRepository } from './school-repository';

export class FirestoreSchoolRepository implements SchoolRepository {
  private collection() {
    return getDb().collection('schools') as CollectionReference<School>;
  }

  async create(input: CreateSchoolInput): Promise<string> {
    // Check for duplicate email
    const existing = await this.collection()
      .where('email', '==', input.email)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new AppError(409, 'SCHOOL_EMAIL_EXISTS', `School with email '${input.email}' already exists`);
    }

    const doc = this.collection().doc();
    const now = new Date().toISOString();

    const school: School = {
      schoolId: doc.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      pinCode: input.pinCode,
      principalName: input.principalName,
      schoolRegistrationNumber: input.schoolRegistrationNumber,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    await doc.set(school);
    return doc.id;
  }

  async get(schoolId: string): Promise<School | null> {
    const doc = await this.collection().doc(schoolId).get();
    return doc.exists ? (doc.data() ?? null) : null;
  }

  async update(schoolId: string, input: UpdateSchoolInput): Promise<School | null> {
    const existing = await this.get(schoolId);
    if (!existing) {
      throw new AppError(404, 'SCHOOL_NOT_FOUND', `School with ID '${schoolId}' not found`);
    }

    // Check for duplicate email if email is being updated
    if (input.email && input.email !== existing.email) {
      const duplicate = await this.collection()
        .where('email', '==', input.email)
        .limit(1)
        .get();

      if (!duplicate.empty) {
        throw new AppError(409, 'SCHOOL_EMAIL_EXISTS', `School with email '${input.email}' already exists`);
      }
    }

    const updated: School = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString()
    };

    await this.collection().doc(schoolId).set(updated);
    return updated;
  }

  async list(query: SchoolQuery): Promise<{ schools: School[]; total: number }> {
    let ref = this.collection() as FirebaseFirestore.Query<School>;

    if (query.city) {
      ref = ref.where('city', '==', query.city);
    }

    if (query.state) {
      ref = ref.where('state', '==', query.state);
    }

    if (query.status) {
      ref = ref.where('status', '==', query.status);
    }

    const snapshot = await ref.get();
    let schools = snapshot.docs.map((doc) => doc.data());

    // Sort by createdAt descending
    schools.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = schools.length;
    const paginated = schools.slice(query.offset, query.offset + query.limit);

    return { schools: paginated, total };
  }

  async delete(schoolId: string): Promise<boolean> {
    const existing = await this.get(schoolId);
    if (!existing) {
      throw new AppError(404, 'SCHOOL_NOT_FOUND', `School with ID '${schoolId}' not found`);
    }

    await this.collection().doc(schoolId).delete();
    return true;
  }
}
