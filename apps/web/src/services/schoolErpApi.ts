import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '@/services/api';

import type {
  ApiEnvelope,
  AttendanceQuery,
  AttendanceSession,
  AttendanceSubmission,
  School,
  Student
} from '../types';

interface ListStudentsArgs {
  schoolId: string;
  q?: string;
}

interface CreateStudentInput {
  firstName: string;
  lastName: string;
  dob: string;
  rollNumber: string;
  class: number;
  section: string;
  contact: {
    parentName: string;
    parentEmail?: string;
    parentPhone: string;
  };
}

type AttendanceEnvelope = ApiEnvelope<AttendanceSession>;

export const schoolErpApi = createApi({
  reducerPath: 'schoolErpApi',
  baseQuery,
  tagTypes: ['Student', 'School', 'Attendance'],
  endpoints: (builder) => ({
    getSchool: builder.query<School, string>({
      query: (schoolId) => `/schools/${schoolId}`,
      transformResponse: (response: ApiEnvelope<School>) => response.data,
      providesTags: ['School']
    }),
    listStudents: builder.query<Student[], ListStudentsArgs>({
      query: ({ schoolId, q }) => ({
        url: q ? `/schools/${schoolId}/students/search` : `/schools/${schoolId}/students`,
        params: q ? { q } : undefined
      }),
      transformResponse: (response: ApiEnvelope<Student[]>) => response.data,
      providesTags: ['Student']
    }),
    createStudent: builder.mutation<Student, { schoolId: string; payload: CreateStudentInput }>({
      query: ({ schoolId, payload }) => ({
        url: `/schools/${schoolId}/students`,
        method: 'POST',
        body: payload
      }),
      transformResponse: (response: ApiEnvelope<Student>) => response.data,
      invalidatesTags: ['Student', 'School']
    }),
    getAttendance: builder.query<AttendanceSession, AttendanceQuery>({
      query: ({ schoolId, date, class: classNumber, section }) => ({
        url: `/schools/${schoolId}/attendance`,
        params: { date, class: classNumber, section }
      }),
      transformResponse: (response: AttendanceEnvelope) => response.data,
      providesTags: ['Attendance']
    }),
    submitAttendance: builder.mutation<
      AttendanceSession,
      { schoolId: string; payload: AttendanceSubmission }
    >({
      query: ({ schoolId, payload }) => ({
        url: `/schools/${schoolId}/attendance`,
        method: 'POST',
        body: payload
      }),
      transformResponse: (response: AttendanceEnvelope) => response.data,
      invalidatesTags: ['Attendance']
    })
  })
});

export const {
  useCreateStudentMutation,
  useGetAttendanceQuery,
  useGetSchoolQuery,
  useListStudentsQuery,
  useSubmitAttendanceMutation
} = schoolErpApi;
