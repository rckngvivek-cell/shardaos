import type {
  CreateUserInput,
  User,
  UserQuery,
  UpdateUserInput
} from '../models/users';

export interface UserRepository {
  create(input: CreateUserInput): Promise<string>;
  get(userId: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  update(userId: string, input: UpdateUserInput): Promise<User | null>;
  list(query: UserQuery): Promise<{ users: User[]; total: number }>;
  updateLastLogin(userId: string): Promise<User | null>;
  delete(userId: string): Promise<boolean>;
}
