import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import { UserRole } from '@/types/school';

export interface ExamListItem {
  id: string;
  title: string;
  subject: string;
  duration: number;
  totalQuestions: number;
  status: 'draft' | 'published' | 'archived' | 'completed';
  createdBy?: string;
  dueDate?: string;
  studentAttempts?: number;
}

interface ExamListProps {
  exams: ExamListItem[];
  role: UserRole;
  onView?: (examId: string) => void;
  onTakeExam?: (examId: string) => void;
  onViewResults?: (examId: string) => void;
  onEdit?: (examId: string) => void;
  onDelete?: (examId: string) => void;
}

// Mock data
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
  {
    id: 'exam-003',
    title: 'Science Final Exam',
    subject: 'Science',
    duration: 90,
    totalQuestions: 40,
    status: 'draft',
    createdBy: 'Dr. Kumar',
  },
];

function getStatusColor(
  status: ExamListItem['status']
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  const statusColors: Record<
    ExamListItem['status'],
    'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  > = {
    draft: 'default',
    published: 'success',
    archived: 'warning',
    completed: 'info',
  };
  return statusColors[status];
}

export function ExamList({
  exams = mockExams,
  role,
  onView,
  onTakeExam,
  onViewResults,
  onEdit,
  onDelete,
}: ExamListProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          {role === 'teacher' ? 'My Exams' : 'Available Exams'}
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Duration (min)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Questions
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                {role === 'teacher' && <TableCell align="right" sx={{ fontWeight: 600 }}>Attempts</TableCell>}
                {role === 'teacher' && <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>}
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {exam.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell align="right">{exam.duration}</TableCell>
                  <TableCell align="right">{exam.totalQuestions}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.status}
                      color={getStatusColor(exam.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  {role === 'teacher' && <TableCell align="right">{exam.studentAttempts || 0}</TableCell>}
                  {role === 'teacher' && <TableCell>{exam.dueDate || '-'}</TableCell>}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {role === 'teacher' ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onEdit?.(exam.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={() => onViewResults?.(exam.id)}
                          >
                            Results
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => onDelete?.(exam.id)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onView?.(exam.id)}
                          >
                            View
                          </Button>
                          {exam.status === 'published' && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => onTakeExam?.(exam.id)}
                            >
                              Take Exam
                            </Button>
                          )}
                          {exam.status === 'completed' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              onClick={() => onViewResults?.(exam.id)}
                            >
                              View Results
                            </Button>
                          )}
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {exams.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                {role === 'teacher'
                  ? 'No exams created yet. Create your first exam to get started.'
                  : 'No exams available at this time.'}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
