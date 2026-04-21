import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { AuthService } from './auth.service.js';

interface BootstrapOwnerInput {
  bootstrapSessionToken: string;
  email: string;
  password: string;
  displayName?: string;
}

interface BootstrapRequestMeta {
  ipAddress: string;
  userAgent: string;
}

export class OwnerAuthService {
  private readonly authService = new AuthService();

  async getOwnerBootstrapStatus() {
    return this.authService.getOwnerBootstrapStatus();
  }

  async createOwnerBootstrapSession(bootstrapKey: string, requestMeta: BootstrapRequestMeta) {
    if (!env.OWNER_BOOTSTRAP_KEY) {
      throw new AppError(503, 'BOOTSTRAP_DISABLED', 'Owner bootstrap key is not configured');
    }

    return this.authService.createOwnerBootstrapSession(bootstrapKey, requestMeta);
  }

  async bootstrapOwner(input: BootstrapOwnerInput, requestMeta: BootstrapRequestMeta) {
    return this.authService.bootstrapOwner(input, requestMeta);
  }

  async verifyOwnerFromBearer(authorizationHeader?: string) {
    const owner = await this.authService.getSessionFromAccessToken(authorizationHeader);
    if (owner.role !== 'owner' || owner.plane !== 'platform') {
      throw new AppError(403, 'OWNER_ONLY', 'Owner account required');
    }

    return {
      uid: owner.uid,
      email: owner.email,
      role: 'owner' as const,
      plane: 'platform' as const,
    };
  }
}
