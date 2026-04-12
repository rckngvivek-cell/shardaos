import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import examReducer from '../features/exam/examSlice';
import { ExamList } from './ExamList';
import { ExamAnswerer } from './ExamAnswerer';
import { ResultsViewer } from './ResultsViewer';

// Mock RTK Query
vi.mock('../services/examApi', () => ({
  useGetExamsQuery: vi.fn(),
  useCreateExamMutation: vi.fn(),
  useSubmitExamMutation: vi.fn(),
  useGetSubmissionsQuery: vi.fn(),
  useGetResultsQuery: vi.fn(),
  useCreateResultMutation: vi.fn(),
  examApi: { reducerPath: 'examApi' }
}));

// Mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      exam: examReducer
    }
  });
};

// ============== EXAM LIST TESTS ==============
describe('ExamList Component', () => {
  it('should render loading state', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    });

    render(<ExamList schoolId="school-1" />);
    expect(screen.getByText('Loading exams...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch' }
    });

    render(<ExamList schoolId="school-1" />);
    expect(screen.getByText(/Failed to load exams/)).toBeInTheDocument();
  });

  it('should render list of exams', () => {
    const { useGetExamsQuery, useCreateExamMutation } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            schoolId: 'school-1',
            title: 'Math Exam',
            subject: 'Math',
            totalMarks: 100,
            durationMinutes: 60,
            classId: 'class-10',
            startTime: '2024-01-20T09:00:00Z',
            endTime: '2024-01-20T10:00:00Z',
            status: 'scheduled',
            createdAt: '2024-01-20T08:00:00Z',
            updatedAt: '2024-01-20T08:00:00Z'
          },
          {
            id: '2',
            schoolId: 'school-1',
            title: 'Science Exam',
            subject: 'Science',
            totalMarks: 80,
            durationMinutes: 90,
            classId: 'class-10',
            startTime: '2024-01-21T09:00:00Z',
            endTime: '2024-01-21T10:30:00Z',
            status: 'draft',
            createdAt: '2024-01-20T08:00:00Z',
            updatedAt: '2024-01-20T08:00:00Z'
          }
        ]
      },
      isLoading: false,
      error: null
    });
    useCreateExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(<ExamList schoolId="school-1" isAdmin={false} />);
    expect(screen.getByText('Math Exam')).toBeInTheDocument();
    expect(screen.getByText('Science Exam')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('should display correct status badges', () => {
    const { useGetExamsQuery, useCreateExamMutation } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            schoolId: 'school-1',
            title: 'Test Exam',
            subject: 'Math',
            totalMarks: 100,
            durationMinutes: 60,
            classId: 'class-10',
            startTime: '2024-01-20T09:00:00Z',
            endTime: '2024-01-20T10:00:00Z',
            status: 'ongoing',
            createdAt: '2024-01-20T08:00:00Z',
            updatedAt: '2024-01-20T08:00:00Z'
          }
        ]
      },
      isLoading: false,
      error: null
    });
    useCreateExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(<ExamList schoolId="school-1" />);
    expect(screen.getByText('ongoing')).toBeInTheDocument();
  });

  it('should show empty state when no exams', () => {
    const { useGetExamsQuery, useCreateExamMutation } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null
    });
    useCreateExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(<ExamList schoolId="school-1" />);
    expect(screen.getByText('No exams found for this school.')).toBeInTheDocument();
  });

  it('should show create form on admin mode', () => {
    const { useGetExamsQuery, useCreateExamMutation } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null
    });
    useCreateExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(<ExamList schoolId="school-1" isAdmin={true} />);
    expect(screen.getByText('+ New Exam')).toBeInTheDocument();
  });

  it('should call onSelectExam when exam card clicked', () => {
    const { useGetExamsQuery, useCreateExamMutation } = require('../services/examApi');
    const mockExam = {
      id: '1',
      schoolId: 'school-1',
      title: 'Math Exam',
      subject: 'Math',
      totalMarks: 100,
      durationMinutes: 60,
      classId: 'class-10',
      startTime: '2024-01-20T09:00:00Z',
      endTime: '2024-01-20T10:00:00Z',
      status: 'scheduled',
      createdAt: '2024-01-20T08:00:00Z',
      updatedAt: '2024-01-20T08:00:00Z'
    };

    useGetExamsQuery.mockReturnValue({
      data: { data: [mockExam] },
      isLoading: false,
      error: null
    });
    useCreateExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    const mockOnSelect = vi.fn();
    render(<ExamList schoolId="school-1" onSelectExam={mockOnSelect} />);
    
    const examCard = screen.getByRole('button', { name: /Math Exam/i });
    fireEvent.click(examCard);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockExam);
  });
});

