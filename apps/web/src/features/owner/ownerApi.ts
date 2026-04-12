import { api } from '../../store/api';
import type {
  ApiResponse,
  Approval,
  ApprovalStatus,
  CreateEmployeeInput,
  Employee,
  PlatformAuthUser,
} from '@school-erp/shared';

export interface OwnerSummary {
  pendingApprovals: number;
  activeEmployees: number;
  generatedAt: string;
}

export type { Approval, ApprovalStatus, CreateEmployeeInput, Employee };
export type OwnerProfile = PlatformAuthUser;

export const ownerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOwnerProfile: build.query<ApiResponse<OwnerProfile>, void>({
      query: () => '/owner/owner/me',
    }),
    getOwnerSummary: build.query<ApiResponse<OwnerSummary>, void>({
      query: () => '/owner/owner/summary',
      providesTags: ['Employee', 'Approval'],
    }),
    listEmployees: build.query<ApiResponse<Employee[]>, void>({
      query: () => '/owner/employees',
      providesTags: ['Employee'],
    }),
    createEmployee: build.mutation<ApiResponse<Employee>, CreateEmployeeInput>({
      query: (body) => ({ url: '/owner/employees', method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),
    deactivateEmployee: build.mutation<void, string>({
      query: (id) => ({
        url: `/owner/employees/${id}`,
        method: 'DELETE',
        // The API returns 204 No Content; avoid JSON parsing errors in fetchBaseQuery.
        responseHandler: (response) => response.text(),
      }),
      transformResponse: () => undefined,
      invalidatesTags: ['Employee'],
    }),
    listApprovals: build.query<ApiResponse<Approval[]>, { status?: ApprovalStatus } | void>({
      query: (params) =>
        params?.status
          ? { url: '/owner/approvals', params: { status: params.status } }
          : { url: '/owner/approvals' },
      providesTags: ['Approval'],
    }),
    approveApproval: build.mutation<ApiResponse<Approval>, string>({
      query: (id) => ({ url: `/owner/approvals/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Approval'],
    }),
    denyApproval: build.mutation<ApiResponse<Approval>, string>({
      query: (id) => ({ url: `/owner/approvals/${id}/deny`, method: 'POST' }),
      invalidatesTags: ['Approval'],
    }),
  }),
});

export const {
  useGetOwnerProfileQuery,
  useGetOwnerSummaryQuery,
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useListApprovalsQuery,
  useApproveApprovalMutation,
  useDenyApprovalMutation,
} = ownerApi;
