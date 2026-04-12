// Report Types and Interfaces

export enum ReportType {
  ATTENDANCE = 'attendance',
  GRADES = 'grades',
  FEES = 'fees',
  TEACHER = 'teacher',
  SUMMARY = 'summary',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export enum ReportStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface ReportFilter {
  dateRange?: {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
  };
  section?: string[];
  subject?: string[];
  status?: string[];
  teacherId?: string;
  studentId?: string;
}

export interface ReportColumn {
  field: string;
  label: string;
  width?: number;
  format?: 'text' | 'number' | 'percent' | 'currency' | 'date';
}

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

export interface ReportDefinition {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  type: ReportType;
  filters: ReportFilter;
  columns: ReportColumn[];
  sortBy?: SortOption[];
  groupBy?: string;
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  isTemplate: boolean;
  isPublic: boolean;
}

export interface ReportExecution {
  id: string;
  schoolId: string;
  reportId: string;
  status: ReportStatus;
  startedAt: Date;
  completedAt?: Date;
  rowCount: number;
  fileSize: number;
  downloadUrl?: string;
  exportFormat: ExportFormat;
  generatedBy: string;
  error?: string;
  expiresAt: Date;
}

export interface ReportSchedule {
  id: string;
  schoolId: string;
  reportId: string;
  frequency: ScheduleFrequency;
  time: string; // HH:MM format (IST)
  dayOfWeek?: string; // monday, tuesday, etc
  dayOfMonth?: number; // 1-31
  recipients: string[]; // email addresses
  format: ExportFormat;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}

export interface ReportData {
  reportId: string;
  name: string;
  type: ReportType;
  generatedAt: Date;
  rowCount: number;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  downloadUrl?: string;
  expiresAt: Date;
}

export interface ReportGenerationRequest {
  name: string;
  description?: string;
  type: ReportType;
  filters: ReportFilter;
  columns: ReportColumn[];
  sortBy?: SortOption[];
  groupBy?: string;
  exportFormat?: ExportFormat;
}

export interface ReportScheduleRequest {
  reportId: string;
  frequency: ScheduleFrequency;
  time: string;
  dayOfWeek?: string;
  dayOfMonth?: number;
  recipients: string[];
  format: ExportFormat;
}
