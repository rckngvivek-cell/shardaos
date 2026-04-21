import reducer, { logout, setUser } from '../src/features/auth/authSlice';

describe('mobile auth slice', () => {
  it('stores the authenticated user context needed by the mobile shell', () => {
    const state = reducer(
      undefined,
      setUser({
        uid: 'user-001',
        role: 'school_admin',
        schoolId: 'school-001',
      }),
    );

    expect(state).toEqual({
      uid: 'user-001',
      role: 'school_admin',
      schoolId: 'school-001',
      isAuthenticated: true,
    });
  });

  it('clears the session on logout', () => {
    const authenticatedState = reducer(
      undefined,
      setUser({
        uid: 'user-001',
        role: 'school_admin',
        schoolId: 'school-001',
      }),
    );

    const state = reducer(authenticatedState, logout());

    expect(state).toEqual({
      uid: null,
      role: null,
      schoolId: null,
      isAuthenticated: false,
    });
  });
});
