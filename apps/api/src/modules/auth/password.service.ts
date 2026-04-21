import crypto from 'node:crypto';

const SCRYPT_KEY_LENGTH = 64;
export const OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH = 14;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [algorithm, salt, expectedKey] = passwordHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedKey) {
    return false;
  }

  const actualKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedKey, 'hex');

  if (actualKey.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualKey, expectedBuffer);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTemporaryPassword(prefix = 'temp'): string {
  return `${prefix}-${crypto.randomBytes(12).toString('base64url')}Aa1!`;
}

export function getOwnerBootstrapPasswordError(password: string): string | null {
  if (password.length < OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH) {
    return `Owner password must be at least ${OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (!/[a-z]/.test(password)) {
    return 'Owner password must include a lowercase letter.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Owner password must include an uppercase letter.';
  }

  if (!/\d/.test(password)) {
    return 'Owner password must include a number.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Owner password must include a symbol.';
  }

  return null;
}

export function compareSecret(candidate: string, expected: string): boolean {
  const actualBuffer = Buffer.from(candidate, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
