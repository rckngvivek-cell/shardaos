/**
 * Exam/Assessment Module TypeScript Interfaces
 * Module 3 - Assessment & Grading System
 * Week 7 Day 1
 */

/**
 * ExamConfig: Core exam metadata and configuration
 * Defines the structure and parameters of an exam
 */
export interface ExamConfig {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number; // percentage or points threshold
  description?: string;
  instructions?: string;
  isPublished: boolean;
  createdBy: string; // staff/teacher ID
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question: Individual exam question
 * Represents a single question in an exam's question bank
 */
export interface Question {
  id: string;
  text: string;
  options: string[]; // array of answer options
  correctAnswer: number | string; // index or ID of correct answer
  explanation: string; // explanation for the correct answer
  marks: number; // points for this question
  difficulty: 'easy' | 'medium' | 'hard';
  type?: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
}

/**
 * QuestionBank: Collection of questions for an exam
 * Manages all questions associated with a specific exam
 */
export interface QuestionBank {
  id: string;
  examId: string; // reference to ExamConfig
  questions: Question[];
  totalQuestions: number;
  createdBy: string; // staff/teacher ID
  createdAt: Date;
  updatedAt: Date;
}

/**
 * StudentExam: Student's exam attempt/session
 * Tracks a single student's attempt at taking an exam
 */
export interface StudentExam {
  id: string;
  studentId: string; // reference to student
  examId: string; // reference to ExamConfig
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  answers: StudentAnswer[];
  totalTimeSpent?: number; // in seconds
  attemptNumber: number;
}

/**
 * StudentAnswer: Single answer provided by student
 * Represents one question-answer pair in a student's exam submission
 */
export interface StudentAnswer {
  questionId: string;
  selectedOption: number | string | null; // null if unanswered
  markedAt: Date;
  isCorrect?: boolean; // populated during grading
  timeSpent?: number; // in seconds
}

/**
 * GradeResult: Final grade and assessment outcome
 * Contains scoring and grading information for a student's exam attempt
 */
export interface GradeResult {
  id: string;
  studentId: string;
  examId: string;
  studentExamId: string; // reference to StudentExam
  totalScore: number; // actual points scored
  maxScore: number; // maximum possible points
  percentageScore: number; // calculated percentage
  passingStatus: 'pass' | 'fail';
  grade?: string; // letter grade A/B/C/D/F if applicable
  gradedAt: Date;
  gradedBy?: string; // teacher/auto-grader ID
  feedback: string; // teacher's feedback on the exam
  remarks?: string;
}

/**
 * Exam Assessment Query Result
 * Used for list responses and reporting
 */
export interface ExamAssessmentResult {
  examConfig: ExamConfig;
  studentExam: StudentExam;
  gradeResult: GradeResult;
  accuracy: number; // percentage of correct answers
}

/**
 * Exam Statistics
 * Aggregated data for exam performance analysis
 */
export interface ExamStatistics {
  examId: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number; // percentage
  averageTimeSpent: number; // in seconds
  medianScore: number;
  highestScore: number;
  lowestScore: number;
}
