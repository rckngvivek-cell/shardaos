/**
 * Logger utility for production logging
 * Provides structured logging with levels: debug, info, warn, error
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };
  }

  private output(entry: LogEntry): void {
    const logOutput = {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.error && { error: entry.error.message, stack: entry.error.stack }),
    };

    const logLevel = entry.level.toLowerCase();
    if (console[logLevel as 'debug' | 'info' | 'warn' | 'error']) {
      console[logLevel as 'debug' | 'info' | 'warn' | 'error'](JSON.stringify(logOutput));
    } else {
      console.log(JSON.stringify(logOutput));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.output(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.output(this.formatLog(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error | null | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : (error ? new Error(String(error)) : undefined);
    this.output(this.formatLog(LogLevel.ERROR, message, context, errorObj));
  }
}

export const logger = new Logger();
