import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

interface ParentSettings {
  email: string;
  phone: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: string;
}

export const SettingsPage = () => {
  const [settings, setSettings] = useState<ParentSettings>({
    email: 'parent@email.com',
    phone: '+91 98765 43210',
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: true,
    language: 'en',
  });

  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof ParentSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(formData);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your account and notification preferences
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 300px' }, gap: 3 }}>
        {/* Main Settings */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Account Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Phone Number
                </Typography>
                <TextField
                  fullWidth
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Notifications
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notificationsEnabled}
                    onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                  />
                }
                label="Enable all notifications"
                sx={{ display: 'block', mb: 2 }}
              />

              <Box sx={{ pl: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.emailNotifications && formData.notificationsEnabled}
                      onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                      disabled={!formData.notificationsEnabled}
                    />
                  }
                  label="Email notifications (Grades, Attendance, Announcements)"
                  sx={{ display: 'block', mb: 1 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.smsNotifications && formData.notificationsEnabled}
                      onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                      disabled={!formData.notificationsEnabled}
                    />
                  }
                  label="SMS notifications (Important updates only)"
                  sx={{ display: 'block' }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Language & Localization
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Language
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={formData.language === 'en' ? 'contained' : 'outlined'}
                    onClick={() => handleChange('language', 'en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={formData.language === 'hi' ? 'contained' : 'outlined'}
                    onClick={() => handleChange('language', 'hi')}
                  >
                    Hindi
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
            size="large"
          >
            Save Settings
          </Button>
        </Box>

        {/* Sidebar Info */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Account Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Status
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                Active
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, fontSize: '0.95rem' }}
              >
                Help & Support
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1976d2',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Contact Support
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1976d2',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  FAQ
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1976d2',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Privacy Policy
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default SettingsPage;
