export interface Grade {
  id: string;
  schoolId: string;
  studentId: string;
  subject: string;
  examName: string;
  examDate: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks?: string;
  gradedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeInput {
  studentId: string;
  subject: string;
  examName: string;
  examDate: string;
  maxMarks: number;
  obtainedMarks: number;
  remarks?: string;
}

export interface Assessment {
  id: string;
  schoolId: string;
  name: string;
  subject: string;
  grade: string;
  section: string;
  maxMarks: number;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface ReportCard {
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  academicYear: string;
  subjects: Array<{
    subject: string;
    examName: string;
    maxMarks: number;
    obtainedMarks: number;
    grade: string;
  }>;
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  overallGrade: string;
  attendance: {
    totalDays: number;
    daysPresent: number;
    percentage: number;
  };
}
