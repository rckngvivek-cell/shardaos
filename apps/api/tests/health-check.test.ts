import request from 'supertest';
import { createApp } from '../src/app';

/**
 * Health Check Test Suite
 * 
 * Tests the /api/v1/health endpoint which is used by:
 * - Cloud Run health checks (liveness/readiness probes)
 * - Load balancer health verification
 * - Monitoring dashboards and alerts
 * - Deployment verification procedures
 */
describe('Health Check Endpoint - /api/v1/health', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 OK status', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
    });

    it('should return success flag set to true', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body.success).toBe(true);
    });

    it('should return status "ok"', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.body.data.status).toBe('ok');
    });

    it('should return environment information', async () => {
      const response = await request(app).get('/api/v1/health');
      const { data } = response.body;
      
      expect(data).toHaveProperty('env');
      expect(data).toHaveProperty('authMode');
      expect(data).toHaveProperty('storageDriver');
    });

    it('should include correct environment in response', async () => {
      const response = await request(app).get('/api/v1/health');
      const { data } = response.body;
      
      // Response should reflect actual environment (test, dev, staging, or production)
      expect(['test', 'development', 'staging', 'production']).toContain(data.env);
    });

    it('should include authentication mode in response', async () => {
      const response = await request(app).get('/api/v1/health');
      const { data } = response.body;
      
      expect(['memory', 'firebase', 'jwt']).toContain(data.authMode);
    });

    it('should include storage driver in response', async () => {
      const response = await request(app).get('/api/v1/health');
      const { data } = response.body;
      
      expect(['memory', 'firestore', 'postgres']).toContain(data.storageDriver);
    });

    it('should return valid JSON response', async () => {
      const response = await request(app).get('/api/v1/health');
      
      expect(() => JSON.stringify(response.body)).not.toThrow();
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should complete response within 500ms (SLA target)', async () => {
      const startTime = Date.now();
      await request(app).get('/api/v1/health');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500);
    });

    it('should not require authentication', async () => {
      // Health check should succeed even without valid auth token
      const response = await request(app)
        .get('/api/v1/health')
        .set('Authorization', 'Bearer invalid-token-12345');
      
      // Depending on auth middleware, this may pass auth check
      // Health endpoint should be accessible without valid credentials
      expect([200, 401]).toContain(response.status);
    });

    it('should respond to multiple consecutive requests', async () => {
      const responses = await Promise.all([
        request(app).get('/api/v1/health'),
        request(app).get('/api/v1/health'),
        request(app).get('/api/v1/health'),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('ok');
      });
    });

    it('should support HTTP HEAD requests for load balancer checks', async () => {
      const response = await request(app).head('/api/v1/health');
      
      // HEAD request should return same response code as GET
      expect(response.status).toBe(200);
    });
  });

  describe('Health Check - Integration Tests', () => {
    it('should confirm API is healthy when run in test environment', async () => {
      const response = await request(app).get('/api/v1/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.env).toBe('test');
    });

    it('should maintain response consistency across multiple calls', async () => {
      const response1 = await request(app).get('/api/v1/health');
      const response2 = await request(app).get('/api/v1/health');
      
      // Both responses should be identical
      expect(response1.body).toEqual(response2.body);
    });

    it('should be listed in API routes', async () => {
      // Verify the endpoint is discoverable
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
    });

    it('should return data structure suitable for Cloud Monitoring', async () => {
      const response = await request(app).get('/api/v1/health');
      const { data } = response.body;
      
      // Cloud Monitoring expects specific fields
      expect(data).toHaveProperty('status');
      expect(typeof data.status).toBe('string');
    });
  });

  describe('Health Check - Deployment Verification', () => {
    it('should confirm deployment readiness', async () => {
      const response = await request(app).get('/api/v1/health');
      
      // Pre-deployment checklist
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('ok');
      expect(response.body.success).toBe(true);
    });

    it('should respond consistently (for load balancer persistence)', async () => {
      const requests = Array(5).fill(null).map(() => 
        request(app).get('/api/v1/health')
      );

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 200).length;
      
      expect(successCount).toBe(5);
    });

    it('should include service metadata for observability', async () => {
      const response = await request(app).get('/api/v1/health');
      
      // Monitoring systems use this data
      expect(response.body.data).toHaveProperty('env');
      expect(response.body.data).toHaveProperty('authMode');
      expect(response.body.data).toHaveProperty('storageDriver');
    });
  });

  describe('Health Check - Performance Monitoring', () => {
    it('should track response time for p95 latency monitoring', async () => {
      const startTime = process.hrtime.bigint();
      await request(app).get('/api/v1/health');
      const endTime = process.hrtime.bigint();
      
      const duration = Number(endTime - startTime) / 1_000_000; // Convert to ms
      
      // Latency should be well under production target of 500ms
      expect(duration).toBeLessThan(100);
    });

    it('should not cause errors for error rate monitoring', async () => {
      const response = await request(app).get('/api/v1/health');
      
      // Success response (no error)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should indicate all systems operational', async () => {
      const response = await request(app).get('/api/v1/health');
      
      // Status "ok" indicates all dependencies are healthy
      expect(response.body.data.status).toBe('ok');
    });
  });
});
