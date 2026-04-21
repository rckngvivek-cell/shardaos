import { Router } from 'express';
import { createStudentSchema, updateStudentSchema } from '@school-erp/shared';
import { validate } from '../../middleware/validate.js';
import * as controller from './student.controller.js';

export const studentRoutes = Router();

studentRoutes.get('/', controller.listStudents);
studentRoutes.get('/:id', controller.getStudent);
studentRoutes.post('/', validate(createStudentSchema), controller.createStudent);
studentRoutes.put('/:id', validate(updateStudentSchema), controller.updateStudent);
studentRoutes.delete('/:id', controller.deleteStudent);
