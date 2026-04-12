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

  // ── Admin / Owner plane config ──
  /** Comma-separated IPs allowed to access /api/owner (empty = all in dev) */
  ADMIN_ALLOWED_IPS: process.env.ADMIN_ALLOWED_IPS ?? '',
  /** Session timeout in minutes for admin panel (default 15) */
  ADMIN_SESSION_TIMEOUT_MIN: parseInt(process.env.ADMIN_SESSION_TIMEOUT_MIN ?? '15', 10),
  /** Require MFA for admin plane (default true in prod) */
  ADMIN_MFA_REQUIRED: process.env.ADMIN_MFA_REQUIRED !== 'false',
  /** Bootstrap key used for one-time owner account creation */
  OWNER_BOOTSTRAP_KEY: process.env.OWNER_BOOTSTRAP_KEY ?? '',
} as const;
