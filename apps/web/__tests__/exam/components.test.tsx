import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamList, type ExamListItem } from '@/components/exam/ExamList';
import { ExamEditor } from '@/components/exam/ExamEditor';
import { ExamAnswerer } from '@/components/exam/ExamAnswerer';
import { ResultsViewer, type ExamResult } from '@/components/exam/ResultsViewer';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockExams: ExamListItem[] = [
  {
    id: 'exam-001',
    title: 'Mathematics Midterm',
    subject: 'Mathematics',
    duration: 120,
    totalQuestions: 50,
    status: 'published',
    createdBy: 'Mr. Smith',
    dueDate: '2026-04-15',
    studentAttempts: 28,
  },
  {
    id: 'exam-002',
    title: 'English Literature Quiz',
    subject: 'English',
    duration: 60,
    totalQuestions: 30,
    status: 'published',
    createdBy: 'Ms. Johnson',
    dueDate: '2026-04-12',
    studentAttempts: 32,
  },
];

const mockExam = {
  id: 'exam-003',
  title: 'Science Final',
  subject: 'Science',
  duration: 90,
  totalQuestions: 40,
  passingScore: 60,
};

const mockResult: ExamResult = {
  id: 'result-001',
  examId: 'exam-001',
  studentName: 'John Doe',
  score: 75,
  totalQuestions: 5,
  correctAnswers: 4,
  incorrectAnswers: 1,
  skippedAnswers: 0,
  percentage: 80,
  passed: true,
  submittedAt: '2026-04-10T10:30:00Z',
  questions: [
    {
      questionNumber: 1,
      questionText: 'What is the capital of France?',
      studentAnswer: 'Paris',
      correctAnswer: 'Paris',
      isCorrect: true,
      status: 'correct',
    },
    {
      questionNumber: 2,
      questionText: 'Which planet is closest to the Sun?',
      studentAnswer: 'Venus',
      correctAnswer: 'Mercury',
      isCorrect: false,
      status: 'incorrect',
    },
  ],
};

// ============================================================================
// EXAMLIST COMPONENT TESTS
// ============================================================================

describe('ExamList Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ExamList exams={mockExams} role="student" />
    );
    expect(container).toBeTruthy();
  });

  it('displays exam list with correct data', () => {
    render(<ExamList exams={mockExams} role="student" />);

    // Check headers
    expect(screen.getByText('Available Exams')).toBeInTheDocument();

    // Check exam data
    expect(screen.getByText('Mathematics Midterm')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows different title for teacher role', () => {
    render(<ExamList exams={mockExams} role="teacher" />);
    expect(screen.getByText('My Exams')).toBeInTheDocument();
  });

  it('displays correct action buttons for student', () => {
    render(<ExamList exams={mockExams} role="student" />);

    const viewButtons = screen.getAllByRole('button', { name: /View/i });
    const takeButtons = screen.getAllByRole('button', { name: /Take Exam/i });

    expect(viewButtons.length).toBeGreaterThan(0);
    expect(takeButtons.length).toBeGreaterThan(0);
  });

  it('displays correct action buttons for teacher', () => {
    render(<ExamList exams={mockExams} role="teacher" />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    const resultsButtons = screen.getAllByRole('button', { name: /Results/i });
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });

    expect(editButtons.length).toBeGreaterThan(0);
    expect(resultsButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('calls onTakeExam callback when Take Exam button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnTakeExam = vi.fn();

    render(
      <ExamList exams={mockExams} role="student" onTakeExam={mockOnTakeExam} />
    );

    const takeExamButton = screen.getAllByRole('button', { name: /Take Exam/i })[0];
    await user.click(takeExamButton);

    expect(mockOnTakeExam).toHaveBeenCalled();
  });

  it('displays empty state when no exams provided', () => {
    render(<ExamList exams={[]} role="student" />);
    expect(
      screen.getByText('No exams available at this time.')
    ).toBeInTheDocument();
  });

  it('props validation: displays all exam fields correctly', () => {
    render(<ExamList exams={mockExams} role="student" />);

    // Verify all fields from first exam
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});

// ============================================================================
// EXAMEDITOR COMPONENT TESTS
// ============================================================================

describe('ExamEditor Component', () => {
  it('renders without crashing in create mode', () => {
    const { container } = render(
      <ExamEditor onSave={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it('displays form fields in create mode', () => {
    render(<ExamEditor onSave={vi.fn()} />);

    expect(screen.getByLabelText('Exam Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Questions')).toBeInTheDocument();
    expect(screen.getByLabelText('Passing Score (%)')).toBeInTheDocument();
  });

  it('displays Save button and Cancel button', () => {
    render(<ExamEditor onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Save Exam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = vi.fn();

    render(
      <ExamEditor onSave={vi.fn()} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('props validation: prefills form when exam is provided', async () => {
    render(
      <ExamEditor exam={mockExam} onSave={vi.fn()} />
    );

    const titleInput = screen.getByDisplayValue('Science Final') as HTMLInputElement;
    expect(titleInput.value).toBe('Science Final');
  });

  it('shows disabled state when isLoading is true', () => {
    render(
      <ExamEditor onSave={vi.fn()} isLoading={true} />
    );

    const submitButton = screen.getByRole('button', { name: /Saving/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message when validation fails', async () => {
    const user = userEvent.setup();
    render(
      <ExamEditor onSave={vi.fn()} />
    );

    // Try to submit empty form
    const saveButton = screen.getByRole('button', { name: /Save Exam/i });
    await user.click(saveButton);

    expect(
      screen.getByText('Exam title is required')
    ).toBeInTheDocument();
  });

  it('calls onSave with form data when submitted', async () => {
    const user = userEvent.setup();
    const mockOnSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ExamEditor onSave={mockOnSave} />
    );

    const titleInput = screen.getByLabelText('Exam Title');
    const subjectInput = screen.getByLabelText('Subject');

    await user.type(titleInput, 'New Exam');
    await user.type(subjectInput, 'Math');

    const saveButton = screen.getByRole('button', { name: /Save Exam/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });
});

// ============================================================================
// EXAMANSWERER COMPONENT TESTS
// ============================================================================

describe('ExamAnswerer Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it('displays exam title', () => {
    render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} />
    );

    expect(screen.getByText('Science Final')).toBeInTheDocument();
  });

  it('displays question with options', () => {
    render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} />
    );

    // Check for question text and options
    expect(screen.getByText(/What is the capital of France/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Paris/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /London/i })).toBeInTheDocument();
  });

  it('displays navigation buttons', () => {
    render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Exam/i })).toBeInTheDocument();
  });

  it('props validation: renders with correct exam data', () => {
    render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} />
    );

    expect(screen.getByText('Science Final')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
  });

  it('prevents submission with unanswered questions', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(
      <ExamAnswerer exam={mockExam} onSubmit={mockOnSubmit} />
    );

    const submitButton = screen.getByRole('button', { name: /Submit Exam/i });
    await user.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/All questions must be answered/)).toBeInTheDocument();
  });

  it('navigates between questions', async () => {
    const user = userEvent.setup();

    render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} />
    );

    // Initial question
    expect(screen.getByText(/What is the capital of France/)).toBeInTheDocument();

    // Click next
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Should show next question or show error (because not answered)
    expect(screen.getByText(/Please select an answer/)).toBeInTheDocument();
  });

  it('shows disabled state when isLoading is true', () => {
    render(
      <ExamAnswerer exam={mockExam} onSubmit={vi.fn()} isLoading={true} />
    );

    const previousButton = screen.getByRole('button', { name: /Previous/i });
    expect(previousButton).toBeDisabled();
  });
});

