import { Router } from 'express';

import { createHealthRouter } from './health';
import { createStudentsRouter } from './students';

import { StudentService } from '../services/student-service';

export function createApiRouter(studentService: StudentService): Router {
  const router = Router();

  router.use(createHealthRouter());
  router.use('/schools/:schoolId/students', createStudentsRouter(studentService));

  return router;
}
