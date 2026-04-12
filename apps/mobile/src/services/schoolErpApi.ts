import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  prepareHeaders: async (headers) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const schoolErpApi = createApi({
  reducerPath: 'schoolErpApi',
  baseQuery,
  tagTypes: ['Student', 'Attendance', 'Grades'],
  endpoints: (builder) => ({
    getStudent: builder.query({
      query: (studentId) => `/students/${studentId}`,
    }),
    getAttendance: builder.query({
      query: ({ studentId, month }) => ({
        url: `/students/${studentId}/attendance`,
        params: { month },
      }),
      providesTags: ['Attendance'],
    }),
    getGrades: builder.query({
      query: ({ studentId, term }) => ({
        url: `/students/${studentId}/grades`,
        params: { term },
      }),
      providesTags: ['Grades'],
    }),
  }),
});

export const { useGetStudentQuery, useGetAttendanceQuery, useGetGradesQuery } = schoolErpApi;
