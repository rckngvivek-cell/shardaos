import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../../middleware/validate.js';
import * as controller from './employee.controller.js';

const createEmployeeSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(2),
  department: z.string().min(2),
});

const updateEmployeeSchema = z.object({
  displayName: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
}).refine(
  (value) => value.displayName !== undefined || value.department !== undefined,
  { message: 'At least one employee field must be provided', path: ['displayName'] },
);

export const employeeRoutes = Router();

employeeRoutes.get('/', controller.listEmployees);
employeeRoutes.post('/', validate(createEmployeeSchema), controller.createEmployee);
employeeRoutes.patch('/:id', validate(updateEmployeeSchema), controller.updateEmployee);
employeeRoutes.post('/:id/activate', controller.activateEmployee);
employeeRoutes.post('/:id/sync', controller.syncEmployeeIdentity);
employeeRoutes.delete('/:id', controller.deactivateEmployee);
