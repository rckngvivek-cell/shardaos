import { api } from '../../store/api';
import type { AttendanceRecord } from '@school-erp/shared';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const attendanceApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAttendance: build.query<PaginatedResponse<AttendanceRecord>, { date?: string; grade?: string }>({
      query: (params) => ({ url: '/attendance', params }),
      providesTags: ['Attendance'],
    }),
    markBulkAttendance: build.mutation<{ success: boolean; data: AttendanceRecord[] }, unknown>({
      query: (body) => ({ url: '/attendance/bulk', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const { useListAttendanceQuery, useMarkBulkAttendanceMutation } = attendanceApi;
