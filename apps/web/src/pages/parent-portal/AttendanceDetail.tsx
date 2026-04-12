import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'leave';
  subjects?: string[];
}

export const AttendanceDetail = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState('calendar');

  const attendanceData: AttendanceRecord[] = [
    { date: '2026-04-14', status: 'present', subjects: ['Math', 'English'] },
    { date: '2026-04-13', status: 'present', subjects: ['Science', 'History'] },
    { date: '2026-04-12', status: 'absent' },
    { date: '2026-04-11', status: 'present', subjects: ['Math', 'Science'] },
    { date: '2026-04-10', status: 'leave' },
    { date: '2026-04-09', status: 'present', subjects: ['English', 'Social'] },
  ];

  const presentCount = attendanceData.filter((d) => d.status === 'present').length;
  const absentCount = attendanceData.filter((d) => d.status === 'absent').length;
  const leaveCount = attendanceData.filter((d) => d.status === 'leave').length;
  const totalCount = attendanceData.length;
  const percentage = Math.round((presentCount / (totalCount - leaveCount)) * 100);

  const chartData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: absentCount },
    { name: 'Leave', value: leaveCount },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#4caf50';
      case 'absent':
        return '#f44336';
      case 'leave':
        return '#ff9800';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/parent-portal/dashboard')}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Attendance Report - March 2026
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Rohan Sharma - Roll No. 101
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {percentage}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Attendance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {presentCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Present
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                {absentCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Absent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                {leaveCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Leave
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Toggle */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <ToggleButtonGroup
          value={viewType}
          onChange={(e: React.MouseEvent<HTMLElement>, newValue: string) => {
            if (newValue !== null) {
              setViewType(newValue);
            }
          }}
          exclusive
          aria-label="View type"
        >
          <ToggleButton value="table" aria-label="table view">
            Table View
          </ToggleButton>
          <ToggleButton value="chart" aria-label="chart view">
            Chart View
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart View */}
      {viewType === 'chart' && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Attendance Summary
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Table View */}
      {viewType === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Subjects</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.map((record, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(record.status)}
                      sx={{
                        backgroundColor: getStatusColor(record.status),
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell>{record.subjects?.join(', ') || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AttendanceDetail;
