import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

export interface ExamFormData {
  title: string;
  subject: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
}

export interface Exam extends ExamFormData {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExamEditorProps {
  exam?: Exam;
  onSave: (data: ExamFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const initialFormData: ExamFormData = {
  title: '',
  subject: '',
  duration: 60,
  totalQuestions: 30,
  passingScore: 60,
};

export function ExamEditor({
  exam,
  onSave,
  onCancel,
  isLoading = false,
}: ExamEditorProps) {
  const [formData, setFormData] = useState<ExamFormData>(
    exam || initialFormData
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof ExamFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      field === 'title' || field === 'subject'
        ? event.target.value
        : Number(event.target.value);

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Exam title is required');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return false;
    }
    if (formData.duration <= 0) {
      setError('Duration must be greater than 0');
      return false;
    }
    if (formData.totalQuestions <= 0) {
      setError('Total questions must be greater than 0');
      return false;
    }
    if (formData.passingScore < 0 || formData.passingScore > 100) {
      setError('Passing score must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      setSuccess(true);
      if (!exam) {
        setFormData(initialFormData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exam');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      <Card>
        <CardContent sx={{ pt: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            {exam ? 'Edit Exam' : 'Create New Exam'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Exam saved successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Exam Title"
                fullWidth
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="e.g., Mathematics Midterm"
                disabled={isLoading}
                variant="outlined"
                required
              />

              <TextField
                label="Subject"
                fullWidth
                value={formData.subject}
                onChange={handleChange('subject')}
                placeholder="e.g., Mathematics"
                disabled={isLoading}
                variant="outlined"
                required
              />

              <TextField
                label="Duration (minutes)"
                type="number"
                fullWidth
                value={formData.duration}
                onChange={handleChange('duration')}
                inputProps={{ min: 1, max: 480 }}
                disabled={isLoading}
                variant="outlined"
                required
              />

              <TextField
                label="Total Questions"
                type="number"
                fullWidth
                value={formData.totalQuestions}
                onChange={handleChange('totalQuestions')}
                inputProps={{ min: 1, max: 500 }}
                disabled={isLoading}
                variant="outlined"
                required
              />

              <TextField
                label="Passing Score (%)"
                type="number"
                fullWidth
                value={formData.passingScore}
                onChange={handleChange('passingScore')}
                inputProps={{ min: 0, max: 100 }}
                disabled={isLoading}
                variant="outlined"
                required
              />
            </Stack>
          </form>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="text"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            variant="contained"
          >
            {isLoading ? 'Saving...' : 'Save Exam'}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
