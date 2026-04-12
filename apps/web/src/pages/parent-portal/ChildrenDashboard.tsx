import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  section: string;
  attendancePercentage: number;
  lastGradeAverage: number;
}

export const ChildrenDashboard = () => {
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState<string>('1');

  const children: Child[] = [
    {
      id: '1',
      firstName: 'Rohan',
      lastName: 'Sharma',
      rollNumber: '101',
      section: 'A',
      attendancePercentage: 92,
      lastGradeAverage: 82,
    },
    {
      id: '2',
      firstName: 'Priya',
      lastName: 'Sharma',
      rollNumber: '201',
      section: 'B',
      attendancePercentage: 95,
      lastGradeAverage: 88,
    },
  ];

  const selectedChild = children.find((c) => c.id === selectedChildId);

  if (!selectedChild) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, Parent!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's an overview of your children's academic progress
        </Typography>
      </Box>

      {/* Child Selector */}
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Child</InputLabel>
          <Select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            label="Select Child"
          >
            {children.map((child) => (
              <MenuItem key={child.id} value={child.id}>
                {child.firstName} {child.lastName} (Class {child.rollNumber.substring(0, 1)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Student Header Card */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#1976d2', color: 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <PersonIcon />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {selectedChild.firstName} {selectedChild.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Roll No: {selectedChild.rollNumber} | Section: {selectedChild.section}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Attendance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: '#e8f5e9',
                    borderRadius: '50%',
                    p: 1.5,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Attendance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {selectedChild.attendancePercentage}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Grade */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: '#e3f2fd',
                    borderRadius: '50%',
                    p: 1.5,
                  }}
                >
                  <AssignmentIcon sx={{ color: '#2196f3', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Avg Grade
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {selectedChild.lastGradeAverage}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Status */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: '#f3e5f5',
                    borderRadius: '50%',
                    p: 1.5,
                  }}
                >
                  <SchoolIcon sx={{ color: '#9c27b0', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Fees Status
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    Paid
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Last Updated */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Last Updated
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Today
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Apr 14, 2026
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate(`/parent-portal/attendance/${selectedChildId}`)}
            >
              View Attendance
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth variant="outlined" onClick={() => navigate(`/parent-portal/grades/${selectedChildId}`)}>
              View Grades
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate(`/parent-portal/announcements`)}
            >
              Announcements
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth variant="outlined" onClick={() => navigate(`/parent-portal/messages`)}>
              Messages
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Recent Activity
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Attendance Marked
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Apr 14, 2026 - Present (Math, English, Science)
            </Typography>
          </Box>
          <Box sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Grades Posted
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Apr 10, 2026 - Math: 85/100, English: 78/100
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Announcement
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Apr 8, 2026 - Summer vacation starts from May 1st
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ChildrenDashboard;
