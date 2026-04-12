import { Router } from 'express';

import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { StudentsService } from './student.service.js';

export const studentsRouter = Router({ mergeParams: true });

const studentsService = new StudentsService();

studentsRouter.use(requireAuth);

studentsRouter.get('/', async (request, response, next) => {
  try {
    const schoolId = request.params.schoolId;
    const students = await studentsService.listStudents(schoolId);

    response.json({
      success: true,
      data: students,
      meta: {
        timestamp: new Date().toISOString(),
        version: env.apiVersion,
        requestId: response.locals.requestId,
      },
    });
  } catch (error) {
    next(error);
  }
});

studentsRouter.get('/:studentId', async (request, response, next) => {
  try {
    const schoolId = request.params.schoolId;
    const studentId = request.params.studentId;
    const student = await studentsService.getStudent(schoolId, studentId);

    response.json({
      success: true,
      data: student,
      meta: {
        timestamp: new Date().toISOString(),
        version: env.apiVersion,
        requestId: response.locals.requestId,
      },
    });
  } catch (error) {
    next(error);
  }
});

studentsRouter.post('/', async (request, response, next) => {
  try {
    if (!request.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const schoolId = request.params.schoolId;
    const student = await studentsService.createStudent(
      schoolId,
      request.user,
      request.body,
    );

    response.status(201).json({
      success: true,
      data: student,
      meta: {
        timestamp: new Date().toISOString(),
        version: env.apiVersion,
        requestId: response.locals.requestId,
      },
    });
  } catch (error) {
    next(error);
  }
});
