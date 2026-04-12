/**
 * Telemetry Event Type Definitions
 * Used by both backend and frontend for consistent event schema
 */

export interface TelemetryContext {
  environment: string;
  version: string;
  user_agent?: string;
  ip_address?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  screen_width?: number;
  screen_height?: number;
  timezone?: string;
  language?: string;
}

export interface TelemetryEvent {
  event_name: string;
  timestamp: string; // ISO8601
  user_id?: string;
  user_role?: 'admin' | 'teacher' | 'student' | 'parent';
  session_id?: string;
  request_id?: string;
  properties: Record<string, any>;
  context: TelemetryContext;
}

/**
 * User Authentication Events
 */
export interface UserLoginEvent extends TelemetryEvent {
  event_name: 'user_login';
  user_id: string;
  properties: {
    role: 'admin' | 'teacher' | 'student' | 'parent';
    success: boolean;
    failure_reason?: string;
    ip_address?: string;
    timestamp: string;
  };
}

export interface UserLogoutEvent extends TelemetryEvent {
  event_name: 'user_logout';
  user_id: string;
  properties: {
    session_duration_ms: number;
    role: 'admin' | 'teacher' | 'student' | 'parent';
  };
}

/**
 * API Performance Events
 */
export interface ApiRequestEvent extends TelemetryEvent {
  event_name: 'api_request';
  user_id?: string;
  properties: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    status_code: number;
    latency_ms: number;
    response_size_bytes?: number;
    db_query_time_ms?: number;
    cache_hit?: boolean;
    is_success: boolean;
    is_error: boolean;
  };
}

export interface ApiErrorEvent extends TelemetryEvent {
  event_name: 'api_error';
  properties: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    error_type: 'validation_error' | 'auth_error' | 'not_found' | 'server_error' | 'timeout' | 'client_error';
    error_message: string;
    status_code: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stacktrace?: string;
  };
}

/**
 * Feature Usage Events
 */
export interface FeatureAccessedEvent extends TelemetryEvent {
  event_name: 'feature_accessed';
  user_id: string;
  user_role: 'admin' | 'teacher' | 'student' | 'parent';
  properties: {
    feature_name: string;
    action: 'view' | 'create' | 'update' | 'delete' | 'export';
    item_count?: number;
    duration_ms?: number;
    success: boolean;
  };
}

export interface PageViewEvent extends TelemetryEvent {
  event_name: 'page_view';
  user_id?: string;
  properties: {
    page_path: string;
    page_title: string;
    referrer?: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
    time_on_page_ms?: number;
  };
}

/**
 * Business Events
 */
export interface SchoolCreatedEvent extends TelemetryEvent {
  event_name: 'school_created';
  user_id: string;
  properties: {
    school_id: string;
    school_name: string;
    student_count: number;
    staff_count: number;
  };
}

export interface StudentEnrolledEvent extends TelemetryEvent {
  event_name: 'student_enrolled';
  user_id: string;
  properties: {
    school_id: string;
    student_id: string;
    grade: string;
    section: string;
  };
}

export interface AttendanceMarkedEvent extends TelemetryEvent {
  event_name: 'attendance_marked';
  user_id: string;
  properties: {
    school_id: string;
    class_id: string;
    present_count: number;
    absent_count: number;
    date: string; // YYYY-MM-DD
  };
}

export interface GradeEnteredEvent extends TelemetryEvent {
  event_name: 'grade_entered';
  user_id: string;
  properties: {
    school_id: string;
    student_id: string;
    subject: string;
    grade: string;
    marks_obtained: number;
    total_marks: number;
  };
}

/**
 * System Health Events
 */
export interface SystemHealthEvent extends TelemetryEvent {
  event_name: 'system_health';
  properties: {
    metric_type: 'uptime' | 'error_rate' | 'latency_p95' | 'latency_p99' | 'db_connection_time';
    value: number;
    threshold: number;
    status: 'healthy' | 'warning' | 'critical';
    region: string;
    service: 'api' | 'web' | 'firestore';
  };
}

/**
 * Client Error Events
 */
export interface ClientErrorEvent extends TelemetryEvent {
  event_name: 'client_error';
  properties: {
    error_type: string;
    error_message: string;
    page_path: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stacktrace?: string;
  };
}

/**
 * Session Events
 */
export interface SessionStartEvent extends TelemetryEvent {
  event_name: 'session_start';
  user_id?: string;
  properties: {
    device_type: 'mobile' | 'tablet' | 'desktop';
    referrer?: string;
  };
}

export interface SessionEndEvent extends TelemetryEvent {
  event_name: 'session_end';
  user_id?: string;
  properties: {
    session_duration_ms: number;
    page_views: number;
    api_calls: number;
  };
}

/**
 * Union type of all telemetry events
 */
export type AllTelemetryEvents =
  | UserLoginEvent
  | UserLogoutEvent
  | ApiRequestEvent
  | ApiErrorEvent
  | FeatureAccessedEvent
  | PageViewEvent
  | SchoolCreatedEvent
  | StudentEnrolledEvent
  | AttendanceMarkedEvent
  | GradeEnteredEvent
  | SystemHealthEvent
  | ClientErrorEvent
  | SessionStartEvent
  | SessionEndEvent;

/**
 * Validation schema for incoming telemetry events
 */
import { z } from 'zod';

const contextSchema = z.object({
  environment: z.string(),
  version: z.string(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
  device_type: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  screen_width: z.number().optional(),
  screen_height: z.number().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

const telemetryEventSchema = z.object({
  event_name: z.string(),
  timestamp: z.string().datetime(),
  user_id: z.string().optional(),
  user_role: z.enum(['admin', 'teacher', 'student', 'parent']).optional(),
  session_id: z.string().optional(),
  request_id: z.string().optional(),
  properties: z.record(z.any()),
  context: contextSchema,
});

export const telemetryEventArraySchema = z.array(telemetryEventSchema);

/**
 * Validate incoming telemetry events
 */
export function validateTelemetryEvents(
  events: unknown
): { valid: boolean; data?: TelemetryEvent[]; error?: string } {
  try {
    const validated = telemetryEventArraySchema.parse(events);
    return { valid: true, data: validated };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid telemetry events',
    };
  }
}

/**
 * Validate single telemetry event
 */
export function validateTelemetryEvent(
  event: unknown
): { valid: boolean; data?: TelemetryEvent; error?: string } {
  try {
    const validated = telemetryEventSchema.parse(event);
    return { valid: true, data: validated };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid telemetry event',
    };
  }
}
