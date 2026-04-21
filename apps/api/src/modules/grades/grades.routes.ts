import { Router } from 'express';
import { createGradeSchema } from '@school-erp/shared';
import { validate } from '../../middleware/validate.js';
import * as controller from './grades.controller.js';

export const gradesRoutes = Router();

gradesRoutes.get('/', controller.listGrades);
gradesRoutes.get('/student/:studentId', controller.getStudentGrades);
gradesRoutes.post('/', validate(createGradeSchema), controller.createGrade);
