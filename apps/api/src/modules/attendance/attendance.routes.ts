import { Router } from 'express';
import { markAttendanceSchema, bulkAttendanceSchema } from '@school-erp/shared';
import { validate } from '../../middleware/validate.js';
import * as controller from './attendance.controller.js';

export const attendanceRoutes = Router();

attendanceRoutes.get('/', controller.listAttendance);
attendanceRoutes.post('/', validate(markAttendanceSchema), controller.markAttendance);
attendanceRoutes.post('/bulk', validate(bulkAttendanceSchema), controller.markBulkAttendance);
