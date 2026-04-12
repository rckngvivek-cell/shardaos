// Pre-built Report Templates

import {
  ReportType,
  ReportColumn,
  SortOption,
  ReportFilter,
} from './types';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  defaultColumns: ReportColumn[];
  defaultFilters: ReportFilter;
  defaultSort?: SortOption[];
  defaultGroupBy?: string;
  dataQueryFn: (schoolId: string, filters: ReportFilter) => Promise<any[]>;
}

// Template Data Query Functions (will be implemented with actual data fetching)
const attendanceQueries = {
  dailyAttendance: async (schoolId: string, filters: ReportFilter) => {
    // Query Firestore for attendance records
    return [];
  },
  monthlyAttendance: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  attendanceTrends: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  absentToday: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  leaveApplications: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
};

const gradesQueries = {
  termGrades: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  subjectPerformance: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  studentGrades: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  classPerformance: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  toppersList: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
};

const feesQueries = {
  feeCollection: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  pendingFees: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  latePayments: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
};

const teacherQueries = {
  classesAssigned: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  lessonPlanAdherence: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  examSchedule: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
};

const summaryQueries = {
  kpiDashboard: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  schoolPerformance: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  enrollmentTrends: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
  adminDashboard: async (schoolId: string, filters: ReportFilter) => {
    return [];
  },
};

