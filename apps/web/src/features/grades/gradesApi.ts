import { api } from '../../store/api';
import type { Grade } from '@school-erp/shared';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const gradesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listGrades: build.query<PaginatedResponse<Grade>, { subject?: string; page?: number }>({
      query: (params) => ({ url: '/grades', params }),
      providesTags: ['Grade'],
    }),
    getStudentGrades: build.query<{ success: boolean; data: Grade[] }, string>({
      query: (studentId) => `/grades/student/${studentId}`,
      providesTags: ['Grade'],
    }),
    createGrade: build.mutation<{ success: boolean; data: Grade }, unknown>({
      query: (body) => ({ url: '/grades', method: 'POST', body }),
      invalidatesTags: ['Grade'],
    }),
  }),
});

export const { useListGradesQuery, useGetStudentGradesQuery, useCreateGradeMutation } = gradesApi;
