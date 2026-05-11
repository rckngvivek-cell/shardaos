import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { studentRoutes } from './modules/students/student.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { gradesRoutes } from './modules/grades/grades.routes.js';
import { schoolRoutes } from './modules/schools/school.routes.js';
import { admissionRoutes } from './modules/admissions/admission.routes.js';
import { ownerPlaneRoutes } from './modules/owner-plane/owner-plane.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { ipWhitelist, ownerAuthMiddleware, auditLogger } from './middleware/owner-plane/index.js';

export function createApp() {
  const app = express();

  // Core middleware
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));
  app.use(requestId);

  // Expose the same health contract under both app and probe endpoints so
  // local smoke tests and deployment checks stay aligned.
  app.use('/api/health', healthRoutes);
  app.use('/health', healthRoutes);

  // Public routes (no auth)
  app.use('/api/auth', authRoutes);

  // Protected routes (auth required)
  app.use('/api/students', authMiddleware, studentRoutes);
  app.use('/api/attendance', authMiddleware, attendanceRoutes);
  app.use('/api/grades', authMiddleware, gradesRoutes);
  app.use('/api/schools', authMiddleware, schoolRoutes);
  app.use('/api/admissions', authMiddleware, admissionRoutes);

  // Owner plane (owner / employee)
  app.use('/api/owner', ipWhitelist, ownerAuthMiddleware, auditLogger, ownerPlaneRoutes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