// 20+ Pre-built Templates
export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  // ATTENDANCE TEMPLATES (5)
  daily_attendance_summary: {
    id: 'daily_attendance_summary',
    name: 'Daily Attendance Summary',
    description: 'All students attendance for a specific day, grouped by section',
    type: ReportType.ATTENDANCE,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'rollNumber', label: 'Roll #' },
      { field: 'section', label: 'Section' },
      { field: 'status', label: 'Status' },
      { field: 'markedBy', label: 'Marked By' },
    ],
    defaultFilters: {
      dateRange: {
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
    },
    defaultSort: [{ field: 'section', order: 'asc' }],
    dataQueryFn: attendanceQueries.dailyAttendance,
  },

  monthly_attendance_report: {
    id: 'monthly_attendance_report',
    name: 'Monthly Attendance Report',
    description: 'Complete attendance data for entire month',
    type: ReportType.ATTENDANCE,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'rollNumber', label: 'Roll #' },
      { field: 'presentDays', label: 'Present Days', format: 'number' },
      { field: 'absentDays', label: 'Absent Days', format: 'number' },
      { field: 'attendancePercent', label: 'Attendance %', format: 'percent' },
      { field: 'status', label: 'Status' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'attendancePercent', order: 'desc' }],
    dataQueryFn: attendanceQueries.monthlyAttendance,
  },

  attendance_trends: {
    id: 'attendance_trends',
    name: 'Student Attendance Trends',
    description: '6-month attendance trend per student',
    type: ReportType.ATTENDANCE,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'month1', label: 'Month 1 %', format: 'percent' },
      { field: 'month2', label: 'Month 2 %', format: 'percent' },
      { field: 'month3', label: 'Month 3 %', format: 'percent' },
      { field: 'month4', label: 'Month 4 %', format: 'percent' },
      { field: 'month5', label: 'Month 5 %', format: 'percent' },
      { field: 'month6', label: 'Month 6 %', format: 'percent' },
      { field: 'average', label: 'Average %', format: 'percent' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'average', order: 'asc' }],
    dataQueryFn: attendanceQueries.attendanceTrends,
  },

  absent_students_today: {
    id: 'absent_students_today',
    name: 'Absent Students Today',
    description: 'Quick list of students absent today',
    type: ReportType.ATTENDANCE,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'rollNumber', label: 'Roll #' },
      { field: 'section', label: 'Section' },
      { field: 'parentPhone', label: 'Parent Phone' },
      { field: 'notificationSent', label: 'Notified' },
    ],
    defaultFilters: {
      status: ['absent'],
      dateRange: {
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
    },
    dataQueryFn: attendanceQueries.absentToday,
  },

  leave_applications: {
    id: 'leave_applications',
    name: 'Leave Applications',
    description: 'All leave applications - pending, approved, rejected',
    type: ReportType.ATTENDANCE,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'fromDate', label: 'From Date', format: 'date' },
      { field: 'toDate', label: 'To Date', format: 'date' },
      { field: 'reason', label: 'Reason' },
      { field: 'status', label: 'Status' },
      { field: 'approvedBy', label: 'Approved By' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'status', order: 'asc' }],
    dataQueryFn: attendanceQueries.leaveApplications,
  },

  // GRADES TEMPLATES (5)
  term_grades_summary: {
    id: 'term_grades_summary',
    name: 'Term Grades Summary',
    description: 'All subjects, all students, term grades',
    type: ReportType.GRADES,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'rollNumber', label: 'Roll #' },
      { field: 'math', label: 'Math', format: 'number' },
      { field: 'english', label: 'English', format: 'number' },
      { field: 'science', label: 'Science', format: 'number' },
      { field: 'socialStudies', label: 'Social Studies', format: 'number' },
      { field: 'average', label: 'Average', format: 'number' },
      { field: 'grade', label: 'Grade' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'average', order: 'desc' }],
    dataQueryFn: gradesQueries.termGrades,
  },

  subject_performance_report: {
    id: 'subject_performance_report',
    name: 'Subject Performance Report',
    description: 'Single subject analysis across all students',
    type: ReportType.GRADES,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'marks', label: 'Marks', format: 'number' },
      { field: 'outOf', label: 'Out of', format: 'number' },
      { field: 'percentage', label: '%', format: 'percent' },
      { field: 'grade', label: 'Grade' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'marks', order: 'desc' }],
    dataQueryFn: gradesQueries.subjectPerformance,
  },

  student_grades: {
    id: 'student_grades',
    name: 'Individual Student Grades',
    description: 'All subjects for a specific student',
    type: ReportType.GRADES,
    defaultColumns: [
      { field: 'subject', label: 'Subject' },
      { field: 'exam', label: 'Exam' },
      { field: 'marks', label: 'Marks', format: 'number' },
      { field: 'outOf', label: 'Out of', format: 'number' },
      { field: 'percentage', label: '%', format: 'percent' },
      { field: 'grade', label: 'Grade' },
      { field: 'teacher', label: 'Subject Teacher' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'exam', order: 'asc' }],
    dataQueryFn: gradesQueries.studentGrades,
  },

  class_performance_distribution: {
    id: 'class_performance_distribution',
    name: 'Class Performance Distribution',
    description: 'Average, median, distribution stats for a class',
    type: ReportType.GRADES,
    defaultColumns: [
      { field: 'subject', label: 'Subject' },
      { field: 'average', label: 'Average', format: 'number' },
      { field: 'median', label: 'Median', format: 'number' },
      { field: 'highestScore', label: 'Highest', format: 'number' },
      { field: 'lowestScore', label: 'Lowest', format: 'number' },
      { field: 'stdDeviation', label: 'Std Dev', format: 'number' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'average', order: 'desc' }],
    dataQueryFn: gradesQueries.classPerformance,
  },

  topper_list: {
    id: 'topper_list',
    name: 'Topper List by Subject',
    description: 'Highest performers by subject',
    type: ReportType.GRADES,
    defaultColumns: [
      { field: 'rank', label: 'Rank' },
      { field: 'studentName', label: 'Student Name' },
      { field: 'section', label: 'Section' },
      { field: 'subject', label: 'Subject' },
      { field: 'marks', label: 'Marks', format: 'number' },
      { field: 'percentage', label: '%', format: 'percent' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'marks', order: 'desc' }],
    dataQueryFn: gradesQueries.toppersList,
  },

  // FEES TEMPLATES (3)
  fee_collection_report: {
    id: 'fee_collection_report',
    name: 'Monthly Fee Collection',
    description: 'Payment status and collection summary by month',
    type: ReportType.FEES,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'feeAmount', label: 'Amount Due', format: 'currency' },
      { field: 'paidAmount', label: 'Amount Paid', format: 'currency' },
      { field: 'pendingAmount', label: 'Pending', format: 'currency' },
      { field: 'paymentDate', label: 'Payment Date', format: 'date' },
      { field: 'paymentMode', label: 'Mode' },
      { field: 'status', label: 'Status' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'status', order: 'asc' }],
    dataQueryFn: feesQueries.feeCollection,
  },

  pending_fees_report: {
    id: 'pending_fees_report',
    name: 'Pending Fees Report',
    description: 'Outstanding fees by student',
    type: ReportType.FEES,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'className', label: 'Class' },
      { field: 'totalPending', label: 'Total Pending', format: 'currency' },
      { field: 'dueDate', label: 'Due Date', format: 'date' },
      { field: 'daysPending', label: 'Days Pending' },
      { field: 'parentPhone', label: 'Parent Phone' },
    ],
    defaultFilters: { status: ['pending'] },
    defaultSort: [{ field: 'totalPending', order: 'desc' }],
    dataQueryFn: feesQueries.pendingFees,
  },

  late_payment_report: {
    id: 'late_payment_report',
    name: 'Late Payment Report',
    description: 'Payments overdue by number of days',
    type: ReportType.FEES,
    defaultColumns: [
      { field: 'studentName', label: 'Student Name' },
      { field: 'amount', label: 'Amount', format: 'currency' },
      { field: 'dueDate', label: 'Due Date', format: 'date' },
      { field: 'daysOverdue', label: 'Days Overdue' },
      { field: 'lastReminder', label: 'Last Reminder', format: 'date' },
      { field: 'reminderCount', label: 'Reminders Sent' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'daysOverdue', order: 'desc' }],
    dataQueryFn: feesQueries.latePayments,
  },

  // TEACHER TEMPLATES (3)
  classes_assigned: {
    id: 'classes_assigned',
    name: 'Classes Assigned',
    description: 'Classes and periods assigned to each teacher',
    type: ReportType.TEACHER,
    defaultColumns: [
      { field: 'teacherName', label: 'Teacher Name' },
      { field: 'subject', label: 'Subject' },
      { field: 'class', label: 'Class' },
      { field: 'section', label: 'Section' },
      { field: 'periods', label: 'Periods/Week' },
      { field: 'schedule', label: 'Schedule' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'teacherName', order: 'asc' }],
    dataQueryFn: teacherQueries.classesAssigned,
  },

  lesson_plan_adherence: {
    id: 'lesson_plan_adherence',
    name: 'Lesson Plan Adherence',
    description: 'Compare planned vs actual attendance',
    type: ReportType.TEACHER,
    defaultColumns: [
      { field: 'teacherName', label: 'Teacher Name' },
      { field: 'subject', label: 'Subject' },
      { field: 'plannedLessons', label: 'Planned' },
      { field: 'completedLessons', label: 'Completed' },
      { field: 'adherencePercent', label: 'Adherence %', format: 'percent' },
      { field: 'classesHeld', label: 'Classes Held' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'adherencePercent', order: 'desc' }],
    dataQueryFn: teacherQueries.lessonPlanAdherence,
  },

  exam_conducting_schedule: {
    id: 'exam_conducting_schedule',
    name: 'Exam Conducting Schedule',
    description: 'Exams assigned to each teacher for conducting',
    type: ReportType.TEACHER,
    defaultColumns: [
      { field: 'teacherName', label: 'Teacher Name' },
      { field: 'examName', label: 'Exam Name' },
      { field: 'date', label: 'Date', format: 'date' },
      { field: 'time', label: 'Time' },
      { field: 'subject', label: 'Subject' },
      { field: 'className', label: 'Class' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'date', order: 'asc' }],
    dataQueryFn: teacherQueries.examSchedule,
  },

  // SUMMARY TEMPLATES (4)
  monthly_kpi_dashboard: {
    id: 'monthly_kpi_dashboard',
    name: 'Monthly KPI Dashboard',
    description: 'Key performance indicators for the month',
    type: ReportType.SUMMARY,
    defaultColumns: [
      { field: 'metric', label: 'Metric' },
      { field: 'value', label: 'Value' },
      { field: 'target', label: 'Target' },
      { field: 'achievement', label: 'Achievement %', format: 'percent' },
      { field: 'trend', label: 'Trend' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'metric', order: 'asc' }],
    dataQueryFn: summaryQueries.kpiDashboard,
  },

  school_performance_report: {
    id: 'school_performance_report',
    name: 'School Performance Report',
    description: 'Overall school health and performance metrics',
    type: ReportType.SUMMARY,
    defaultColumns: [
      { field: 'metric', label: 'Metric' },
      { field: 'current', label: 'Current' },
      { field: 'previous', label: 'Previous Month' },
      { field: 'target', label: 'Target' },
      { field: 'status', label: 'Status' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'metric', order: 'asc' }],
    dataQueryFn: summaryQueries.schoolPerformance,
  },

  enrollment_trends: {
    id: 'enrollment_trends',
    name: 'Enrollment Trends',
    description: 'New students, dropouts, and enrollment changes',
    type: ReportType.SUMMARY,
    defaultColumns: [
      { field: 'month', label: 'Month' },
      { field: 'totalEnrolled', label: 'Total Enrolled' },
      { field: 'newAdmissions', label: 'New Admissions' },
      { field: 'dropouts', label: 'Dropouts' },
      { field: 'netChange', label: 'Net Change' },
      { field: 'byClass', label: 'Distribution by Class' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'month', order: 'asc' }],
    dataQueryFn: summaryQueries.enrollmentTrends,
  },

  admin_dashboard_summary: {
    id: 'admin_dashboard_summary',
    name: 'Admin Dashboard Summary',
    description: 'Top-level dashboard for administration',
    type: ReportType.SUMMARY,
    defaultColumns: [
      { field: 'category', label: 'Category' },
      { field: 'metric', label: 'Metric' },
      { field: 'value', label: 'Value' },
      { field: 'lastUpdated', label: 'Last Updated', format: 'date' },
    ],
    defaultFilters: {},
    defaultSort: [{ field: 'category', order: 'asc' }],
    dataQueryFn: summaryQueries.adminDashboard,
  },
};

export const getTemplateById = (templateId: string): ReportTemplate | undefined => {
  return REPORT_TEMPLATES[templateId];
};

export const getTemplatesByType = (type: ReportType): ReportTemplate[] => {
  return Object.values(REPORT_TEMPLATES).filter((t) => t.type === type);
};

export const getAllTemplates = (): ReportTemplate[] => {
  return Object.values(REPORT_TEMPLATES);
};
