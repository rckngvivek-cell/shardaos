import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // In production, attach Firebase auth token here
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Student', 'Attendance', 'Grade', 'School'],
  endpoints: () => ({}),
});
