import type { ApiMeta, ApiResponse } from '@school-erp/shared';

/**
 * RTK Query endpoints only return typed `data` for successful (2xx) responses.
 * Model those success envelopes precisely so consumers can treat `data` as present
 * whenever the hook's `data` is defined.
 */
export type ApiSuccessResponse<T> = ApiResponse<T> & { success: true; data: T };

export type PaginatedMeta =
  & Required<Pick<ApiMeta, 'page' | 'limit' | 'total'>>
  & Pick<ApiMeta, 'requestId'>;

/**
 * Standard paginated list response used by the API for list endpoints.
 */
export type PaginatedApiResponse<T> = ApiSuccessResponse<T[]> & { meta: PaginatedMeta };

