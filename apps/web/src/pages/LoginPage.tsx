import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import {
  Container,
  Box,
  TextField,
  Button,
  Alert,
  Card,
  Stack,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { setUser, setLoading, setError, clearError } from '@/app/authSlice';

interface LoginFormData {
  email: string;
  password: string;
}

/**
 * LoginPage - Authentication login form
 * Handles email/password login via Firebase Auth
 * Validates input and manages loading/error states
 */
export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setLocalError] = useState<string>('');
  const [loading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!validateForm()) {
      return;
    }

    setLocalLoading(true);
    dispatch(setLoading(true));

    try {
      // Mock authentication for demo purposes
      // In production, this would call Firebase Auth
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate successful login
      dispatch(
        setUser({
          uid: 'demo-user-123',
          email: formData.email,
          displayName: formData.email.split('@')[0],
          token: 'demo-token-xyz'
        })
      );

      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setLocalError(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setLocalLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
        data-testid="login-container"
      >
        <Card sx={{ width: '100%', p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                  fontWeight: 600
                }}
              >
                School ERP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Log in to your account
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                onClose={() => setLocalError('')}
                data-testid="error-alert"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} data-testid="login-form">
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  autoFocus
                  inputProps={{ 'data-testid': 'email-input' }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  inputProps={{ 'data-testid': 'password-input' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          disabled={loading}
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                  data-testid="submit-button"
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Demo credentials: any email@example.com / password123
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Box>
    </Container>
  );
}
