/**
 * Attendance Management Page
 * Day 2: Task 2.5 - Attendance Page (1.5 hours)
 * Author: Frontend Team
 * Purpose: Mark and manage attendance for classes
 * Status: IMPLEMENTATION
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { selectIsAuthenticated } from '../redux/staffSlice';
import {
  useGetStudentListQuery,
  useMarkAttendanceMutation,
  useGetAttendanceByClassQuery,
} from '../api/staffApi';
import moment from 'moment';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface StudentAttendance {
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  marked_at?: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  marked_at: string;
  notes?: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const markAttendanceSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  student_id: z.string().min(1, 'Student is required'),
  status: z.enum(['present', 'absent', 'late'] as const),
  notes: z.string().optional(),
});

type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

// ============================================================================
// ATTENDANCE MANAGEMENT PAGE
// ============================================================================

const AttendanceManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // ========================================================================
  // STATE
  // ========================================================================

  const [classId, setClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    moment().format('YYYY-MM-DD')
  );
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: '',
    onConfirm: () => {},
  });

  // ========================================================================
  // API HOOKS
  // ========================================================================

  const { data: studentsData, isLoading: studentsLoading } = useGetStudentListQuery(
    classId ? { class_id: classId } : undefined
  );
  const { data: attendanceData, isLoading: attendanceLoading, refetch } =
    useGetAttendanceByClassQuery(
      classId && selectedDate ? { class_id: classId, date: selectedDate } : undefined
    );
  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/staff/login');
    }
  }, [isAuthenticated, navigate]);

  // Initialize attendance from fetched records
  useEffect(() => {
    if (attendanceData?.records) {
      const mapped = attendanceData.records.map((record: AttendanceRecord) => ({
        student_id: record.student_id,
        student_name: record.student_name,
        status: record.status,
        notes: record.notes,
        marked_at: record.marked_at,
      }));
      setAttendance(mapped);
    } else if (studentsData?.students) {
      // Initialize with students, no attendance marked yet
      setAttendance(
        studentsData.students.map((s: any) => ({
          student_id: s.id,
          student_name: s.name,
          status: 'present' as const,
          notes: '',
        }))
      );
    }
  }, [attendanceData, studentsData]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleClassChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setClassId(e.target.value as string);
    setAttendance([]);
    setErrors({});
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleStatusChange = (index: number, status: string) => {
    const updated = [...attendance];
    updated[index].status = status as 'present' | 'absent' | 'late';
    setAttendance(updated);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updated = [...attendance];
    updated[index].notes = notes;
    setAttendance(updated);
  };

  const handleSave = async () => {
    // Validate
    if (!classId) {
      setErrors({ classId: 'Please select a class' });
      return;
    }

    if (attendance.length === 0) {
      setErrors({ attendance: 'No students to mark attendance' });
      return;
    }

    // Save each record
    try {
      let saved = 0;
      for (const record of attendance) {
        try {
          const payload = markAttendanceSchema.parse({
            class_id: classId,
            student_id: record.student_id,
            status: record.status,
            notes: record.notes,
          });

          await markAttendance(payload).unwrap();
          saved++;
        } catch (err) {
          console.error(`Failed to mark attendance for ${record.student_name}:`, err);
        }
      }

      setSuccessMessage(`✅ Attendance saved for ${saved}/${attendance.length} students`);
      setErrors({});

      // Refetch to verify
      if (classId && selectedDate) {
        setTimeout(() => refetch(), 500);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Save failed:', err);
      setErrors({ general: 'Failed to save attendance. Please try again.' });
    }
  };

  const handleRefresh = async () => {
    if (classId && selectedDate) {
      await refetch();
      setSuccessMessage('✅ Attendance refreshed');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleExport = () => {
    // Export as CSV
    const headers = ['Student ID', 'Name', 'Status', 'Marked At', 'Notes'];
    const rows = attendance.map((a) => [
      a.student_id,
      a.student_name,
      a.status,
      a.marked_at || '',
      a.notes || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${classId}-${selectedDate}.csv`;
    a.click();
  };

  const handleBulkStatus = (status: string) => {
    const updated = attendance.map((a) => ({
      ...a,
      status: status as 'present' | 'absent' | 'late',
    }));
    setAttendance(updated);
    setSuccessMessage(`✅ All students marked as ${status}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ========================================================================
  // RENDER: LOADING
  // ========================================================================

  if (!isAuthenticated) {
    return null;
  }

  // ========================================================================
  // RENDER: MAIN
  // ========================================================================

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* Section 1: Inputs & Actions */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title='Mark Attendance' variant='head6' />
        <Divider />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={classId}
                  label='Class'
                  onChange={handleClassChange as any}
                >
                  <MenuItem value=''>Select class...</MenuItem>
                  <MenuItem value='class-001'>Class 10-A</MenuItem>
                  <MenuItem value='class-002'>Class 10-B</MenuItem>
                  <MenuItem value='class-003'>Class 9-A</MenuItem>
                  <MenuItem value='class-004'>Class 9-B</MenuItem>
                  <MenuItem value='class-005'>Class 8-A</MenuItem>
                </Select>
              </FormControl>
              {errors.classId && (
                <Typography variant='caption' color='error'>
                  {errors.classId}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label='Date'
                type='date'
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Button
                variant='contained'
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={!classId || studentsLoading}
              >
                Load Students
              </Button>
              <Button
                variant='outlined'
                onClick={() => handleBulkStatus('present')}
                disabled={attendance.length === 0}
              >
                All Present
              </Button>
              <Button
                variant='outlined'
                onClick={() => handleBulkStatus('absent')}
                disabled={attendance.length === 0}
              >
                All Absent
              </Button>
            </Grid>
          </Grid>

          {errors.general && <Alert severity='error'>{errors.general}</Alert>}
          {successMessage && <Alert severity='success'>{successMessage}</Alert>}
        </CardContent>
      </Card>

      {/* Section 2: Attendance Table */}
      {attendance.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={`${attendance.length} Students - ${moment(selectedDate).format(
              'DD MMM YYYY'
            )}`}
          />
          <Divider />
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 100 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((student, index) => (
                  <TableRow key={student.student_id} hover>
                    <TableCell>{student.student_id}</TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>
                      <Select
                        value={student.status}
                        onChange={(e) =>
                          handleStatusChange(index, e.target.value)
                        }
                        size='small'
                      >
                        <MenuItem value='present'>
                          <Chip label='Present' color='success' size='small' />
                        </MenuItem>
                        <MenuItem value='absent'>
                          <Chip label='Absent' color='error' size='small' />
                        </MenuItem>
                        <MenuItem value='late'>
                          <Chip label='Late' color='warning' size='small' />
                        </MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        placeholder='Add notes...'
                        value={student.notes || ''}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      {student.marked_at ? (
                        <Chip
                          label='Saved'
                          color='success'
                          variant='outlined'
                          size='small'
                        />
                      ) : (
                        <Chip label='New' color='primary' size='small' />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Section 3: Summary Stats */}
      {attendance.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                Present
              </Typography>
              <Typography variant='h4' color='success.main'>
                {attendance.filter((a) => a.status === 'present').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                Absent
              </Typography>
              <Typography variant='h4' color='error.main'>
                {attendance.filter((a) => a.status === 'absent').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                Late
              </Typography>
              <Typography variant='h4' color='warning.main'>
                {attendance.filter((a) => a.status === 'late').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color='textSecondary' gutterBottom>
                Attendance Rate
              </Typography>
              <Typography variant='h4' color='info.main'>
                {Math.round(
                  ((attendance.filter((a) => a.status !== 'absent').length /
                    attendance.length) *
                    100) as any
                )}
                %
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Section 4: Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant='outlined'
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={attendance.length === 0}
        >
          Export CSV
        </Button>
        <Button
          variant='contained'
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={attendance.length === 0 || !classId || isSaving}
        >
          {isSaving ? <CircularProgress size={20} /> : 'Save Attendance'}
        </Button>
      </Box>

      {/* Loading indicator */}
      {(studentsLoading || attendanceLoading || isSaving) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default AttendanceManagementPage;
