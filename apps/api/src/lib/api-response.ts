export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId?: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, data, meta };
}

export function errorResponse(code: string, message: string): ApiResponse {
  return { success: false, error: { code, message } };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  requestId?: string
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: { total, page, limit, requestId },
  };
}
