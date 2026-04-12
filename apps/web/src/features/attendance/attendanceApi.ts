import { api } from '../../store/api';
import type { AttendanceRecord, BulkAttendanceInput } from '@school-erp/shared';
import type { ApiSuccessResponse, PaginatedApiResponse } from '../../store/apiTypes';

export const attendanceApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAttendance: build.query<PaginatedApiResponse<AttendanceRecord>, { date?: string; grade?: string; section?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/attendance', params }),
      providesTags: ['Attendance'],
    }),
    markBulkAttendance: build.mutation<ApiSuccessResponse<AttendanceRecord[]>, BulkAttendanceInput>({
      query: (body) => ({ url: '/attendance/bulk', method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const { useListAttendanceQuery, useMarkBulkAttendanceMutation } = attendanceApi;
