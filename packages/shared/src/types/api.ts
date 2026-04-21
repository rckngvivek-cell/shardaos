export interface ApiError {
  code: string;
  message: string;
}

export interface ApiMeta {
  requestId?: string;
  page?: number;
  limit?: number;
  total?: number;
}

/**
 * Canonical API response envelope used by the School ERP API.
 *
 * Notes:
 * - `success=true` responses include `data`.
 * - `success=false` responses include `error`.
 * - `meta` is used for pagination and request correlation.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

