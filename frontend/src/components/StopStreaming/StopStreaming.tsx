import React from 'react';
import { Button, CircularProgress } from '@mui/material';

interface StopStreamingProps {
  onStopStreaming: () => void;
  loading: boolean;
}

const StopStreaming: React.FC<StopStreamingProps> = ({ onStopStreaming, loading }) => (
  <label htmlFor="stop-streaming">
    <Button
      onClick={onStopStreaming}
      variant="contained"
      color="secondary"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={16} /> : 'Stop Streaming'}
    </Button>
  </label>
);

export default StopStreaming; 