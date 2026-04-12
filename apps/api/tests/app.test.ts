import request from 'supertest';

import { app } from '../src/app.js';

describe('school-erp api', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('creates and lists students in dev mode', async () => {
    const createResponse = await request(app)
      .post('/api/v1/schools/demo-school/students')
      .set('x-user-id', 'principal-001')
      .set('x-user-role', 'principal')
      .send({
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: '2012-05-15',
        rollNumber: '12501',
        class: 5,
        section: 'A',
        status: 'active',
        enrollmentDate: '2025-04-01',
        contact: {
          parentName: 'Vikram Sharma',
          parentEmail: 'vikram.sharma@email.com',
          parentPhone: '+919876543210',
        },
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.firstName).toBe('Aarav');

    const listResponse = await request(app)
      .get('/api/v1/schools/demo-school/students')
      .set('x-user-id', 'principal-001')
      .set('x-user-role', 'principal');

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].studentId).toBeDefined();
  });

  it('returns validation errors for invalid student payloads', async () => {
    const response = await request(app)
      .post('/api/v1/schools/demo-school/students')
      .set('x-user-id', 'principal-001')
      .send({
        firstName: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
