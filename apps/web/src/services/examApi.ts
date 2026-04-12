import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Exam {
  id: string;
  schoolId: string;
  title: string;
  subject: string;
  totalMarks: number;
  durationMinutes: number;
  classId: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ExamSubmission {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
  createdAt: string;
  status: 'submitted' | 'graded' | 'resubmitted';
  score?: number;
}

export interface ExamResult {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  submittedAt: string;
  gradedAt: string;
  status: 'graded' | 'pending';
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

export const examApi = createApi({
  reducerPath: 'examApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  endpoints: (builder) => ({
    // Exams
    getExams: builder.query<{ success: boolean; data: Exam[]; count: number }, { schoolId: string }>({
      query: ({ schoolId }) => ({
        url: '/exams',
        params: { schoolId }
      })
    }),

    createExam: builder.mutation<{ success: boolean; data: Exam }, Partial<Exam>>({
      query: (exam) => ({
        url: '/exams',
        method: 'POST',
        body: exam
      })
    }),

    // Submissions
    submitExam: builder.mutation<{ success: boolean; data: ExamSubmission }, Omit<ExamSubmission, 'id' | 'createdAt' | 'status'>>({
      query: (submission) => ({
        url: '/submissions',
        method: 'POST',
        body: submission
      })
    }),

    getSubmissions: builder.query<
      { success: boolean; data: ExamSubmission[]; count: number },
      { schoolId: string; examId?: string; studentId?: string }
    >({
      query: (params) => ({
        url: '/submissions',
        params
      })
    }),

    // Results
    getResults: builder.query<
      { success: boolean; data: ExamResult[]; count: number },
      { schoolId: string; examId?: string; studentId?: string }
    >({
      query: (params) => ({
        url: '/results',
        params
      })
    }),

    createResult: builder.mutation<{ success: boolean; data: ExamResult }, Omit<ExamResult, 'id' | 'status'>>({
      query: (result) => ({
        url: '/results',
        method: 'POST',
        body: result
      })
    })
  })
});

export const {
  useGetExamsQuery,
  useCreateExamMutation,
  useSubmitExamMutation,
  useGetSubmissionsQuery,
  useGetResultsQuery,
  useCreateResultMutation
} = examApi;
