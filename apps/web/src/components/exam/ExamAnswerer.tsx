import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Exam } from './ExamEditor';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  options: QuestionOption[];
  correctOptionId?: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId: string;
  submittedAt: string;
}

interface ExamAnswererProps {
  exam: Exam;
  onSubmit: (answers: StudentAnswer[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Mock questions for demonstration
const mockQuestions: Question[] = [
  {
    id: 'q-001',
    number: 1,
    text: 'What is the capital of France?',
    options: [
      { id: 'opt-1', text: 'London' },
      { id: 'opt-2', text: 'Paris' },
      { id: 'opt-3', text: 'Berlin' },
      { id: 'opt-4', text: 'Madrid' },
    ],
  },
  {
    id: 'q-002',
    number: 2,
    text: 'Which planet is closest to the Sun?',
    options: [
      { id: 'opt-5', text: 'Venus' },
      { id: 'opt-6', text: 'Mercury' },
      { id: 'opt-7', text: 'Earth' },
      { id: 'opt-8', text: 'Mars' },
    ],
  },
  {
    id: 'q-003',
    number: 3,
    text: 'What is 15 × 12?',
    options: [
      { id: 'opt-9', text: '150' },
      { id: 'opt-10', text: '170' },
      { id: 'opt-11', text: '180' },
      { id: 'opt-12', text: '200' },
    ],
  },
  {
    id: 'q-004',
    number: 4,
    text: 'Who wrote "Romeo and Juliet"?',
    options: [
      { id: 'opt-13', text: 'Jane Austen' },
      { id: 'opt-14', text: 'William Shakespeare' },
      { id: 'opt-15', text: 'Charles Dickens' },
      { id: 'opt-16', text: 'Mark Twain' },
    ],
  },
  {
    id: 'q-005',
    number: 5,
    text: 'What is the chemical symbol for Gold?',
    options: [
      { id: 'opt-17', text: 'Gd' },
      { id: 'opt-18', text: 'Go' },
      { id: 'opt-19', text: 'Au' },
      { id: 'opt-20', text: 'Ag' },
    ],
  },
];

export function ExamAnswerer({
  exam,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExamAnswererProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = mockQuestions.slice(0, exam.totalQuestions || 5);
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSelectAnswer = (optionId: string) => {
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, optionId));
    setError(null);
  };

  const handleNext = () => {
    if (!answers.has(currentQuestion.id)) {
      setError('Please select an answer before proceeding');
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setError(null);
    }
  };

  const handleSubmitExam = async () => {
    if (answers.size !== questions.length) {
      setError('All questions must be answered before submission');
      return;
    }

    const studentAnswers: StudentAnswer[] = Array.from(answers.entries()).map(
      ([questionId, optionId]) => ({
        questionId,
        selectedOptionId: optionId,
        submittedAt: new Date().toISOString(),
      })
    );

    try {
      await onSubmit(studentAnswers);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam');
    }
  };

  if (submitted) {
    return (
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Exam Submitted Successfully
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Your answers have been recorded. You will see your results shortly.
            </Typography>
            <Button variant="contained" onClick={onCancel}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 700 }}>
      <Card>
        <CardContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {exam.title}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Typography>
                <Chip label={`${Math.round(progress)}%`} size="small" />
              </Box>
              <LinearProgress variant="determinate" value={progress} />
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                {currentQuestion.text}
              </Typography>

              <RadioGroup
                value={answers.get(currentQuestion.id) || ''}
                onChange={(e) => handleSelectAnswer(e.target.value)}
              >
                <Stack spacing={1}>
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={option.text}
                      sx={{
                        bgcolor: answers.get(currentQuestion.id) === option.id
                          ? '#e3f2fd'
                          : 'transparent',
                        p: 1,
                        borderRadius: 1,
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#f0f0f0' },
                      }}
                    />
                  ))}
                </Stack>
              </RadioGroup>
            </Box>

            <Box>
              <Typography variant="caption" color="textSecondary">
                Answered: {answers.size} / {questions.length}
              </Typography>
            </Box>
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isLoading}
              variant="outlined"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1 || isLoading}
              variant="outlined"
            >
              Next
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              onClick={onCancel}
              disabled={isLoading}
              variant="text"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitExam}
              disabled={isLoading || answers.size !== questions.length}
              variant="contained"
            >
              {isLoading ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Box>
  );
}
