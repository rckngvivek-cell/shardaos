export type StudentAdmissionSourceType = 'direct' | 'admission_crm';

export interface StudentGuardianProfile {
  name: string;
  relationship?: string;
  phone: string;
  email?: string;
  sourceApplicantId?: string;
}

export interface StudentAdmissionSource {
  type: StudentAdmissionSourceType;
  applicantId?: string;
  applicantNumber?: string;
  sessionId?: string;
  sessionName?: string;
  convertedAt?: string;
  convertedBy?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  grade: string;
  section: string;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  guardianProfile?: StudentGuardianProfile;
  address: string;
  emergencyContact: string;
  bloodGroup?: string;
  admissionSourceType: StudentAdmissionSourceType;
  admissionSource?: StudentAdmissionSource;
  isActive: boolean;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  grade: string;
  section: string;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  guardianProfile?: StudentGuardianProfile;
  address: string;
  emergencyContact: string;
  bloodGroup?: string;
  admissionSourceType?: StudentAdmissionSourceType;
  admissionSource?: StudentAdmissionSource;
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {}
