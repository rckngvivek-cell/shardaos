import { Router } from 'express';
import * as controller from './school.controller.js';

export const schoolRoutes = Router();

schoolRoutes.get('/me', controller.getMySchool);
schoolRoutes.get('/me/services', controller.getMySchoolServices);
