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

export const employeeRoutes = Router();

employeeRoutes.get('/', controller.listEmployees);
employeeRoutes.post('/', validate(createEmployeeSchema), controller.createEmployee);
employeeRoutes.delete('/:id', controller.deactivateEmployee);
