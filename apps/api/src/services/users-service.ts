import { AppError } from '../lib/app-error';
import {
  createUserSchema,
  userQuerySchema,
  updateUserSchema
} from '../models/users';
import type { UserRepository } from '../repositories/user-repository';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(input: unknown) {
    const payload = createUserSchema.parse(input);
    return this.repository.create(payload);
  }

  async get(userId: string) {
    const user = await this.repository.get(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with ID '${userId}' not found`);
    }
    return user;
  }

  async getByEmail(email: string) {
    const user = await this.repository.getByEmail(email);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with email '${email}' not found`);
    }
    return user;
  }

  async update(userId: string, input: unknown) {
    const payload = updateUserSchema.parse(input);
    const user = await this.repository.update(userId, payload);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with ID '${userId}' not found`);
    }
    return user;
  }

  async list(input: unknown) {
    const query = userQuerySchema.parse(input);
    return this.repository.list(query);
  }

  async updateLastLogin(userId: string) {
    const user = await this.repository.updateLastLogin(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', `User with ID '${userId}' not found`);
    }
    return user;
  }

  async delete(userId: string) {
    return this.repository.delete(userId);
  }
}
