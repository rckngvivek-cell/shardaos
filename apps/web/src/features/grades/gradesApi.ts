import { api } from '../../store/api';
import type { CreateGradeInput, Grade } from '@school-erp/shared';
import type { ApiSuccessResponse, PaginatedApiResponse } from '../../store/apiTypes';

export const gradesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listGrades: build.query<PaginatedApiResponse<Grade>, { subject?: string; examName?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/grades', params }),
      providesTags: ['Grade'],
    }),
    getStudentGrades: build.query<ApiSuccessResponse<Grade[]>, string>({
      query: (studentId) => `/grades/student/${studentId}`,
      providesTags: ['Grade'],
    }),
    createGrade: build.mutation<ApiSuccessResponse<Grade>, CreateGradeInput>({
      query: (body) => ({ url: '/grades', method: 'POST', body }),
      invalidatesTags: ['Grade'],
    }),
  }),
});

export const { useListGradesQuery, useGetStudentGradesQuery, useCreateGradeMutation } = gradesApi;
