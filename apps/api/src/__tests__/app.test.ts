import { createApp } from '../app.js';
import request from 'supertest';

describe('API Health Check', () => {
  const app = createApp();

  it('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/students without auth returns 401', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});
