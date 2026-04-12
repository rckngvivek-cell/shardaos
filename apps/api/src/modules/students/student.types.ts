export interface Student {
  studentId: string;
  schoolId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  gender?: string;
  rollNumber: string;
  class: number;
  section: string;
  status: 'active' | 'inactive' | 'deleted';
  enrollmentDate: string;
  contact: {
    parentName: string;
    parentEmail?: string;
    parentPhone: string;
    emergencyContact?: string;
    emergencyContactName?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  medicalInfo?: {
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateStudentInput = Omit<
  Student,
  'studentId' | 'schoolId' | 'createdBy' | 'createdAt' | 'updatedAt'
>;
