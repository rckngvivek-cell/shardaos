import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Grid,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningIcon from '@mui/icons-material/Warning';

interface Fee {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
}

interface FeesCardProps {
  childName: string;
  totalFee: number;
  paidFee: number;
  fees: Fee[];
  onPayClick: () => void;
}

export const FeesCard: React.FC<FeesCardProps> = ({
  childName,
  totalFee,
  paidFee,
  fees,
  onPayClick,
}) => {
  const pendingFee = totalFee - paidFee;
  const progressPercent = (paidFee / totalFee) * 100;
  const isOverdue = fees.some(
    (fee) => !fee.paid && new Date(fee.dueDate) < new Date()
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ backgroundColor: '#e3f2fd', borderRadius: '50%', p: 1 }}>
            <AttachMoneyIcon sx={{ color: '#2196f3', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Fees for {childName}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ₹{totalFee.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Progress */}
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
          Paid: ₹{paidFee.toLocaleString()} of ₹{totalFee.toLocaleString()}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />

        {/* Status */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {isOverdue && (
            <Chip
              icon={<WarningIcon />}
              label="Overdue"
              size="small"
              color="error"
              variant="filled"
            />
          )}
          <Chip
            label={
              pendingFee === 0
                ? 'Fully Paid'
                : `₹${pendingFee.toLocaleString()} Due`
            }
            size="small"
            color={pendingFee === 0 ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        {/* Fee Breakdown */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
            Fee Breakdown
          </Typography>
          {fees.map((fee) => (
            <Box
              key={fee.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.5,
                fontSize: '0.875rem',
              }}
            >
              <Typography variant="caption">
                {fee.name}
                {fee.paid && ' ✓'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  ₹{fee.amount}
                </Typography>
                <Chip
                  label={fee.paid ? 'Paid' : 'Pending'}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    color: fee.paid ? '#4caf50' : '#f44336',
                    borderColor: fee.paid ? '#4caf50' : '#f44336',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>

      <CardActions>
        <Button
          fullWidth
          variant={pendingFee === 0 ? 'outlined' : 'contained'}
          color={pendingFee === 0 ? 'inherit' : 'primary'}
          onClick={onPayClick}
          disabled={pendingFee === 0}
        >
          {pendingFee === 0 ? 'All Fees Paid' : `Pay ₹${pendingFee.toLocaleString()}`}
        </Button>
      </CardActions>
    </Card>
  );
};

export default FeesCard;
