/**
 * Staff Dashboard Component
 * Day 2: Task 2.4 - Staff Dashboard (1 hour)
 * Author: Frontend Team
 * Purpose: Main dashboard after staff login
 * Status: IMPLEMENTATION
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Avatar,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Class as ClassIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { selectStaffData, selectIsAuthenticated } from '../redux/staffSlice';
import { useGetMeQuery, useLogoutMutation } from '../api/staffApi';
import moment from 'moment';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

// ============================================================================
// DASHBOARD CARD COMPONENT
// ============================================================================

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
}) => (
  <Card
    sx={{
      background: `linear-gradient(135deg, var(--${color}-light) 0%, var(--${color}) 100%)`,
      color: 'white',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color='inherit' variant='h6' component='div'>
            {title}
          </Typography>
          <Typography color='inherit' variant='h3' sx={{ mt: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ opacity: 0.8 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

// ============================================================================
// STAFF DASHBOARD COMPONENT
// ============================================================================

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const staffData = useSelector(selectStaffData);
  const { data: meData, isLoading, error } = useGetMeQuery();
  const [logout] = useLogoutMutation();

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/staff/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/staff/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // ========================================================================
  // RENDER: LOADING
  // ========================================================================

  if (isLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // ========================================================================
  // RENDER: MAIN
  // ========================================================================

  const staff = meData || staffData;

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* ====================================================================
          HEADER: Welcome + Staff Profile
          ==================================================================== */}

      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant='h3' component='h1' sx={{ mb: 1 }}>
            Welcome, {staff?.name || 'Staff'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Last login: {staff?.lastLogin ? moment(staff.lastLogin).fromNow() : 'Today'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            startIcon={<EditIcon />}
            onClick={() => handleNavigate('/staff/profile')}
          >
            Edit Profile
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* ====================================================================
          ERROR ALERT
          ==================================================================== */}

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          Failed to load dashboard: {String(error)}
        </Alert>
      )}

      {/* ====================================================================
          STAFF INFO CARD
          ==================================================================== */}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
              {staff?.name?.[0]?.toUpperCase() || 'S'}
            </Avatar>

            <Box>
              <Typography variant='h6'>{staff?.name}</Typography>
              <Typography variant='body2' color='text.secondary'>
                Email: {staff?.email}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Chip label={staff?.role || 'Staff'} color='primary' size='small' />
                <Chip
                  label={`School ID: ${staff?.school_id || 'N/A'}`}
                  variant='outlined'
                  size='small'
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ====================================================================
          KEY METRICS (4-Column Grid)
          ==================================================================== */}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title='Classes'
            value={'5'}
            icon={<ClassIcon sx={{ fontSize: 40 }} />}
            color='primary'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title='Students'
            value={'125'}
            icon={<DashboardIcon sx={{ fontSize: 40 }} />}
            color='info'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title='Attendance Rate'
            value={'94%'}
            icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
            color='success'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title='Pending Tasks'
            value={'3'}
            icon={<ScheduleIcon sx={{ fontSize: 40 }} />}
            color='warning'
          />
        </Grid>
      </Grid>

      {/* ====================================================================
          QUICK ACTIONS (2-Column: Actions + Notifications)
          ==================================================================== */}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Quick Actions' avatar={<DashboardIcon />} />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='primary'
                    onClick={() => handleNavigate('/staff/attendance')}
                  >
                    Mark Attendance
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant='contained'
                    color='secondary'
                    onClick={() => handleNavigate('/staff/grades')}
                  >
                    Enter Grades
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant='outlined'
                    onClick={() => handleNavigate('/staff/reports')}
                  >
                    View Reports
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant='outlined'
                    onClick={() => handleNavigate('/staff/schedule')}
                  >
                    Class Schedule
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Notifications' avatar={<NotificationsIcon />} />
            <Divider />
            <CardContent>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                <ListItem>
                  <ListItemText
                    primary='Attendance Sync'
                    secondary='Last synced 2 hours ago'
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary='New Message'
                    secondary='Principal sent a broadcast at 2:30 PM'
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary='Grade Deadline'
                    secondary='Submit Q2 grades by Friday'
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary='System Update'
                    secondary='Maintenance scheduled for Sunday 10 PM'
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ====================================================================
          FOOTER: System Status
          ==================================================================== */}

      <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant='caption' color='text.secondary'>
          System Status: All services online ✓ | Last sync: {moment().format('hh:mm A')}
        </Typography>
      </Box>
    </Container>
  );
};

export default StaffDashboard;
