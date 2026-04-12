import { api } from '../../store/api';
import type { Student } from '@school-erp/shared';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const studentsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listStudents: build.query<PaginatedResponse<Student>, { page?: number; limit?: number; grade?: string }>({
      query: (params) => ({ url: '/students', params }),
      providesTags: ['Student'],
    }),
    getStudent: build.query<{ success: boolean; data: Student }, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Student', id }],
    }),
    createStudent: build.mutation<{ success: boolean; data: Student }, Partial<Student>>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Student'],
    }),
    updateStudent: build.mutation<{ success: boolean; data: Student }, { id: string; body: Partial<Student> }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Student', id }],
    }),
    deleteStudent: build.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
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
