import { Router } from 'express';
import * as controller from './owner.controller.js';

export const ownerRoutes = Router();

ownerRoutes.get('/me', controller.getOwnerProfile);
ownerRoutes.get('/summary', controller.getOwnerSummary);
