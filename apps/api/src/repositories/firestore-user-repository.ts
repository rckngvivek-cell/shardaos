import type { CollectionReference } from 'firebase-admin/firestore';

import { getDb } from '../lib/firebase';
import type {
  CreateUserInput,
  User,
  UserQuery,
  UpdateUserInput
} from '../models/users';
import { AppError } from '../lib/app-error';
import type { UserRepository } from './user-repository';

export class FirestoreUserRepository implements UserRepository {
  private collection() {
    return getDb().collection('users') as CollectionReference<User>;
  }

  async create(input: CreateUserInput): Promise<string> {
    // Check for duplicate email
    const existing = await this.collection()
      .where('email', '==', input.email)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new AppError(409, 'USER_EMAIL_EXISTS', `User with email '${input.email}' already exists`);
    }

    const doc = this.collection().doc();
    const now = new Date().toISOString();

    const user: User = {
      userId: doc.id,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      schoolId: input.schoolId,
      permissions: input.permissions || [],
      createdAt: now,
      status: 'active'
    };

    await doc.set(user);
    return doc.id;
  }

  async get(userId: string): Promise<User | null> {
    const doc = await this.collection().doc(userId).get();
    return doc.exists ? (doc.data() ?? null) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection()
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() ?? null;
  }

  async update(userId: string, input: UpdateUserInput): Promise<User | null> {
    const existing = await this.get(userId);
    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with ID '${userId}' not found`);
    }

    const updated: User = {
      ...existing,
      ...input,
      email: existing.email,
      role: existing.role,
      schoolId: existing.schoolId
    };

    await this.collection().doc(userId).set(updated);
    return updated;
  }

  async list(query: UserQuery): Promise<{ users: User[]; total: number }> {
    let ref = this.collection() as FirebaseFirestore.Query<User>;

    if (query.schoolId) {
      ref = ref.where('schoolId', '==', query.schoolId);
    }

    if (query.role) {
      ref = ref.where('role', '==', query.role);
    }

    if (query.status) {
      ref = ref.where('status', '==', query.status);
    }

    const snapshot = await ref.get();
    let users = snapshot.docs.map((doc) => doc.data());

    // Sort by creation date descending
    users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = users.length;
    const paginated = users.slice(query.offset, query.offset + query.limit);

    return { users: paginated, total };
  }

  async updateLastLogin(userId: string): Promise<User | null> {
    const existing = await this.get(userId);
    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with ID '${userId}' not found`);
    }

    const updated: User = {
      ...existing,
      lastLogin: new Date().toISOString()
    };

    await this.collection().doc(userId).set(updated);
    return updated;
  }

  async delete(userId: string): Promise<boolean> {
    const existing = await this.get(userId);
    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with ID '${userId}' not found`);
    }

    await this.collection().doc(userId).delete();
    return true;
  }
}
