import type { Request, Response, NextFunction } from 'express';
import type { MarkAttendanceInput, BulkAttendanceInput } from '@school-erp/shared';
import { AttendanceService } from './attendance.service.js';
import { successResponse, paginatedResponse } from '../../lib/api-response.js';

const service = new AttendanceService();

export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { schoolId } = req.user!;
    const date = req.query.date as string | undefined;
    const grade = req.query.grade as string | undefined;
    const section = req.query.section as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const { records, total } = await service.list(schoolId, { date, grade, section, page, limit });
    res.json(paginatedResponse(records, total, page, limit, req.requestId));
  } catch (err) {
    next(err);
  }
}

export async function markAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const input: MarkAttendanceInput = req.body;
    const record = await service.mark(req.user!.schoolId, req.user!.uid, input);
    res.status(201).json(successResponse(record));
  } catch (err) {
    next(err);
  }
}

export async function markBulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const input: BulkAttendanceInput = req.body;
    const records = await service.markBulk(req.user!.schoolId, req.user!.uid, input);
    res.status(201).json(successResponse(records));
  } catch (err) {
    next(err);
  }
}
