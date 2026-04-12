/**
 * Staff API - RTK Query Hooks
 * Day 1: Task 3 - RTK Query Hook (1 hour)
 * Author: Frontend Team
 * Status: In Development
 * 
 * Provides typed hooks for all staff-related API calls
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { StaffData } from './staffSlice';

// ============================================================================
// API BASE CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || '';
};

// ============================================================================
// API SLICE
// ============================================================================

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/staff`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // ====================================================================
    // AUTHENTICATION ENDPOINTS
    // ====================================================================

    /**
     * Login - POST /auth/login
     */
    login: builder.mutation<
      { token: string; staff: StaffData },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    /**
     * Logout - POST /auth/logout
     */
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    /**
     * Get Current Staff - GET /auth/me
     * Fetches authenticated staff member's data
     */
    getMe: builder.query<StaffData, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
    }),

    /**
     * Validate Token - GET /auth/validate-token
     * Quick check if current token is valid
     */
    validateToken: builder.query<
      { valid: boolean; staffId?: string; role?: string },
      void
    >({
      query: () => ({
        url: '/auth/validate-token',
        method: 'GET',
      }),
    }),

    /**
     * Register Staff - POST /auth/register
     * Creates new staff member (admin only)
     */
    registerStaff: builder.mutation<
      { message: string; token: string; staff: StaffData },
      {
        email: string;
        password: string;
        name: string;
        role: 'admin' | 'staff' | 'teacher';
        school_id: string;
      }
    >({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // ====================================================================
    // FUTURE ENDPOINTS (Placeholders for Day 2-4)
    // ====================================================================

    /**
     * Get Staff List - GET /
     * Returns all staff members (paginated)
     */
    getStaffList: builder.query<
      { staff: StaffData[]; total: number; page: number },
      { page?: number; limit?: number; role?: string }
    >({
      query: ({ page = 1, limit = 20, role } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(role && { role }),
        });
        return {
          url: `/?${params}`,
          method: 'GET',
        };
      },
    }),

    /**
     * Get Staff by ID - GET /:staffId
     * Returns single staff member details
     */
    getStaffById: builder.query<StaffData, string>({
      query: (staffId) => ({
        url: `/${staffId}`,
        method: 'GET',
      }),
    }),

    /**
     * Update Staff - PUT /:staffId
     * Updates staff member profile (role-based)
     */
    updateStaff: builder.mutation<
      { message: string; staff: StaffData },
      { staffId: string; data: Partial<StaffData> }
    >({
      query: ({ staffId, data }) => ({
        url: `/${staffId}`,
        method: 'PUT',
        body: data,
      }),
    }),

    /**
     * Delete Staff - DELETE /:staffId
     * Soft delete staff member (admin only)
     */
    deleteStaff: builder.mutation<{ message: string }, string>({
      query: (staffId) => ({
        url: `/${staffId}`,
        method: 'DELETE',
      }),
    }),

    /**
     * Get Staff by Role - GET /role/:role
     * Returns all staff members with specific role
     */
    getStaffByRole: builder.query<
      { staff: StaffData[]; count: number; role: string },
      string
    >({
      query: (role) => ({
        url: `/role/${role}`,
        method: 'GET',
      }),
    }),

    // ====================================================================
    // ATTENDANCE MANAGEMENT ENDPOINTS (NEW - Day 2)
    // ====================================================================

    /**
     * Mark Attendance - POST /attendance/mark
     * Mark single student attendance for a class
     */
    markAttendance: builder.mutation<
      { id: string; status: 'created' | 'updated'; timestamp: string },
      {
        class_id: string;
        student_id: string;
        status: 'present' | 'absent' | 'late';
        notes?: string;
      }
    >({
      query: (data) => ({
        url: '/attendance/mark',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Get Attendance by Class - GET /attendance/by-class
     * Retrieves all attendance records for a class on a given date
     */
    getAttendanceByClass: builder.query<
      {
        records: Array<{
          id: string;
          student_id: string;
          student_name: string;
          status: 'present' | 'absent' | 'late';
          marked_at: string;
          notes?: string;
        }>;
        count: number;
        class_id: string;
      },
      { class_id: string; date?: string } | undefined
    >({
      query: (params) => {
        if (!params) return { url: '/attendance/by-class', method: 'GET' };
        const queryString = new URLSearchParams({
          class_id: params.class_id,
          ...(params.date && { date: params.date }),
        }).toString();
        return {
          url: `/attendance/by-class?${queryString}`,
          method: 'GET',
        };
      },
    }),

    /**
     * Get Attendance Stats - GET /attendance/stats
     * Get aggregated attendance statistics for a class
     */
    getAttendanceStats: builder.query<
      {
        class_id: string;
        date_range: string;
        statistics: {
          total: number;
          present: number;
          absent: number;
          late: number;
          present_percentage: number;
          absent_percentage: number;
          late_percentage: number;
        };
      },
      { class_id: string; date_range?: 'day' | 'week' | 'month' } | undefined
    >({
      query: (params) => {
        if (!params) return { url: '/attendance/stats', method: 'GET' };
        const queryString = new URLSearchParams({
          class_id: params.class_id,
          ...(params.date_range && { date_range: params.date_range }),
        }).toString();
        return {
          url: `/attendance/stats?${queryString}`,
          method: 'GET',
        };
      },
    }),

    // ====================================================================
    // STUDENT MANAGEMENT ENDPOINTS (NEW - Day 2)
    // ====================================================================

    /**
     * Get Student List - GET /students
     * Returns list of students for a class
     */
    getStudentList: builder.query<
      {
        students: Array<{
          id: string;
          name: string;
          email: string;
          class_id: string;
        }>;
        total: number;
        class_id?: string;
      },
      { class_id?: string } | undefined
    >({
      query: (params) => {
        if (!params || !params.class_id) return { url: '/students', method: 'GET' };
        return {
          url: `/students?class_id=${params.class_id}`,
          method: 'GET',
        };
      },
    }),

    // ====================================================================
    // GRADE MANAGEMENT ENDPOINTS (NEW - Day 3)
    // ====================================================================

    /**
     * Mark Grade - POST /grades/mark
     * Mark or update a student's grade
     */
    markGrade: builder.mutation<
      { id: string; status: 'created' | 'updated'; score: number; grade_letter: string; timestamp: string },
      {
        class_id: string;
        student_id: string;
        subject: string;
        score: number;
        exam_type?: string;
        notes?: string;
      }
    >({
      query: (data) => ({
        url: '/grades/mark',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Get Grades by Class - GET /grades/by-class
     * Retrieves all grades for a class with optional filters
     */
    getGradesByClass: builder.query<
      {
        records: Array<{
          id: string;
          class_id: string;
          student_id: string;
          student_name: string;
          subject: string;
          score: number;
          grade_letter: string;
          exam_type: string;
          marked_by: string;
          marked_at: string;
          notes?: string;
        }>;
        count: number;
        class_id: string;
        subject?: string;
        exam_type?: string;
      },
      { class_id: string; subject?: string; exam_type?: string } | undefined
    >({
      query: (params) => {
        if (!params || !params.class_id) return { url: '/grades/by-class', method: 'GET' };
        const queryString = new URLSearchParams({
          class_id: params.class_id,
          ...(params.subject && { subject: params.subject }),
          ...(params.exam_type && { exam_type: params.exam_type }),
        }).toString();
        return {
          url: `/grades/by-class?${queryString}`,
          method: 'GET',
        };
      },
    }),

    /**
     * Get Grade Stats - GET /grades/stats
     * Get aggregated grade statistics for a class
     */
    getGradeStats: builder.query<
      {
        class_id: string;
        subject?: string;
        exam_type?: string;
        statistics: {
          total_students: number;
          graded: number;
          not_graded: number;
          score_stats: {
            average: number;
            median: number;
            min: number;
            max: number;
            std_deviation: number;
          };
          grade_distribution: Record<string, number>;
          grade_percentages: Record<string, number>;
          pass_rate: number;
          fail_rate: number;
        };
      },
      { class_id: string; subject?: string; exam_type?: string } | undefined
    >({
      query: (params) => {
        if (!params || !params.class_id) return { url: '/grades/stats', method: 'GET' };
        const queryString = new URLSearchParams({
          class_id: params.class_id,
          ...(params.subject && { subject: params.subject }),
          ...(params.exam_type && { exam_type: params.exam_type }),
        }).toString();
        return {
          url: `/grades/stats?${queryString}`,
          method: 'GET',
        };
      },
    }),

    /**
     * Get Grade Report - GET /grades/report
     * Generates detailed grade report per student with trends
     */
    getGradeReport: builder.query<
      {
        records: Array<{
          student_id: string;
          student_name: string;
          gpa: number;
          grades_by_subject: Record<string, any[]>;
          average_by_exam_type: Record<string, number>;
          trend: Array<{
            month: string;
            average_score: number;
          }>;
        }>;
        class_id: string;
      },
      { class_id: string; student_id?: string; exam_type?: string } | undefined
    >({
      query: (params) => {
        if (!params || !params.class_id) return { url: '/grades/report', method: 'GET' };
        const queryString = new URLSearchParams({
          class_id: params.class_id,
          ...(params.student_id && { student_id: params.student_id }),
          ...(params.exam_type && { exam_type: params.exam_type }),
        }).toString();
        return {
          url: `/grades/report?${queryString}`,
          method: 'GET',
        };
      },
    }),

    /**
     * Get Classes - GET /classes
     * Returns all available classes
     */
    getClasses: builder.query<
      Array<{
        id: string;
        name: string;
        grade: string;
        teacher: string;
        student_count: number;
      }>,
      void
    >({
      query: () => ({
        url: '/classes',
        method: 'GET',
      }),
    }),

    /**
     * Get Subjects - GET /subjects
     * Returns all available subjects
     */
    getSubjects: builder.query<string[], void>({
      query: () => ({
        url: '/subjects',
        method: 'GET',
      }),
    }),

    /**
     * Get Exam Types - GET /exam-types
     * Returns all exam types
     */
    getExamTypes: builder.query<string[], void>({
      query: () => ({
        url: '/exam-types',
        method: 'GET',
      }),
    }),
  }),
});

// ============================================================================
// EXPORTS - HOOKS
// ============================================================================

// Authentication hooks
export const useLoginMutation = staffApi.useLoginMutation;
export const useLogoutMutation = staffApi.useLogoutMutation;
export const useGetMeQuery = staffApi.useGetMeQuery;
export const useValidateTokenQuery = staffApi.useValidateTokenQuery;
export const useRegisterStaffMutation = staffApi.useRegisterStaffMutation;

// Staff management hooks
export const useGetStaffListQuery = staffApi.useGetStaffListQuery;
export const useGetStaffByIdQuery = staffApi.useGetStaffByIdQuery;
export const useUpdateStaffMutation = staffApi.useUpdateStaffMutation;
export const useDeleteStaffMutation = staffApi.useDeleteStaffMutation;
export const useGetStaffByRoleQuery = staffApi.useGetStaffByRoleQuery;

// Attendance management hooks (NEW - Day 2)
export const useMarkAttendanceMutation = staffApi.useMarkAttendanceMutation;
export const useGetAttendanceByClassQuery = staffApi.useGetAttendanceByClassQuery;
export const useGetAttendanceStatsQuery = staffApi.useGetAttendanceStatsQuery;

// Student management hooks (NEW - Day 2)
export const useGetStudentListQuery = staffApi.useGetStudentListQuery;

// Grade management hooks (NEW - Day 3)
export const useMarkGradeMutation = staffApi.useMarkGradeMutation;
export const useGetGradesByClassQuery = staffApi.useGetGradesByClassQuery;
export const useGetGradeStatsQuery = staffApi.useGetGradeStatsQuery;
export const useGetGradeReportQuery = staffApi.useGetGradeReportQuery;

// Utility hooks
export const useGetClassesQuery = staffApi.useGetClassesQuery;
export const useGetSubjectsQuery = staffApi.useGetSubjectsQuery;
export const useGetExamTypesQuery = staffApi.useGetExamTypesQuery;

// Export the API
export default staffApi;

/**
 * USAGE EXAMPLES
 * 
 * === In React Component ===
 * 
 * 1. LOGIN
 * const [login] = useLoginMutation();
 * const result = await login({ email: 'user@school.com', password: 'pass' });
 * // Returns: { token, staff }
 * 
 * 2. FETCH CURRENT STAFF
 * const { data: staff, isLoading, error } = useGetMeQuery();
 * 
 * 3. GET STAFF LIST
 * const { data, isLoading } = useGetStaffListQuery({ page: 1, limit: 20 });
 * 
 * 4. UPDATE STAFF
 * const [updateStaff] = useUpdateStaffMutation();
 * await updateStaff({ staffId: '123', data: { name: 'New Name' } });
 * 
 * 5. VALIDATE TOKEN
 * const { data, refetch } = useValidateTokenQuery();
 * if (!data?.valid) navigate('/login');
 */
