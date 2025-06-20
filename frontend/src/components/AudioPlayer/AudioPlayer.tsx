import React from 'react';
import { Typography, Paper, Box, Button } from '@mui/material';

interface AudioPlayerProps {
  videoRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ videoRef }) => {
  const fadeOut = () => {
    const audio = videoRef.current;
    if (!audio) return;

    const startVolume = audio.volume;
    const duration = 5000; // 5 seconds
    const steps = 50; // 50 steps for smooth fade
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;

    const fadeInterval = setInterval(() => {
      if (audio.volume > volumeStep) {
        audio.volume -= volumeStep;
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  };

  return (
    <Paper sx={{ p: 2, flex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Player
      </Typography>
      <audio
        ref={videoRef}
        controls
        style={{ width: '100%' }}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        {videoRef.current?.paused ? (
          <Button variant="contained" color="primary" onClick={() => videoRef.current?.play()}>
            Play
          </Button>
          ) : (
          <Button variant="contained" color="primary" onClick={() => videoRef.current?.pause()}>
            Pause
          </Button>
        )}
        <Button variant="contained" color="primary" onClick={fadeOut}>
          Fade Out
        </Button>
      </Box>
    </Paper>
  );
};

export default AudioPlayer; 