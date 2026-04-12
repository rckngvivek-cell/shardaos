import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSubmitExamMutation } from '../services/examApi';
import { setStatus, setError, addSubmission } from '../features/exam/examSlice';
import type { RootState } from '../app/store';
import './ExamAnswerer.css';

interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'short_answer' | 'essay';
  options?: string[];
  marks: number;
}

interface ExamAnswererProps {
  examId: string;
  studentId: string;
  schoolId: string;
  questions: Question[];
  durationMinutes: number;
  totalMarks: number;
  onExamComplete?: () => void;
}

export const ExamAnswerer: React.FC<ExamAnswererProps> = ({
  examId,
  studentId,
  schoolId,
  questions,
  durationMinutes,
  totalMarks,
  onExamComplete
}) => {
  const dispatch = useDispatch();
  const submissions = useSelector((state: RootState) => state.exam.submissions);
  const [submitExam, { isLoading: isSubmitting }] = useSubmitExamMutation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestion?.id] || '';

  const handleAnswerChange = (answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
      return;
    }

    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        answer: userAnswers[q.id] || ''
      }));

      await submitExam({
        schoolId,
        examId,
        studentId,
        answers,
        submittedAt: new Date().toISOString()
      }).unwrap();

      dispatch(addSubmission(answers as any));
      dispatch(setStatus('succeeded'));
      onExamComplete?.();
    } catch (err) {
      dispatch(setError('Failed to submit exam. Please try again.'));
    }
  };

  const handleAutoSubmit = async () => {
    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        answer: userAnswers[q.id] || ''
      }));

      await submitExam({
        schoolId,
        examId,
        studentId,
        answers,
        submittedAt: new Date().toISOString()
      }).unwrap();

      dispatch(addSubmission(answers as any));
      dispatch(setError('Exam auto-submitted due to time limit.'));
      onExamComplete?.();
    } catch (err) {
      dispatch(setError('Failed to auto-submit exam.'));
    }
  };

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className="exam-answerer-container">
      <div className="exam-header">
        <div className="exam-progress">
          <span className="question-counter">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="answered-counter">
            Answered: {answeredCount}/{questions.length}
          </span>
        </div>
        <div className={`timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="exam-progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="exam-content">
        <div className="question-panel">
          <div className="question-card">
            <div className="question-header">
              <h3>Question {currentQuestionIndex + 1}</h3>
              <span className="marks-badge">{currentQuestion?.marks} marks</span>
            </div>
            <p className="question-text">{currentQuestion?.text}</p>

            <div className="answer-input">
              {currentQuestion?.type === 'mcq' && currentQuestion?.options ? (
                <div className="mcq-options">
                  {currentQuestion.options.map((option, idx) => (
                    <label key={idx} className="mcq-option">
                      <input
                        type="radio"
                        name={`q-${currentQuestion.id}`}
                        value={option}
                        checked={currentAnswer === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Enter your answer here..."
                  rows={6}
                  className="answer-textarea"
                />
              )}
            </div>
          </div>

          <div className="navigation-buttons">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="btn-nav"
            >
              ← Previous
            </button>

            <div className="question-nav-grid">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`question-nav-btn ${
                    idx === currentQuestionIndex ? 'active' : ''
                  } ${userAnswers[q.id] ? 'answered' : ''}`}
                  title={`Q${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="btn-nav"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="exam-sidebar">
          <div className="summary-card">
            <h4>📊 Exam Summary</h4>
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Answered:</strong> {answeredCount}</p>
            <p><strong>Pending:</strong> {questions.length - answeredCount}</p>
            <p><strong>Total Marks:</strong> {totalMarks}</p>
            <p className="time-status">
              {timeLeft < 300 ? '⚠️ Time running out!' : '✓ Time available'}
            </p>
          </div>

          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting || answeredCount === 0}
            className="btn-submit"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamAnswerer;
