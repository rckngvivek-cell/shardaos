export function ok<T>(res: any, data: T, meta: Record<string, unknown> = {}) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      ...meta
    }
  });
}

export function created<T>(res: any, data: T, meta: Record<string, unknown> = {}) {
  return res.status(201).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      ...meta
    }
  });
}

export function fail(
  res: any,
  status: number,
  code: string,
  message: string,
  requestId?: string,
  details?: Record<string, unknown>
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      status,
      ...(details ? { details } : {})
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {})
    }
  });
}
