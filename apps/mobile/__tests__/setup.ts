/**
 * Provides a stable baseline for mobile unit tests without leaking mocks
 * across test cases as the suite grows.
 */
afterEach(() => {
  jest.restoreAllMocks();
});
