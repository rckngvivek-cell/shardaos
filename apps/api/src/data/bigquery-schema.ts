/**
 * BigQuery Schema Definitions
 * Data Agent - Phase 1 Analytics Pipeline
 * 
 * Defines all tables for school_erp_analytics dataset
 * Type-safe schema with validation
 */

export interface BigQuerySchema {
  [key: string]: {
    name: string;
    fields: Array<{
      name: string;
      type: string;
      mode?: 'NULLABLE' | 'REQUIRED' | 'REPEATED';
      description?: string;
    }>;
  };
}

export const ANALYTICS_SCHEMA: BigQuerySchema = {
  events: {
    name: 'events',
    fields: [
      {
        name: 'timestamp',
        type: 'TIMESTAMP',
        mode: 'REQUIRED',
        description: 'Event timestamp (UTC)',
      },
      {
        name: 'event_type',
        type: 'STRING',
        mode: 'REQUIRED',
        description:
          'Type of event: user_login, dashboard_viewed, report_generated, error, payment_completed, etc.',
      },
      {
        name: 'school_id',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'School identifier',
      },
      {
        name: 'user_id',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'User identifier (parent, teacher, staff)',
      },
      {
        name: 'data',
        type: 'JSON',
        mode: 'NULLABLE',
        description: 'Event-specific JSON payload',
      },
    ],
  },

  metrics_daily: {
    name: 'metrics_daily',
    fields: [
      {
        name: 'date',
        type: 'DATE',
        mode: 'REQUIRED',
        description: 'Metrics date (YYYY-MM-DD)',
      },
      {
        name: 'school_id',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'School identifier',
      },
      {
        name: 'active_users',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Count of daily active users',
      },
      {
        name: 'reports_generated',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Count of reports generated',
      },
      {
        name: 'errors_count',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Count of errors recorded',
      },
      {
        name: 'api_calls',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Total API calls made',
      },
    ],
  },

  nps_responses: {
    name: 'nps_responses',
    fields: [
      {
        name: 'timestamp',
        type: 'TIMESTAMP',
        mode: 'REQUIRED',
        description: 'Response timestamp',
      },
      {
        name: 'school_id',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'School identifier',
      },
      {
        name: 'response_value',
        type: 'INTEGER',
        mode: 'REQUIRED',
        description: 'NPS score (0-10)',
      },
      {
        name: 'feedback_text',
        type: 'STRING',
        mode: 'NULLABLE',
        description: 'Qualitative feedback',
      },
      {
        name: 'user_id',
        type: 'STRING',
        mode: 'NULLABLE',
        description: 'Respondent user ID',
      },
    ],
  },

  revenue_transactions: {
    name: 'revenue_transactions',
    fields: [
      {
        name: 'date',
        type: 'DATE',
        mode: 'REQUIRED',
        description: 'Transaction date',
      },
      {
        name: 'school_id',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'School identifier',
      },
      {
        name: 'amount',
        type: 'NUMERIC',
        mode: 'REQUIRED',
        description: 'Transaction amount (INR)',
      },
      {
        name: 'transaction_type',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'subscription, payment, refund, credit',
      },
      {
        name: 'status',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'pending, completed, failed, refunded',
      },
      {
        name: 'invoice_id',
        type: 'STRING',
        mode: 'NULLABLE',
        description: 'Associated invoice ID',
      },
    ],
  },

  students_aggregate: {
    name: 'students_aggregate',
    fields: [
      {
        name: 'date',
        type: 'DATE',
        mode: 'REQUIRED',
        description: 'Snapshot date',
      },
      {
        name: 'school_id',
        type: 'STRING',
        mode: 'REQUIRED',
        description: 'School identifier',
      },
      {
        name: 'total_students',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Total enrolled students',
      },
      {
        name: 'active_students',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Students with login in last 7 days',
      },
      {
        name: 'avg_grade',
        type: 'NUMERIC',
        mode: 'NULLABLE',
        description: 'Average GPA/grade',
      },
      {
        name: 'avg_attendance',
        type: 'NUMERIC',
        mode: 'NULLABLE',
        description: 'Average attendance percentage',
      },
    ],
  },

  system_health: {
    name: 'system_health',
    fields: [
      {
        name: 'timestamp',
        type: 'TIMESTAMP',
        mode: 'REQUIRED',
        description: 'Health check timestamp',
      },
      {
        name: 'api_latency_ms',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'API response time (milliseconds)',
      },
      {
        name: 'error_rate_percent',
        type: 'NUMERIC',
        mode: 'NULLABLE',
        description: 'Percentage of failed requests',
      },
      {
        name: 'active_connections',
        type: 'INTEGER',
        mode: 'NULLABLE',
        description: 'Current active user connections',
      },
      {
        name: 'database_size_gb',
        type: 'NUMERIC',
        mode: 'NULLABLE',
        description: 'Firestore database size',
      },
    ],
  },
};

// BigQuery CLI commands to create all tables
export const BIGQUERY_SETUP_COMMANDS = `
# Step 1: Create dataset
bq mk --dataset --location=US school_erp_analytics

# Step 2: Create events table
bq mk --table school_erp_analytics.events \\
  timestamp:TIMESTAMP,event_type:STRING,school_id:STRING,user_id:STRING,data:JSON

# Step 3: Create metrics_daily table
bq mk --table school_erp_analytics.metrics_daily \\
  date:DATE,school_id:STRING,active_users:INTEGER,reports_generated:INTEGER,errors_count:INTEGER,api_calls:INTEGER

# Step 4: Create nps_responses table
bq mk --table school_erp_analytics.nps_responses \\
  timestamp:TIMESTAMP,school_id:STRING,response_value:INTEGER,feedback_text:STRING,user_id:STRING

# Step 5: Create revenue_transactions table
bq mk --table school_erp_analytics.revenue_transactions \\
  date:DATE,school_id:STRING,amount:NUMERIC,transaction_type:STRING,status:STRING,invoice_id:STRING

# Step 6: Create students_aggregate table
bq mk --table school_erp_analytics.students_aggregate \\
  date:DATE,school_id:STRING,total_students:INTEGER,active_students:INTEGER,avg_grade:NUMERIC,avg_attendance:NUMERIC

# Step 7: Create system_health table
bq mk --table school_erp_analytics.system_health \\
  timestamp:TIMESTAMP,api_latency_ms:INTEGER,error_rate_percent:NUMERIC,active_connections:INTEGER,database_size_gb:NUMERIC
`;

// TypeScript types for events
export enum AnalyticsEventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  DASHBOARD_VIEWED = 'dashboard_viewed',
  REPORT_GENERATED = 'report_generated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  ERROR = 'error',
  API_CALL = 'api_call',
  ATTENDANCE_MARKED = 'attendance_marked',
  GRADE_ENTERED = 'grade_entered',
  NOTIFICATION_SENT = 'notification_sent',
  NPS_RESPONSE = 'nps_response',
  INVITATION = 'invitation',
}

export interface AnalyticsEvent {
  timestamp: Date;
  event_type: AnalyticsEventType;
  school_id: string;
  user_id: string;
  data?: Record<string, any>;
}

export interface MetricsDaily {
  date: string;
  school_id: string;
  active_users: number;
  reports_generated: number;
  errors_count: number;
  api_calls: number;
}

export interface NPSResponse {
  timestamp: Date;
  school_id: string;
  response_value: number;
  feedback_text?: string;
  user_id?: string;
}

export interface RevenueTransaction {
  date: string;
  school_id: string;
  amount: number;
  transaction_type: 'subscription' | 'payment' | 'refund' | 'credit';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoice_id?: string;
}
