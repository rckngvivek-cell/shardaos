/**
 * Forces the API test suite to exercise the authenticated path explicitly
 * instead of silently inheriting the local dev auth bypass.
 */
process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'jwt';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'school-erp-test';

afterEach(() => {
  jest.restoreAllMocks();
});
