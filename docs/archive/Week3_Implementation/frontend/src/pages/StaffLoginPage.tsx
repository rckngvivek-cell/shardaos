/**
 * Staff Login Page Component
 * Day 1: Task 1 - Create Login Page (1.5 hours)
 * Author: Frontend Team
 * Status: In Development
 * 
 * Material-UI based login form for staff authentication
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useLoginMutation } from '../api/staffApi';
import { setStaff } from '../redux/staffSlice';

// ============================================================================
// TYPES
// ============================================================================

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  email?: string;
  password?: string;
  general?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StaffLoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginError>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ========================================================================
  // FORM VALIDATION
  // ========================================================================

  const validateForm = (): boolean => {
    const newErrors: LoginError = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof LoginError]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous messages
    setGeneralError(null);
    setSuccessMessage(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call login mutation
      const response = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      // Store token in localStorage
      localStorage.setItem('authToken', response.token);

      // Dispatch Redux action
      dispatch(
        setStaff({
          staff: response.staff,
          token: response.token,
        })
      );

      // Show success message
      setSuccessMessage(`Welcome back, ${response.staff.name}!`);

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Login failed:', error);

      const errorMessage =
        error?.data?.error ||
        error?.message ||
        'Login failed. Please try again.';

      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDERS
  // ========================================================================

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Staff Portal
          </Typography>
          <Typography variant="body2" color="textSecondary">
            School Management System
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper elevation={3} sx={{ width: '100%', p: 4 }}>
          {/* General Error Alert */}
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeneralError(null)}>
              {generalError}
            </Alert>
          )}

          {/* Success Alert */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              placeholder="admin@school.com"
              margin="normal"
              autoComplete="email"
              autoFocus
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              margin="normal"
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Remember Me & Forgot Password */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
              <Link
                href="/forgot-password"
                underline="hover"
                sx={{ fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={loading}
              sx={{ mt: 2, mb: 1 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Demo Credentials */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Demo Credentials:</strong>
                <br />
                Email: admin@school.com
                <br />
                Password: Test@123
              </Typography>
            </Alert>
          </form>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            © 2026 School ERP System. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default StaffLoginPage;

/**
 * Usage in App.tsx router:
 * 
 * import { StaffLoginPage } from './pages/StaffLoginPage';
 * 
 * <Route path="/staff/login" element={<StaffLoginPage />} />
 */
