import React from 'react';
import { Typography, Paper } from '@mui/material';

interface AudioPlayerProps {
  videoRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ videoRef }) => (
  <Paper sx={{ p: 2, flex: 1 }}>
    <Typography variant="h6" gutterBottom>
      Player
    </Typography>
    <audio
      ref={videoRef}
      controls
      style={{ width: '100%' }}
    />
  </Paper>
);

export default AudioPlayer; 