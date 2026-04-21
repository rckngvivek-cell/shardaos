import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import dotenv from 'dotenv';

const ENV_FILENAMES = ['.env', '.env.local'] as const;
const ENV_FILE_BLOCKED_KEYS = new Set([
  'OWNER_BOOTSTRAP_KEY',
  'OWNER_BOOTSTRAP_PASSWORD',
  'VITE_DEV_OWNER_PASSWORD',
  'VITE_DEV_EMPLOYEE_PASSWORD',
  'SMTP_PASS',
]);

function isWorkspaceRoot(dir: string): boolean {
  if (fs.existsSync(path.join(dir, '.git'))) {
    return true;
  }

  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { workspaces?: unknown };
    return parsed.workspaces !== undefined;
  } catch {
    return false;
  }
}

export function getEnvironmentSearchDirectories(startDir = process.cwd()): string[] {
  const directories: string[] = [];
  let currentDir = path.resolve(startDir);

  while (true) {
    directories.unshift(currentDir);
    if (isWorkspaceRoot(currentDir)) {
      return directories;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return directories;
    }

    currentDir = parentDir;
  }
}

/**
 * Loads `.env` then `.env.local` from the repo root toward the current
 * workspace, while preserving any variables already injected by the shell
 * or the test harness.
 */
export function applyEnvironmentFiles(
  startDir = process.cwd(),
  targetEnv: NodeJS.ProcessEnv = process.env,
  protectedKeys = new Set(Object.keys(targetEnv)),
  blockedKeys = ENV_FILE_BLOCKED_KEYS,
): string[] {
  const loadedFiles: string[] = [];

  for (const directory of getEnvironmentSearchDirectories(startDir)) {
    for (const filename of ENV_FILENAMES) {
      const filePath = path.join(directory, filename);
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const parsed = dotenv.parse(fs.readFileSync(filePath));
      for (const [key, value] of Object.entries(parsed)) {
        if (blockedKeys.has(key)) {
          continue;
        }

        if (!protectedKeys.has(key)) {
          targetEnv[key] = value;
        }
      }

      loadedFiles.push(filePath);
    }
  }

  return loadedFiles;
}

applyEnvironmentFiles();

export function loadSecretFromProcessOrFile(
  secretKey: string,
  fileKey: string,
  targetEnv: NodeJS.ProcessEnv = process.env,
): string {
  const inlineValue = targetEnv[secretKey]?.trim();
  if (inlineValue) {
    return inlineValue;
  }

  const filePath = targetEnv[fileKey]?.trim();
  if (!filePath) {
    return '';
  }

  try {
    return fs.readFileSync(path.resolve(filePath), 'utf8').trim();
  } catch (error) {
    throw new Error(
      `Unable to read ${fileKey} from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function loadSecretFromWindowsCredentialManager(
  credentialTarget: string,
  startDir = process.cwd(),
  spawn = spawnSync,
): string {
  if (!credentialTarget.trim()) {
    return '';
  }

  if (process.platform !== 'win32') {
    return '';
  }

  const repoRoot = getEnvironmentSearchDirectories(startDir)[0];
  const scriptPath = path.join(repoRoot, 'scripts', 'windows-credential-secret.ps1');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Unable to find Windows credential helper at ${scriptPath}`);
  }

  const result = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scriptPath,
      '-Action',
      'get',
      '-Target',
      credentialTarget,
    ],
    {
      encoding: 'utf8',
      windowsHide: true,
    },
  );

  if (result.status !== 0) {
    const stderr = (result.stderr || result.stdout || '').trim();
    throw new Error(
      `Unable to read secret from Windows Credential Manager target ${credentialTarget}: ${stderr || 'unknown error'}`,
    );
  }

  return result.stdout.trim();
}