// ============== EXAM ANSWERER TESTS ==============
describe('ExamAnswerer Component', () => {
  const mockQuestions = [
    {
      id: 'q1',
      text: 'What is 2 + 2?',
      type: 'mcq' as const,
      options: ['3', '4', '5', '6'],
      marks: 5
    },
    {
      id: 'q2',
      text: 'Explain photosynthesis.',
      type: 'essay' as const,
      marks: 10
    }
  ];

  const store = createMockStore();

  it('should render first question by default', () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('should display timer', () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    expect(screen.getByText(/⏱️/)).toBeInTheDocument();
  });

  it('should navigate to next question', async () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    const nextBtn = screen.getByText('Next →');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Explain photosynthesis.')).toBeInTheDocument();
    });
  });

  it('should record answer for MCQ', async () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    const option = screen.getByDisplayValue('4');
    fireEvent.click(option);

    await waitFor(() => {
      expect((option as HTMLInputElement).checked).toBe(true);
    });
  });

  it('should record answer for essay', async () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    const nextBtn = screen.getByText('Next →');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Enter your answer here...');
      fireEvent.change(textarea, { target: { value: 'Photosynthesis is...' } });
      expect((textarea as HTMLTextAreaElement).value).toBe('Photosynthesis is...');
    });
  });

  it('should show answer progress', async () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    expect(screen.getByText(/Answered: 0\/2/)).toBeInTheDocument();
  });

  it('should submit exam with all answers', async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ success: true });
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([mockSubmit, { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    const option = screen.getByDisplayValue('4');
    fireEvent.click(option);

    const nextBtn = screen.getByText('Next →');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Enter your answer here...');
      fireEvent.change(textarea, { target: { value: 'Photosynthesis is...' } });
    });

    const submitBtn = screen.getByText('Submit Exam');
    fireEvent.click(submitBtn);

    // Confirm dialog
    window.confirm = vi.fn().mockReturnValue(true);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('should disable submit when no answers given', () => {
    const { useSubmitExamMutation } = require('../services/examApi');
    useSubmitExamMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    render(
      <Provider store={store}>
        <ExamAnswerer
          examId="exam-1"
          studentId="student-1"
          schoolId="school-1"
          questions={mockQuestions}
          durationMinutes={1}
          totalMarks={15}
        />
      </Provider>
    );

    const submitBtn = screen.getByText('Submit Exam');
    expect(submitBtn).toBeDisabled();
  });
});

// ============== RESULTS VIEWER TESTS ==============
describe('ResultsViewer Component', () => {
  const mockResults = [
    {
      id: 'r1',
      schoolId: 'school-1',
      examId: 'exam-1',
      studentId: 'student-1',
      score: 85,
      totalMarks: 100,
      percentage: 85,
      grade: 'A',
      submittedAt: '2024-01-20T10:00:00Z',
      gradedAt: '2024-01-20T10:30:00Z',
      status: 'graded' as const
    },
    {
      id: 'r2',
      schoolId: 'school-1',
      examId: 'exam-1',
      studentId: 'student-2',
      score: 65,
      totalMarks: 100,
      percentage: 65,
      grade: 'C',
      submittedAt: '2024-01-20T10:05:00Z',
      gradedAt: '2024-01-20T10:35:00Z',
      status: 'graded' as const
    },
    {
      id: 'r3',
      schoolId: 'school-1',
      examId: 'exam-1',
      studentId: 'student-3',
      score: 35,
      totalMarks: 100,
      percentage: 35,
      grade: 'F',
      submittedAt: '2024-01-20T10:10:00Z',
      gradedAt: '2024-01-20T10:40:00Z',
      status: 'graded' as const
    }
  ];

  it('should render loading state', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    expect(screen.getByText('Loading results...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch' }
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    expect(screen.getByText(/Failed to load results/)).toBeInTheDocument();
  });

  it('should display results table', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: { data: mockResults },
      isLoading: false,
      error: null
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    expect(screen.getByText('student-1')).toBeInTheDocument();
    expect(screen.getByText('student-2')).toBeInTheDocument();
    expect(screen.getByText('student-3')).toBeInTheDocument();
  });

  it('should display statistics in admin view', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: { data: mockResults },
      isLoading: false,
      error: null
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    expect(screen.getByText('Total Results')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
  });

  it('should calculate correct pass rate', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: { data: mockResults },
      isLoading: false,
      error: null
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    // 2 passed (85%, 65%) out of 3 = 66.67%
    expect(screen.getByText(/66\.67%/)).toBeInTheDocument();
  });

  it('should highlight pass/fail rows correctly', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: { data: mockResults },
      isLoading: false,
      error: null
    });

    const { container } = render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    const rows = container.querySelectorAll('.row-pass, .row-fail');
    expect(rows.length).toBe(3);
  });

  it('should display grades correctly', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: { data: mockResults },
      isLoading: false,
      error: null
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('should show empty state when no results', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null
    });

    render(<ResultsViewer schoolId="school-1" viewMode="admin" />);
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
});
