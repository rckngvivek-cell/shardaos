import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

export const ParentLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [validationId, setValidationId] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to send OTP
      const mockId = 'verify-' + Date.now();
      setValidationId(mockId);
      setShowOtpInput(true);
      // In real app, this would call backend API
      console.log('OTP sent to:', formData.email);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.otp.trim()) {
      setError('Please enter OTP');
      return;
    }

    if (formData.otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to verify OTP and login
      localStorage.setItem('parentAuthToken', 'mock-token-' + Date.now());
      localStorage.setItem('parentEmail', formData.email);
      navigate('/parent-portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          backgroundColor: '#f5f5f5',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'white',
            width: '100%',
            maxWidth: 450,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              sx={{
                backgroundColor: '#1976d2',
                borderRadius: '50%',
                p: 2,
                mb: 2,
              }}
            >
              <SchoolIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              School ERP
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Parent Portal
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Email/OTP Form */}
          <Box component="form" autoComplete="off">
            {!showOtpInput ? (
              // Email Input
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Enter Your Email
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="your@email.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  variant="outlined"
                  margin="normal"
                  helperText="We'll send an OTP to verify your identity"
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleEmailSubmit}
                  disabled={loading}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                </Button>
              </Box>
            ) : (
              // OTP Input
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Verify OTP
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  We've sent a 6-digit OTP to {formData.email}
                </Typography>
                <TextField
                  fullWidth
                  type="text"
                  placeholder="000000"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  disabled={loading}
                  variant="outlined"
                  margin="normal"
                  inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                  helperText="Enter the 6-digit OTP sent to your email"
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleOtpSubmit}
                  disabled={loading}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    setShowOtpInput(false);
                    setFormData({ ...formData, otp: '' });
                    setError('');
                  }}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  Back to Email
                </Button>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Typography variant="body2" align="center" color="textSecondary" sx={{ mt: 3 }}>
            Having trouble?{' '}
            <MuiLink href="/support" sx={{ color: '#1976d2', cursor: 'pointer' }}>
              Contact Support
            </MuiLink>
          </Typography>
        </Paper>

        {/* Help Text */}
        <Box sx={{ mt: 4, textAlign: 'center', color: '#666', maxWidth: 400 }}>
          <Typography variant="body2">
            The parent portal gives you access to your child's attendance, grades, fees, and school
            announcements.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ParentLoginPage;
