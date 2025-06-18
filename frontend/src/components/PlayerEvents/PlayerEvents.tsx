import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { PlayerEvent } from '../../types';

interface PlayerEventsProps {
  events: PlayerEvent[];
}

const PlayerEvents: React.FC<PlayerEventsProps> = ({ events }) => (
  <Paper 
    sx={{ 
      p: 2, 
      flex: 1, 
      maxHeight: '300px', 
      overflow: 'auto',
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily: 'monospace',
      fontSize: '0.9rem',
      lineHeight: '1.4'
    }}
  >
    <Typography 
      variant="h6" 
      gutterBottom 
      sx={{ 
        color: '#569cd6',
        fontFamily: 'monospace',
        borderBottom: '1px solid #333',
        pb: 1
      }}
    >
      Player Events Log
    </Typography>
    <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap' }}>
      {events.map((event, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>
            [{new Date(event.timestamp).toLocaleTimeString()}]
          </Box>
          <Box component="span" sx={{ color: '#4ec9b0', ml: 1 }}>
            {event.type}
          </Box>
          {event.details && (
            <Box sx={{ ml: 2, color: '#ce9178' }}>
              {JSON.stringify(event.details, null, 2)}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  </Paper>
);

export default PlayerEvents; 