import type { Request, Response, NextFunction } from 'express';
import type { CreateGradeInput } from '@school-erp/shared';
import { GradesService } from './grades.service.js';
import { successResponse, paginatedResponse } from '../../lib/api-response.js';

const service = new GradesService();

export async function listGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { schoolId } = req.user!;
    const subject = req.query.subject as string | undefined;
    const examName = req.query.examName as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { grades, total } = await service.list(schoolId, { subject, examName, page, limit });
    res.json(paginatedResponse(grades, total, page, limit, req.requestId));
  } catch (err) {
    next(err);
  }
}

export async function getStudentGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const grades = await service.getByStudent(req.user!.schoolId, req.params.studentId as string);
    res.json(successResponse(grades));
  } catch (err) {
    next(err);
  }
}

export async function createGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateGradeInput = req.body;
    const grade = await service.create(req.user!.schoolId, req.user!.uid, input);
    res.status(201).json(successResponse(grade));
  } catch (err) {
    next(err);
  }
}