export function loadSecretFromProcessFileOrWindowsCredential(
  secretKey: string,
  fileKey: string,
  credentialTargetKey: string,
  targetEnv: NodeJS.ProcessEnv = process.env,
  startDir = process.cwd(),
  spawn = spawnSync,
): string {
  const inlineValue = targetEnv[secretKey]?.trim();
  if (inlineValue) {
    return inlineValue;
  }

  const credentialTarget = targetEnv[credentialTargetKey]?.trim();
  if (credentialTarget) {
    return loadSecretFromWindowsCredentialManager(credentialTarget, startDir, spawn);
  }

  return loadSecretFromProcessOrFile(secretKey, fileKey, targetEnv);
}

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
  AUTH_MODE: ((process.env.AUTH_MODE ?? 'dev') === 'dev' ? 'dev' : 'jwt') as 'dev' | 'jwt',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',

  JWT_ACCESS_SECRET_FILE: process.env.JWT_ACCESS_SECRET_FILE ?? '',
  JWT_REFRESH_SECRET_FILE: process.env.JWT_REFRESH_SECRET_FILE ?? '',
  JWT_ACCESS_SECRET: loadSecretFromProcessOrFile('JWT_ACCESS_SECRET', 'JWT_ACCESS_SECRET_FILE'),
  JWT_REFRESH_SECRET: loadSecretFromProcessOrFile('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET_FILE'),
  JWT_ACCESS_TTL_MIN: parseInt(process.env.JWT_ACCESS_TTL_MIN ?? '15', 10),
  JWT_REFRESH_TTL_DAYS: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '7', 10),
  JWT_PLATFORM_REFRESH_TTL_HOURS: parseInt(process.env.JWT_PLATFORM_REFRESH_TTL_HOURS ?? '12', 10),
  AUTH_OTP_LENGTH: parseInt(process.env.AUTH_OTP_LENGTH ?? '6', 10),
  AUTH_OTP_TTL_MIN: parseInt(process.env.AUTH_OTP_TTL_MIN ?? '10', 10),
  AUTH_OTP_MAX_ATTEMPTS: parseInt(process.env.AUTH_OTP_MAX_ATTEMPTS ?? '5', 10),
  AUTH_OTP_MAX_RESENDS: parseInt(process.env.AUTH_OTP_MAX_RESENDS ?? '3', 10),
  AUTH_OTP_RESEND_COOLDOWN_SEC: parseInt(process.env.AUTH_OTP_RESEND_COOLDOWN_SEC ?? '45', 10),
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS_FILE: process.env.SMTP_PASS_FILE ?? '',
  SMTP_PASS: loadSecretFromProcessOrFile('SMTP_PASS', 'SMTP_PASS_FILE'),
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ?? '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME ?? 'ShardaOS',

  // ── Admin / Owner plane config ──
  /** Comma-separated IPs allowed to access /api/owner (empty = all in dev) */
  ADMIN_ALLOWED_IPS: process.env.ADMIN_ALLOWED_IPS ?? '',
  /** Session timeout in minutes for admin panel (default 15) */
  ADMIN_SESSION_TIMEOUT_MIN: parseInt(process.env.ADMIN_SESSION_TIMEOUT_MIN ?? '15', 10),
  /** Require MFA for admin plane (default true in prod) */
  ADMIN_MFA_REQUIRED: process.env.ADMIN_MFA_REQUIRED !== 'false',
  /** File path for the bootstrap key when it is sourced outside repo env files */
  OWNER_BOOTSTRAP_KEY_FILE: process.env.OWNER_BOOTSTRAP_KEY_FILE ?? '',
  /** Windows Credential Manager target name for the bootstrap key */
  OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET: process.env.OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET ?? '',
  /** Bootstrap key used for one-time owner account creation */
  OWNER_BOOTSTRAP_KEY: loadSecretFromProcessFileOrWindowsCredential(
    'OWNER_BOOTSTRAP_KEY',
    'OWNER_BOOTSTRAP_KEY_FILE',
    'OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET',
  ),
  /** Lifetime of a short-lived bootstrap session created from the bootstrap key */
  OWNER_BOOTSTRAP_SESSION_TTL_MIN: parseInt(process.env.OWNER_BOOTSTRAP_SESSION_TTL_MIN ?? '10', 10),
} as const;
