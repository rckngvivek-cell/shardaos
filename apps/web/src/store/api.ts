import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { auth } from '../lib/firebase';
import { logout } from '../features/auth/authSlice';
import { clearDevSession } from '../features/auth/AuthInitializer';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: async (headers) => {
    const token = await auth?.currentUser?.getIdToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

/**
 * Wraps the base query to intercept 401 responses and force
 * a logout + redirect so stale/expired sessions can't linger.
 */
const baseQueryWith401: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    clearDevSession();
    // Push to login — use window.location so it works outside React Router
    window.location.replace('/login');
  }
  return result;
};

export const api = createApi({
  baseQuery: baseQueryWith401,
  tagTypes: ['Student', 'Attendance', 'Grade', 'School', 'Employee', 'Approval'],
  endpoints: () => ({}),
});
