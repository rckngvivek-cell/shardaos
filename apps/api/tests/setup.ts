/**
 * Forces the API test suite to exercise the authenticated path explicitly
 * instead of silently inheriting the local dev auth bypass.
 */
process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'jwt';

afterEach(() => {
  jest.restoreAllMocks();
  const { resetDocumentStoreForTests } = jest.requireActual(
    '../src/lib/document-store.js',
  ) as typeof import('../src/lib/document-store.js');
  resetDocumentStoreForTests();
});
