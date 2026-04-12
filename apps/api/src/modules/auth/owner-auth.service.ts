import type { DecodedIdToken } from 'firebase-admin/auth';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { getFirebaseAuth } from '../../lib/firebase.js';

interface BootstrapOwnerInput {
  email: string;
  password: string;
  displayName?: string;
}

export class OwnerAuthService {
  async bootstrapOwner(input: BootstrapOwnerInput) {
    if (!env.OWNER_BOOTSTRAP_KEY) {
      throw new AppError(503, 'BOOTSTRAP_DISABLED', 'Owner bootstrap key is not configured');
    }

    const auth = getFirebaseAuth();
    const existingOwner = await this.findExistingOwnerEmail();
    if (existingOwner && existingOwner.toLowerCase() !== input.email.toLowerCase()) {
      throw new AppError(409, 'OWNER_EXISTS', 'An owner account already exists');
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(input.email);
      await auth.updateUser(userRecord.uid, {
        password: input.password,
        displayName: input.displayName ?? userRecord.displayName ?? undefined,
        emailVerified: true,
        disabled: false,
      });
    } catch {
      userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        emailVerified: true,
      });
    }

    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'owner',
      custom_role: 'owner',
      plane: 'platform',
      mfa_verified: env.NODE_ENV !== 'production',
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email ?? input.email,
      role: 'owner' as const,
      plane: 'platform' as const,
    };
  }

  async verifyOwnerFromBearer(authorizationHeader?: string) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    const token = authorizationHeader.slice(7);
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);

    this.assertOwner(decoded);

    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      role: 'owner' as const,
      plane: 'platform' as const,
    };
  }

  private assertOwner(decoded: DecodedIdToken): void {
    const role = decoded.role ?? decoded.custom_role;
    if (role !== 'owner') {
      throw new AppError(403, 'OWNER_ONLY', 'Owner account required');
    }
  }

  private async findExistingOwnerEmail(): Promise<string | null> {
    const auth = getFirebaseAuth();
    let pageToken: string | undefined;

    do {
      const page = await auth.listUsers(1000, pageToken);
      const owner = page.users.find((u) => {
        const claims = u.customClaims ?? {};
        const role = claims.role ?? claims.custom_role;
        return role === 'owner';
      });

      if (owner?.email) {
        return owner.email;
      }

      pageToken = page.pageToken;
    } while (pageToken);

    return null;
  }
}
