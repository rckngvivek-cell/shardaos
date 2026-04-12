import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { bootstrapOwner, getOwnerSession } from './owner-auth.controller.js';

const bootstrapOwnerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).optional(),
});

export const authRoutes = Router();

authRoutes.post('/owner/bootstrap', validate(bootstrapOwnerSchema), bootstrapOwner);
authRoutes.get('/owner/session', getOwnerSession);
