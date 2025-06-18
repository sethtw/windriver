import React from 'react';
import { Button, CircularProgress } from '@mui/material';

interface CaptureAndStreamProps {
  onCaptureAndStream: () => void;
  loading: boolean;
}

const CaptureAndStream: React.FC<CaptureAndStreamProps> = ({ onCaptureAndStream, loading }) => (
  <label htmlFor="start-streaming">
    <Button
      onClick={onCaptureAndStream}
      variant="contained"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={16} /> : 'Start Streaming'}
    </Button>
  </label>
);

export default CaptureAndStream; 