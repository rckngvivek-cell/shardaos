import express from 'express';

import { env } from './config/env';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestContext } from './middleware/request-context';
import { createAttendanceRepository, createStudentRepository } from './repositories/repository-factory';
import { createAttendanceRouter, createAttendancePR1Router } from './routes/attendance';
import { createHealthRouter } from './routes/health';
import { createSchoolsRouter } from './routes/schools';
import { createStudentsRouter, createStudentsPR1Router } from './routes/students';
import { createExamsRouter } from './routes/exams';
import { createSubmissionsRouter } from './routes/submissions';
import { createResultsRouter } from './routes/results';
import { AttendanceService } from './services/attendance-service';
import { StudentService } from './services/student-service';

// Lazy-load optional modules that require Firestore
// These are only loaded when actually needed, allowing API to start in mock/in-memory mode
let cachedBulkImportRouter: any = null;
let cachedSmsRouter: any = null;
let cachedTimetableRouter: any = null;

function getBulkImportRouter() {
  if (!cachedBulkImportRouter) {
    cachedBulkImportRouter = require('./modules/bulk-import').bulkImportRouter;
  }
  return cachedBulkImportRouter;
}

function getSmsRouter() {
  if (!cachedSmsRouter) {
    cachedSmsRouter = require('./modules/sms').smsRouter;
  }
  return cachedSmsRouter;
}

function getTimetableRouter() {
  if (!cachedTimetableRouter) {
    cachedTimetableRouter = require('./modules/timetable').timetableRouter;
  }
  return cachedTimetableRouter;
}

export function createApp() {
  const repository = createStudentRepository(env.STORAGE_DRIVER);
  const studentService = new StudentService(repository);
  const attendanceService = new AttendanceService(createAttendanceRepository(env.STORAGE_DRIVER));
  const app = express();

  app.use(express.json());
  app.use(requestContext);
  app.use(authMiddleware);

  // PR #1 - Core API Routes (flat endpoints)
  app.use('/api/v1/schools', createSchoolsRouter());
  app.use('/api/v1/students', createStudentsPR1Router());
  app.use('/api/v1/attendance', createAttendancePR1Router());

  // PR #7 - Bulk Import Routes (lazy-loaded)
  try {
    app.use('/api/v1/schools', getBulkImportRouter());
  } catch (error) {
    console.warn('⚠️  Bulk Import module failed to load (Firestore required)');
  }

  // PR #8 - SMS Notifications Routes (lazy-loaded)
  try {
    app.use('/api/v1/schools', getSmsRouter());
  } catch (error) {
    console.warn('⚠️  SMS module failed to load (Firestore required)');
  }

  // PR #11 - Timetable Management Routes (lazy-loaded)
  try {
    app.use('/api/v1/schools', getTimetableRouter());
  } catch (error) {
    console.warn('⚠️  Timetable module failed to load (Firestore required)');
  }

  // Phase 2 - Exam Module Routes
  app.use('/api/v1/exams', createExamsRouter());
  app.use('/api/v1/submissions', createSubmissionsRouter());
  app.use('/api/v1/results', createResultsRouter());

  // Health check
  app.use('/api/v1', createHealthRouter());

  // Legacy nested routes (backward compatibility)
  app.use('/api/v1/schools/:schoolId/attendance', createAttendanceRouter(attendanceService));
  app.use('/api/v1/schools/:schoolId/students', createStudentsRouter(studentService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
