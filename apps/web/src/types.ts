export interface Student {
  studentId: string;
  schoolId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  gender?: 'M' | 'F' | 'O';
  aadhar?: string;
  rollNumber: string;
  class: number;
  section: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'transferred' | 'left' | 'deleted';
  contact: {
    parentName: string;
    parentEmail?: string;
    parentPhone: string;
    emergencyContact?: string;
    emergencyContactName?: string;
  };
}

export interface School {
  schoolId: string;
  name: string;
  city: string;
  state: string;
  studentCount: number;
  staffCount: number;
  subscription: {
    tier: string;
    status: string;
    monthlyFee: number;
    currency: string;
  };
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: Record<string, unknown>;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late';

export interface AttendanceStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  class: number;
  section: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  attendanceId: string;
  schoolId: string;
  date: string;
  class: number;
  section: string;
  submittedAt?: string;
  submittedBy?: string;
  summary: {
    totalStudents: number;
    present: number;
    absent: number;
    leave: number;
    late: number;
  };
  records: AttendanceStudent[];
}

export interface AttendanceQuery {
  schoolId: string;
  date: string;
  class: number;
  section: string;
}

export interface AttendanceSubmission {
  schoolId: string;
  date: string;
  class: number;
  section: string;
  submittedBy?: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    note?: string;
  }>;
}
