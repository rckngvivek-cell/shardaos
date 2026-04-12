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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Grade {
  subject: string;
  marks: number;
  total: number;
  grade: string;
  term: string;
  date: string;
}

export const GradesDetail = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [viewType, setViewType] = useState('table');

  const grades: Grade[] = [
    {
      subject: 'Mathematics',
      marks: 85,
      total: 100,
      grade: 'A',
      term: 'term1',
      date: '2026-04-10',
    },
    {
      subject: 'English',
      marks: 78,
      total: 100,
      grade: 'B+',
      term: 'term1',
      date: '2026-04-10',
    },
    {
      subject: 'Science',
      marks: 88,
      total: 100,
      grade: 'A',
      term: 'term1',
      date: '2026-04-10',
    },
    {
      subject: 'Social Studies',
      marks: 81,
      total: 100,
      grade: 'A-',
      term: 'term1',
      date: '2026-04-10',
    },
    {
      subject: 'Hindi',
      marks: 80,
      total: 100,
      grade: 'A-',
      term: 'term1',
      date: '2026-04-10',
    },
    {
      subject: 'Mathematics',
      marks: 88,
      total: 100,
      grade: 'A',
      term: 'term2',
      date: '2026-04-11',
    },
    {
      subject: 'English',
      marks: 82,
      total: 100,
      grade: 'A-',
      term: 'term2',
      date: '2026-04-11',
    },
  ];

  const filteredGrades = grades.filter((g) => g.term === selectedTerm);
  const avgMarks = Math.round(filteredGrades.reduce((sum, g) => sum + g.marks, 0) / filteredGrades.length);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade.startsWith('B')) return '#2196f3';
    if (grade.startsWith('C')) return '#ff9800';
    return '#f44336';
  };

  const chartData = filteredGrades.map((g) => ({
    name: g.subject.substring(0, 3),
    marks: g.marks,
  }));

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
            Grades Report
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Rohan Sharma - Roll No. 101
          </Typography>
        </Box>
      </Box>

      {/* Average Grade Card */}
      <Card sx={{ mb: 4, backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Average Score ({selectedTerm === 'term1' ? 'Term 1' : 'Term 2'})
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {avgMarks}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${avgMarks}%`,
                    backgroundColor: getGradeColor('A'),
                    transition: 'width 0.3s',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Term Selection */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <Button
          variant={selectedTerm === 'term1' ? 'contained' : 'outlined'}
          onClick={() => setSelectedTerm('term1')}
        >
          Term 1
        </Button>
        <Button
          variant={selectedTerm === 'term2' ? 'contained' : 'outlined'}
          onClick={() => setSelectedTerm('term2')}
        >
          Term 2
        </Button>
      </Box>

      {/* View Toggle */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          exclusive
          value={viewType}
          onChange={(e: React.MouseEvent<HTMLElement>, newValue: string) => {
            if (newValue !== null) {
              setViewType(newValue);
            }
          }}
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="marks" stroke="#1976d2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Table View */}
      {viewType === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Marks
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Percentage
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Grade
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGrades.map((grade, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell>{grade.subject}</TableCell>
                  <TableCell align="right">
                    {grade.marks}/{grade.total}
                  </TableCell>
                  <TableCell align="center">
                    {Math.round((grade.marks / grade.total) * 100)}%
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={grade.grade}
                      sx={{
                        backgroundColor: getGradeColor(grade.grade),
                        color: 'white',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default GradesDetail;
