const requiredEnv = (key: string): string => {
  const val = process.env[key];
  if (!val && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val ?? '';
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  AUTH_MODE: (process.env.AUTH_MODE ?? 'dev') as 'dev' | 'firebase',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
} as const;
