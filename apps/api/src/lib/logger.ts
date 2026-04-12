export function logger(context: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      console.log(JSON.stringify({ level: 'info', context, message, ...data, ts: new Date().toISOString() })),
    warn: (message: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ level: 'warn', context, message, ...data, ts: new Date().toISOString() })),
    error: (message: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: 'error', context, message, ...data, ts: new Date().toISOString() })),
  };
}