// ============================================================================
// RESULTSVIEWER COMPONENT TESTS
// ============================================================================

describe('ResultsViewer Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );
    expect(container).toBeTruthy();
  });

  it('displays pass status', () => {
    render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );

    expect(screen.getByText('PASSED')).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it('displays score breakdown', () => {
    render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays question-wise results table', () => {
    render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );

    expect(screen.getByText('Question-wise Results')).toBeInTheDocument();
    expect(screen.getByText('Q#')).toBeInTheDocument();
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText(/Paris/)).toBeInTheDocument();
  });

  it('props validation: displays all result fields correctly', () => {
    render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );

    // Check result details
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Science Final/)).toBeInTheDocument();

    // Check scores
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it('displays Back button', () => {
    render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );

    expect(screen.getByRole('button', { name: /Back to Exams/i })).toBeInTheDocument();
  });

  it('calls onBack callback when Back button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnBack = vi.fn();

    render(
      <ResultsViewer results={mockResult} exam={mockExam} onBack={mockOnBack} />
    );

    const backButton = screen.getByRole('button', { name: /Back to Exams/i });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('displays fail status for unsuccessful attempt', () => {
    const failedResult: ExamResult = {
      ...mockResult,
      passed: false,
      percentage: 45,
      score: 30,
      correctAnswers: 2,
      incorrectAnswers: 3,
    };

    render(
      <ResultsViewer results={failedResult} exam={mockExam} />
    );

    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Exam Components Integration', () => {
  it('ExamList to ExamEditor flow works', async () => {
    const user = userEvent.setup();
    const mockOnSave = vi.fn().mockResolvedValue(undefined);

    // First render ExamList
    const { unmount, rerender } = render(
      <ExamList exams={mockExams} role="teacher" />
    );

    expect(screen.getByText('My Exams')).toBeInTheDocument();

    // Simulate clicking edit
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    await user.click(editButtons[0]);

    // Switch to ExamEditor
    unmount();
    render(
      <ExamEditor exam={mockExam} onSave={mockOnSave} />
    );

    expect(screen.getByDisplayValue('Science Final')).toBeInTheDocument();
  });

  it('ExamAnswerer to ResultsViewer flow works', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    // First render ExamAnswerer
    const { unmount } = render(
      <ExamAnswerer exam={mockExam} onSubmit={mockOnSubmit} />
    );

    // Select all answers
    const radios = screen.getAllByRole('radio');
    for (const radio of radios.slice(0, 5)) {
      await user.click(radio);
      const nextButton = screen.queryByRole('button', { name: /Next/i });
      if (nextButton && !nextButton.hasAttribute('disabled')) {
        await user.click(nextButton);
      }
    }

    // Switch to ResultsViewer
    unmount();
    render(
      <ResultsViewer results={mockResult} exam={mockExam} />
    );

    expect(screen.getByText('PASSED')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });
});
