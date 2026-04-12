import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { Exam, ExamFormData } from '@/components/exam/ExamEditor'
import { StudentAnswer } from '@/components/exam/ExamAnswerer'
import { ExamResult } from '@/components/exam/ResultsViewer'

export type ExamSliceStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface ExamSliceState {
  exams: Exam[]
  currentExam: Exam | null
  submissions: StudentAnswer[]
  results: ExamResult | null
  status: ExamSliceStatus
  error: string | null
}

const initialState: ExamSliceState = {
  exams: [],
  currentExam: null,
  submissions: [],
  results: null,
  status: 'idle',
  error: null,
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    // Set all exams
    setExams: (state, action: PayloadAction<Exam[]>) => {
      state.exams = action.payload
      state.error = null
    },

    // Set current exam being taken/edited
    setCurrentExam: (state, action: PayloadAction<Exam | null>) => {
      state.currentExam = action.payload
      state.error = null
    },

    // Add a new exam to the list
    addExam: (state, action: PayloadAction<Exam>) => {
      state.exams.push(action.payload)
      state.error = null
      state.status = 'succeeded'
    },

    // Update existing exam
    updateExam: (state, action: PayloadAction<Exam>) => {
      const index = state.exams.findIndex((e) => e.id === action.payload.id)
      if (index !== -1) {
        state.exams[index] = action.payload
      }
      if (state.currentExam?.id === action.payload.id) {
        state.currentExam = action.payload
      }
      state.error = null
      state.status = 'succeeded'
    },

    // Remove exam from list
    removeExam: (state, action: PayloadAction<string>) => {
      state.exams = state.exams.filter((e) => e.id !== action.payload)
      if (state.currentExam?.id === action.payload) {
        state.currentExam = null
      }
      state.error = null
    },

    // Record student answers for current exam
    addSubmission: (state, action: PayloadAction<StudentAnswer[]>) => {
      state.submissions = action.payload
      state.error = null
      state.status = 'succeeded'
    },

    // Clear submissions (start new exam)
    clearSubmissions: (state) => {
      state.submissions = []
      state.error = null
    },

    // Set exam results
    setResults: (state, action: PayloadAction<ExamResult | null>) => {
      state.results = action.payload
      state.error = null
    },

    // Set loading status
    setStatus: (state, action: PayloadAction<ExamSliceStatus>) => {
      state.status = action.payload
    },

    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      if (action.payload) {
        state.status = 'failed'
      }
    },

    // Reset exam state
    resetExamState: (state) => {
      state.currentExam = null
      state.submissions = []
      state.results = null
      state.status = 'idle'
      state.error = null
    },
  },
})

// Selectors
export const selectAllExams = (state: RootState) => state.exam.exams
export const selectCurrentExam = (state: RootState) => state.exam.currentExam
export const selectSubmissions = (state: RootState) => state.exam.submissions
export const selectResults = (state: RootState) => state.exam.results
export const selectExamStatus = (state: RootState) => state.exam.status
export const selectExamError = (state: RootState) => state.exam.error

// Select exam by ID
export const selectExamById = (state: RootState, examId: string) =>
  state.exam.exams.find((e) => e.id === examId)

// Select submission count
export const selectSubmissionCount = (state: RootState) => state.exam.submissions.length

export const {
  setExams,
  setCurrentExam,
  addExam,
  updateExam,
  removeExam,
  addSubmission,
  clearSubmissions,
  setResults,
  setStatus,
  setError,
  resetExamState,
} = examSlice.actions

export default examSlice.reducer
