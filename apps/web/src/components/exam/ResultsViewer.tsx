import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import { Exam } from './ExamEditor';

export interface QuestionResult {
  questionNumber: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  status: 'correct' | 'incorrect' | 'skipped';
}

export interface ExamResult {
  id: string;
  examId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  questions: QuestionResult[];
}

interface ResultsViewerProps {
  results: ExamResult;
  exam: Exam;
  onBack?: () => void;
}

// Mock result data for demonstration
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
    {
      questionNumber: 3,
      questionText: 'What is 15 × 12?',
      studentAnswer: '180',
      correctAnswer: '180',
      isCorrect: true,
      status: 'correct',
    },
    {
      questionNumber: 4,
      questionText: 'Who wrote "Romeo and Juliet"?',
      studentAnswer: 'William Shakespeare',
      correctAnswer: 'William Shakespeare',
      isCorrect: true,
      status: 'correct',
    },
    {
      questionNumber: 5,
      questionText: 'What is the chemical symbol for Gold?',
      studentAnswer: 'Ag',
      correctAnswer: 'Au',
      isCorrect: false,
      status: 'incorrect',
    },
  ],
};

function getStatusColor(status: QuestionResult['status']): 'success' | 'error' | 'warning' {
  const colors: Record<QuestionResult['status'], 'success' | 'error' | 'warning'> = {
    correct: 'success',
    incorrect: 'error',
    skipped: 'warning',
  };
  return colors[status];
}

export function ResultsViewer({
  results = mockResult,
  exam,
  onBack,
}: ResultsViewerProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Header Card */}
        <Card>
          <CardContent sx={{ pt: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Exam Results
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Exam
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {exam.title}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Student
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {results.studentName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Submitted
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(results.submittedAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card sx={{ bgcolor: results.passed ? '#e8f5e9' : '#ffebee' }}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Overall Score
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: results.passed ? '#2e7d32' : '#c62828',
                  }}
                >
                  {results.percentage}%
                </Typography>
                <Chip
                  label={results.passed ? 'PASSED' : 'FAILED'}
                  color={results.passed ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Progress</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {results.score} / {results.totalQuestions * 20}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={results.percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Answer Breakdown
            </Typography>
            <Stack direction="row" spacing={2}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  bgcolor: '#e8f5e9',
                  borderRadius: 1,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Correct
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: '#2e7d32' }}
                >
                  {results.correctAnswers}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  bgcolor: '#ffebee',
                  borderRadius: 1,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Incorrect
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: '#c62828' }}
                >
                  {results.incorrectAnswers}
                </Typography>
              </Box>
              {results.skippedAnswers > 0 && (
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    bgcolor: '#fff8e1',
                    borderRadius: 1,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    Skipped
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: '#f57f17' }}
                  >
                    {results.skippedAnswers}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Question Details */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Question-wise Results
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Q#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Your Answer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Correct Answer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.questions.map((q) => (
                    <TableRow key={q.questionNumber} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {q.questionNumber}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{q.questionText}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: q.isCorrect ? '#2e7d32' : '#c62828',
                          }}
                        >
                          {q.studentAnswer}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{q.correctAnswer}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={
                            q.status.charAt(0).toUpperCase() +
                            q.status.slice(1)
                          }
                          color={getStatusColor(q.status)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Passing Info */}
        {results.passed && (
          <Alert severity="success">
            Great job! You have successfully passed this exam with{' '}
            {results.percentage}%.
          </Alert>
        )}
        {!results.passed && (
          <Alert severity="warning">
            You need to score at least {exam.passingScore}% to pass. Your current
            score is {results.percentage}%. Please try again.
          </Alert>
        )}
      </Stack>

      {/* Action Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button onClick={onBack} variant="contained">
          Back to Exams
        </Button>
      </Box>
    </Box>
  );
}
