import { ApiError, ApiSuccess } from "../types";

export const API_VERSION = "0.1.0";

export function ok<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  };
}

export function fail(status: number, code: string, message: string): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      status,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  };
}

