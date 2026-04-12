// Export exam slice and all public types
export { default as examReducer } from './examSlice';
export {
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
  selectAllExams,
  selectCurrentExam,
  selectSubmissions,
  selectResults,
  selectExamStatus,
  selectExamError,
  selectExamById,
  selectSubmissionCount,
} from './examSlice';
export type { ExamSliceState } from './examSlice';
