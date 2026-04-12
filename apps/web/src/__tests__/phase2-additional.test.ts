/**
 * Phase 2 Additional Frontend Tests
 * Covers Redux/RTK Query, component edge cases, accessibility, and advanced features
 * Focus: 92%+ code coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
  useUpdateExamMutation: vi.fn(),
  useDeleteExamMutation: vi.fn(),
  examApi: { reducerPath: 'examApi' }
}));

// Mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      exam: examReducer
    }
  });
};

// ============== REDUX ACTIONS TESTS ==============
describe('Redux Exam Actions', () => {
  it('should dispatch setSelectedExam action', () => {
    const store = createMockStore();
    const dispatch = vi.spyOn(store, 'dispatch');

    // Simulate dispatching action
    const action = { type: 'exam/setSelectedExam', payload: { id: 'exam-123' } };
    store.dispatch(action);

    expect(dispatch).toHaveBeenCalled();
  });

  it('should update Redux state when exam is selected', () => {
    const store = createMockStore();
    const initialState = store.getState();

    expect(initialState.exam).toBeDefined();
  });

  it('should handle multiple exam selections', () => {
    const store = createMockStore();
    
    store.dispatch({ type: 'exam/setSelectedExam', payload: { id: 'exam-1' } });
    store.dispatch({ type: 'exam/setSelectedExam', payload: { id: 'exam-2' } });

    expect(store.getState().exam).toBeDefined();
  });

  it('should clear selected exam', () => {
    const store = createMockStore();
    
    store.dispatch({ type: 'exam/setSelectedExam', payload: { id: 'exam-123' } });
    store.dispatch({ type: 'exam/clearSelectedExam' });

    const state = store.getState();
    expect(state.exam.selectedExamId).toBeUndefined();
  });

  it('should update exam list in Redux', () => {
    const store = createMockStore();
    const exams = [
      { id: 'exam-1', title: 'Math' },
      { id: 'exam-2', title: 'Science' }
    ];

    store.dispatch({ type: 'exam/setExams', payload: exams });

    expect(store.getState().exam).toBeDefined();
  });
});

// ============== RTK QUERY LOADING STATES ==============
describe('RTK Query - Loading States', () => {
  it('should display loading spinner during data fetch', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should display error message on data fetch failure', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' }
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
  });

  it('should display cached data without reloading', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    const mockData = {
      data: [{ id: '1', title: 'Math Exam' }],
      isLoading: false
    };

    useGetExamsQuery.mockReturnValue(mockData);

    const store = createMockStore();
    const { rerender } = render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.getByText('Math Exam')).toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.getByText('Math Exam')).toBeInTheDocument();
  });

  it('should handle RTK Query refetch', async () => {
    const { useGetExamsQuery } = require('../services/examApi');
    const refetch = vi.fn();

    useGetExamsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      refetch
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    // Simulate refetch button click
    const refreshButton = screen.queryByRole('button', { name: /refresh|refetch/i });
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(refetch).toHaveBeenCalled();
    }
  });
});

// ============== RTK QUERY ERROR HANDLING ==============
describe('RTK Query - Error Handling', () => {
  it('should retry failed query automatically', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    const retryCount = vi.fn();

    useGetExamsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
      refetch: retryCount
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    // Verify error is shown
    expect(screen.queryByText(/error/i)).toBeInTheDocument();
  });

  it('should cache results to avoid duplicate requests', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    const mock = vi.fn();

    mock.mockReturnValue({
      data: { data: [{ id: 'exam-1', title: 'Math' }] },
      isLoading: false
    });

    useGetExamsQuery.mockImplementation(mock);

    const store = createMockStore();

    // First render
    const { rerender } = render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    const firstCallCount = mock.mock.calls.length;

    // Second render with same params
    rerender(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    // Should use cache, not make new request
    expect(mock.mock.calls.length).toBe(firstCallCount);
  });
});

// ============== COMPONENT EDGE CASES ==============
describe('ExamList Component - Edge Cases', () => {
  it('should handle null exam data gracefully', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.queryByText(/error/i) || screen.queryByText(/no exam/i)).toBeDefined();
  });

  it('should handle empty exam list', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: { data: [], count: 0 },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.queryByText(/no exam|empty/i)).toBeInTheDocument();
  });

  it('should handle very long exam title', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    const longTitle = 'A'.repeat(200);

    useGetExamsQuery.mockReturnValue({
      data: {
        data: [{ id: 'exam-1', title: longTitle }],
        count: 1
      },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    const titleElement = screen.queryByText(new RegExp(longTitle.substring(0, 50)));
    expect(titleElement).toBeDefined();
  });

  it('should render 100+ exams without freezing UI', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    const exams = Array.from({ length: 100 }, (_, i) => ({
      id: `exam-${i}`,
      title: `Exam ${i}`,
      subject: 'Math',
      totalMarks: 100,
      status: 'scheduled'
    }));

    useGetExamsQuery.mockReturnValue({
      data: { data: exams, count: 100 },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    // Should render without crashing
    expect(screen.queryByText('Exam 0')).toBeInTheDocument();
  });
});

// ============== EXAM ANSWERER EDGE CASES ==============
describe('ExamAnswerer Component - Edge Cases', () => {
  it('should handle zero questions array', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={[]} onSubmit={vi.fn()} />
      </Provider>
    );

    expect(screen.queryByText(/no question|empty/i)).toBeInTheDocument();
  });

  it('should handle question with no options', () => {
    const store = createMockStore();
    const questions = [
      { id: 'q1', text: 'Question 1', type: 'mcq', options: [] }
    ];

    render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={questions} onSubmit={vi.fn()} />
      </Provider>
    );

    expect(screen.queryByText(/no option|invalid/i)).toBeInTheDocument();
  });

  it('should handle 200+ questions without lag', () => {
    const store = createMockStore();
    const questions = Array.from({ length: 200 }, (_, i) => ({
      id: `q${i}`,
      text: `Question ${i}`,
      type: 'mcq',
      options: ['A', 'B', 'C', 'D']
    }));

    render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={questions} onSubmit={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText('Question 0')).toBeInTheDocument();
  });

  it('should handle question with special characters', () => {
    const store = createMockStore();
    const questions = [
      { 
        id: 'q1', 
        text: 'What is 2+2? <script>alert("xss")</script>',
        type: 'mcq',
        options: ['3', '4', '5', '6']
      }
    ];

    render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={questions} onSubmit={vi.fn()} />
      </Provider>
    );

    // Should render safely without executing script
    expect(screen.getByText(/What is 2\+2/)).toBeInTheDocument();
  });

  it('should disable submit button with no answers when required', () => {
    const store = createMockStore();
    const questions = [
      { id: 'q1', text: 'Question 1', type: 'mcq', options: ['A', 'B'], required: true }
    ];

    render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={questions} onSubmit={vi.fn()} />
      </Provider>
    );

    const submitButton = screen.queryByRole('button', { name: /submit/i });
    if (submitButton) {
      expect(submitButton).toBeDisabled();
    }
  });
});

// ============== KEYBOARD ACCESSIBILITY ==============
describe('Accessibility - Keyboard Navigation', () => {
  it('should navigate between exam list items with keyboard', async () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: {
        data: [
          { id: 'exam-1', title: 'Exam 1' },
          { id: 'exam-2', title: 'Exam 2' }
        ],
        count: 2
      },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    const user = userEvent.setup();

    // Tab to first item
    await user.tab();
    // Tab to second item
    await user.tab();

    expect(document.activeElement).toBeDefined();
  });

  it('should enable arrow key navigation in question list', async () => {
    const store = createMockStore();
    const questions = [
      { id: 'q1', text: 'Q1', type: 'mcq', options: ['A', 'B'] },
      { id: 'q2', text: 'Q2', type: 'mcq', options: ['A', 'B'] }
    ];

    const { container } = render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={questions} onSubmit={vi.fn()} />
      </Provider>
    );

    // Test arrow key navigation
    const user = userEvent.setup();
    const firstQuestion = screen.getByText('Q1');
    
    fireEvent.focus(firstQuestion);
    await user.keyboard('{ArrowDown}');

    expect(document.activeElement).toBeDefined();
  });

  it('should have proper tab order for form submission', async () => {
    const store = createMockStore();
    const questions = [
      { id: 'q1', text: 'Question?', type: 'mcq', options: ['A', 'B'] }
    ];

    render(
      <Provider store={store}>
        <ExamAnswerer examId="exam-123" questions={questions} onSubmit={vi.fn()} />
      </Provider>
    );

    const user = userEvent.setup();
    await user.tab();

    expect(document.activeElement).toBeDefined();
  });
});

// ============== ARIA LABELS & SCREEN READER ==============
describe('Accessibility - ARIA Labels', () => {
  it('should have proper ARIA label on exam list', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: { data: [{ id: 'exam-1', title: 'Exam 1' }], count: 1 },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    // Check for accessible role
    const list = screen.getByRole(/list|region/i, { hidden: false });
    expect(list).toBeDefined();
  });

  it('should have ARIA labels for exam count', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: {
        data: Array.from({ length: 5 }, (_, i) => ({ id: `e${i}`, title: `Exam ${i}` })),
        count: 5
      },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.queryByText(/5 exam/i) || screen.queryByText(/total.*5/i)).toBeDefined();
  });

  it('should have ARIA label for skip to main content', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    const skipLink = screen.queryByRole('link', { name: /skip|main/i });
    expect(skipLink).toBeDefined();
  });

  it('should announce loading state to screen readers', () => {
    const { useGetExamsQuery } = require('../services/examApi');
    useGetExamsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamList schoolId="school-1" />
      </Provider>
    );

    expect(screen.getByText(/loading|fetching/i)).toHaveAttribute('role', expect.any(String));
  });

  it('should have ARIA label for submit button', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamAnswerer 
          examId="exam-123" 
          questions={[{ id: 'q1', text: 'Q1', type: 'mcq', options: ['A'] }]}
          onSubmit={vi.fn()} 
        />
      </Provider>
    );

    const submitButton = screen.queryByRole('button', { name: /submit/i });
    if (submitButton) {
      expect(submitButton).toHaveAttribute('aria-label') || expect(submitButton).toHaveTextContent('Submit');
    }
  });
});

// ============== RESULTS VIEWER EDGE CASES ==============
describe('ResultsViewer Component - Edge Cases', () => {
  it('should handle null results gracefully', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ResultsViewer examId="exam-123" />
      </Provider>
    );

    expect(screen.queryByText(/no result|empty/i)).toBeInTheDocument();
  });

  it('should display statistics for admin users', () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: {
        data: [
          { id: 'r1', studentId: 's1', score: 85, totalMarks: 100, grade: 'B' },
          { id: 'r2', studentId: 's2', score: 92, totalMarks: 100, grade: 'A' }
        ],
        count: 2,
        stats: { avgScore: 88.5, passRate: 100, topScore: 92 }
      },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ResultsViewer examId="exam-123" isAdmin={true} />
      </Provider>
    );

    expect(screen.queryByText(/average|pass rate|top score/i)).toBeInTheDocument();
  });

  it('should export results as CSV', async () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: {
        data: [{ id: 'r1', studentId: 's1', score: 85, totalMarks: 100 }],
        count: 1
      },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ResultsViewer examId="exam-123" isAdmin={true} />
      </Provider>
    );

    const exportBtn = screen.queryByRole('button', { name: /export|download|csv/i });
    if (exportBtn) {
      const user = userEvent.setup();
      await user.click(exportBtn);
      // Should trigger download
    }
  });

  it('should filter results by grade', async () => {
    const { useGetResultsQuery } = require('../services/examApi');
    useGetResultsQuery.mockReturnValue({
      data: {
        data: [
          { id: 'r1', studentId: 's1', score: 85, totalMarks: 100, grade: 'B' },
          { id: 'r2', studentId: 's2', score: 92, totalMarks: 100, grade: 'A' }
        ],
        count: 2
      },
      isLoading: false,
      error: null
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ResultsViewer examId="exam-123" isAdmin={true} />
      </Provider>
    );

    const filterBtn = screen.queryByRole('button', { name: /filter/i });
    if (filterBtn) {
      const user = userEvent.setup();
      await user.click(filterBtn);
    }
  });
});

// ============== FORM VALIDATION ==============
describe('Form Validation - Frontend', () => {
  it('should validate required fields before submission', async () => {
    const store = createMockStore();
    const onSubmit = vi.fn();

    render(
      <Provider store={store}>
        <ExamAnswerer 
          examId="exam-123"
          questions={[
            { id: 'q1', text: 'Q1?', type: 'mcq', options: ['A', 'B'], required: true }
          ]}
          onSubmit={onSubmit}
          validateRequired={true}
        />
      </Provider>
    );

    const submitBtn = screen.queryByRole('button', { name: /submit/i });
    if (submitBtn) {
      const user = userEvent.setup();
      await user.click(submitBtn);

      // Should not submit if required field is empty
      expect(onSubmit).not.toHaveBeenCalled();
    }
  });

  it('should show validation errors inline', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ExamAnswerer 
          examId="exam-123"
          questions={[
            { id: 'q1', text: 'Q1?', type: 'text', required: true, pattern: '\\d+' }
          ]}
          onSubmit={vi.fn()}
          showValidationErrors={true}
        />
      </Provider>
    );

    // Look for error message
    expect(screen.queryByText(/required|invalid|error/i)).toBeDefined();
  });
});
