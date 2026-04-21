import type { Request, Response, NextFunction } from 'express';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { successResponse } from '../../../lib/api-response.js';
import { EmployeeService } from './employee.service.js';

const service = new EmployeeService();

export async function listEmployees(_req: Request, res: Response, next: NextFunction) {
  try {
    const employees = await service.list();
    res.json(successResponse(employees));
  } catch (err) {
    next(err);
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const platformUser = req.platformUser;
    if (!platformUser) {
      throw new AppError(401, 'UNAUTHORIZED', 'Platform authentication required');
    }

    const input: CreateEmployeeInput = req.body;
    const employee = await service.create(platformUser.uid, input);

    await req.audit?.('EMPLOYEE_CREATED', 'employee', employee.id, {
      department: employee.department,
      onboardedBy: platformUser.uid,
    });

    res.status(201).json(successResponse(employee));
  } catch (err) {
    next(err);
  }
}

export async function deactivateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deactivate(req.params.id as string);
    await req.audit?.('EMPLOYEE_DEACTIVATED', 'employee', req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const input: UpdateEmployeeInput = req.body;
    const employee = await service.update(req.params.id as string, input);
    await req.audit?.('EMPLOYEE_UPDATED', 'employee', employee.id, {
      department: employee.department,
      displayName: employee.displayName,
    });
    res.json(successResponse(employee));
  } catch (err) {
    next(err);
  }
}

export async function activateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    await service.activate(req.params.id as string);
    await req.audit?.('EMPLOYEE_REACTIVATED', 'employee', req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function syncEmployeeIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await service.syncIdentity(req.params.id as string);
    await req.audit?.('EMPLOYEE_UPDATED', 'employee', employee.id, {
      syncType: 'identity',
      emailVerified: employee.emailVerified,
      platformAccessActive: employee.platformAccessActive,
      authProviderDisabled: employee.authProviderDisabled,
    });
    res.json(successResponse(employee));
  } catch (err) {
    next(err);
  }
}
