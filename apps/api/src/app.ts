import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { studentRoutes } from './modules/students/student.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { gradesRoutes } from './modules/grades/grades.routes.js';
import { schoolRoutes } from './modules/schools/school.routes.js';

export function createApp() {
  const app = express();

  // Core middleware
  app.use(express.json());
  app.use(requestId);

  // Public routes (no auth)
  app.use('/api/health', healthRoutes);

  // Protected routes (auth required)
  app.use('/api/students', authMiddleware, studentRoutes);
  app.use('/api/attendance', authMiddleware, attendanceRoutes);
  app.use('/api/grades', authMiddleware, gradesRoutes);
  app.use('/api/schools', authMiddleware, schoolRoutes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
