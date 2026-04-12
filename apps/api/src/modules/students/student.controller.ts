import type { Request, Response, NextFunction } from 'express';
import type { CreateStudentInput, UpdateStudentInput } from '@school-erp/shared';
import { StudentService } from './student.service.js';
import { successResponse, paginatedResponse } from '../../lib/api-response.js';

const service = new StudentService();

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { schoolId } = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const grade = req.query.grade as string | undefined;
    const section = req.query.section as string | undefined;

    const { students, total } = await service.list(schoolId, { page, limit, grade, section });
    res.json(paginatedResponse(students, total, page, limit, req.requestId));
  } catch (err) {
    next(err);
  }
}

export async function getStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await service.getById(req.user!.schoolId, req.params.id as string);
    res.json(successResponse(student));
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateStudentInput = req.body;
    const student = await service.create(req.user!.schoolId, input);
    res.status(201).json(successResponse(student));
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const input: UpdateStudentInput = req.body;
    const student = await service.update(req.user!.schoolId, req.params.id as string, input);
    res.json(successResponse(student));
  } catch (err) {
    next(err);
  }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try {
    await service.delete(req.user!.schoolId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
