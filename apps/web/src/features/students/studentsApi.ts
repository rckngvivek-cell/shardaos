import { api } from '../../store/api';
import type { CreateStudentInput, Student, UpdateStudentInput } from '@school-erp/shared';
import type { ApiSuccessResponse, PaginatedApiResponse } from '../../store/apiTypes';

export const studentsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listStudents: build.query<PaginatedApiResponse<Student>, { page?: number; limit?: number; grade?: string; section?: string }>({
      query: (params) => ({ url: '/students', params }),
      providesTags: ['Student'],
    }),
    getStudent: build.query<ApiSuccessResponse<Student>, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Student', id }],
    }),
    createStudent: build.mutation<ApiSuccessResponse<Student>, CreateStudentInput>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Student'],
    }),
    updateStudent: build.mutation<ApiSuccessResponse<Student>, { id: string; body: UpdateStudentInput }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Student', id }],
    }),
    deleteStudent: build.mutation<void, string>({
      query: (id) => ({
        url: `/students/${id}`,
        method: 'DELETE',
        // The API returns 204 No Content; avoid JSON parsing errors in fetchBaseQuery.
        responseHandler: (response) => response.text(),
      }),
      transformResponse: () => undefined,
      invalidatesTags: ['Student'],
    }),
  }),
});

export const {
  useListStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;
