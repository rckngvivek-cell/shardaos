import request from 'supertest';

import { createApp } from '../app';

describe('School ERP API', () => {
  const app = createApp();
  const authHeader = { Authorization: 'Bearer demo-admin-token' };

  it('returns health status without auth', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('rejects protected routes without auth', async () => {
    const response = await request(app).get('/api/v1/schools/demo-school/students');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('lists seeded students', async () => {
    const response = await request(app)
      .get('/api/v1/schools/demo-school/students')
      .set(authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.total).toBe(2);
  });

  it('creates and retrieves a student', async () => {
    const payload = {
      firstName: 'Nitya',
      lastName: 'Singh',
      dob: '2013-01-14',
      rollNumber: '12503',
      class: 5,
      section: 'A',
      contact: {
        parentName: 'Amit Singh',
        parentEmail: 'amit.singh@example.com',
        parentPhone: '+919900112233'
      }
    };

    const createResponse = await request(app)
      .post('/api/v1/schools/demo-school/students')
      .set(authHeader)
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.firstName).toBe('Nitya');

    const getResponse = await request(app)
      .get(`/api/v1/schools/demo-school/students/${createResponse.body.data.studentId}`)
      .set(authHeader);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.lastName).toBe('Singh');
  });

  it('searches students by query', async () => {
    const response = await request(app)
      .get('/api/v1/schools/demo-school/students/search?q=aarav')
      .set(authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].firstName).toBe('Aarav');
  });

  it('soft deletes a student', async () => {
    const createResponse = await request(app)
      .post('/api/v1/schools/demo-school/students')
      .set(authHeader)
      .send({
        firstName: 'Delete',
        lastName: 'Me',
        dob: '2013-01-14',
        rollNumber: '12999',
        class: 5,
        section: 'A',
        contact: {
          parentName: 'Parent User',
          parentPhone: '+919811223344'
        }
      });

    const deleteResponse = await request(app)
      .delete(`/api/v1/schools/demo-school/students/${createResponse.body.data.studentId}`)
      .set(authHeader);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);
    expect(deleteResponse.body.data.archivedAt).toBeDefined();
  });

  it('lists seeded attendance records', async () => {
    const response = await request(app)
      .get('/api/v1/schools/demo-school/attendance')
      .set(authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta.total).toBe(response.body.data.length);
  });

  it('creates attendance records and filters them by date', async () => {
    const createResponse = await request(app)
      .post('/api/v1/schools/demo-school/attendance')
      .set(authHeader)
      .send({
        date: '2026-04-09',
        class: 5,
        section: 'A',
        period: 1,
        entries: [
          { studentId: 'std_demo_aarav_sharma', status: 'present' },
          { studentId: 'std_demo_zara_khan', status: 'leave', remarks: 'Medical' }
        ]
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.attendanceId).toBeDefined();
    expect(createResponse.body.data.entries).toHaveLength(2);

    const filteredResponse = await request(app)
      .get('/api/v1/schools/demo-school/attendance?date=2026-04-09&class=5&section=A')
      .set(authHeader);

    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body.data).toHaveLength(1);
    expect(filteredResponse.body.data[0].date).toBe('2026-04-09');
  });
});
