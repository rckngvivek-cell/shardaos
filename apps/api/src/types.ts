export type StudentStatus = "active" | "inactive" | "transferred" | "left";

export interface StudentContact {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

export interface StudentRecord {
  studentId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  rollNumber: string;
  class: number;
  section: string;
  status: StudentStatus;
  contact: StudentContact;
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface SchoolRecord {
  schoolId: string;
  name: string;
  city: string;
  state: string;
  principalName: string;
  studentCount: number;
  activeModules: string[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

