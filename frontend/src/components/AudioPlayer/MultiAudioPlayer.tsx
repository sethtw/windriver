import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import IndividualAudioPlayer from './IndividualAudioPlayer';
import { AudioFile } from '../../types';

interface MultiAudioPlayerProps {
  activePlayers: AudioFile[];
  onRemovePlayer: (fileName: string) => void;
}

const MultiAudioPlayer: React.FC<MultiAudioPlayerProps> = ({ activePlayers, onRemovePlayer }) => {
  if (activePlayers.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No active players
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select files from the list to create audio players
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Active Players ({activePlayers.length})
      </Typography>
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2,
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
      >
        {activePlayers.map((file) => (
          <IndividualAudioPlayer
            key={file.name}
            file={file}
            onRemove={onRemovePlayer}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MultiAudioPlayer; 