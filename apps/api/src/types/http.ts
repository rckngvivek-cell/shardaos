import type { Request } from 'express';

export type AppRequest = Request & {
  requestId?: string;
  user?: {
    uid: string;
    email?: string;
    role: string;
  };
};
