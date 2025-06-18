import React from 'react';
import { Typography } from '@mui/material';

interface ErrorAlertProps {
  error: string | null;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => (
  error ? (
    <Typography color="error" sx={{ mb: 2 }}>
      {error}
    </Typography>
  ) : null
);

export default ErrorAlert; 