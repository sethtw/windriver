import React from 'react';
import { Button, CircularProgress } from '@mui/material';

interface AudioDevicesProps {
  onGetAudioDevices: () => void;
  loading: boolean;
}

const AudioDevices: React.FC<AudioDevicesProps> = ({ onGetAudioDevices, loading }) => (
  <label htmlFor="get-audio-devices">
    <Button
      onClick={onGetAudioDevices}
      variant="contained"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={16} /> : 'Get Audio Devices'}
    </Button>
  </label>
);

export default AudioDevices; 