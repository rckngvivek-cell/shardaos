import express from 'express';
import request from 'supertest';

import { env } from '../../src/config/env.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import { authMiddleware } from '../../src/middleware/auth.js';

describe('authMiddleware', () => {
  const mutableEnv = env as unknown as {
    AUTH_MODE: 'dev' | 'jwt';
  };
  const originalAuthMode = env.AUTH_MODE;

  beforeEach(() => {
    mutableEnv.AUTH_MODE = 'dev';
  });

  afterAll(() => {
    mutableEnv.AUTH_MODE = originalAuthMode;
  });

  function createTestApp() {
    const app = express();
    app.get('/secure', authMiddleware, (req, res) => {
      res.json(req.user);
    });
    app.use(errorHandler);
    return app;
  }

  it('honors the selected dev employee role and school scope from request headers', async () => {
    const response = await request(createTestApp())
      .get('/secure')
      .set('x-dev-role', 'teacher')
      .set('x-dev-email', 'teacher@dev.school')
      .set('x-dev-uid', 'dev-teacher-001')
      .set('x-school-id', 'school-42');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      uid: 'dev-teacher-001',
      email: 'teacher@dev.school',
      role: 'teacher',
      schoolId: 'school-42',
      plane: 'tenant',
    });
  });

  it('falls back to the default tenant dev identity when headers are missing', async () => {
    const response = await request(createTestApp()).get('/secure');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      uid: 'dev-user-001',
      email: 'admin@dev.school',
      role: 'school_admin',
      schoolId: 'dev-school-001',
      plane: 'tenant',
    });
  });
});
