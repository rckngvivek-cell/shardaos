import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  AUTH_MODE: z.enum(['mock', 'firebase']).optional(),
  STORAGE_DRIVER: z.enum(['memory', 'firestore']).optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional()
});

export type AuthMode = 'mock' | 'firebase';
export type StorageDriver = 'memory' | 'firestore';

export function getDefaultAuthMode(nodeEnv: string): AuthMode {
  return nodeEnv === 'production' ? 'firebase' : 'mock';
}

export function getDefaultStorageDriver(nodeEnv: string): StorageDriver {
  return nodeEnv === 'production' ? 'firestore' : 'memory';
}

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  AUTH_MODE: parsedEnv.AUTH_MODE ?? getDefaultAuthMode(parsedEnv.NODE_ENV),
  STORAGE_DRIVER: parsedEnv.STORAGE_DRIVER ?? getDefaultStorageDriver(parsedEnv.NODE_ENV)
};
