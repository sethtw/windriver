import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Paper, Box } from '@mui/material';
import shaka from 'shaka-player';
import { PlayerStats } from '../../types';

interface PlayerInfoProps {
  playerRef: React.RefObject<shaka.Player>;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ playerRef }) => {
  const [stats, setStats] = useState<PlayerStats>({
    bufferFullness: null,
    playbackRate: null,
    playheadTime: null,
    fetchedPlaybackInfo: null,
    presentationStartTime: null,
    segmentAvailabilityDuration: null,
    playerStats: null,
    isFullyLoaded: null,
    activeSessionsMetadata: null
  });

  const updateStats = useCallback(async () => {
    if (!playerRef.current) return;
    
    try {
      const [
        bufferFullness,
        playbackRate,
        playheadTime,
        fetchedPlaybackInfo,
        presentationStartTime,
        segmentAvailabilityDuration,
        playerStats,
        isFullyLoaded,
        activeSessionsMetadata
      ] = await Promise.all([
        playerRef.current.getBufferFullness(),
        playerRef.current.getPlaybackRate(),
        playerRef.current.getPlayheadTimeAsDate(),
        playerRef.current.getFetchedPlaybackInfo(),
        playerRef.current.getPresentationStartTimeAsDate(),
        playerRef.current.getSegmentAvailabilityDuration(),
        playerRef.current.getStats(),
        playerRef.current.isFullyLoaded(),
        playerRef.current.getActiveSessionsMetadata()
      ]);

      setStats({
        bufferFullness,
        playbackRate,
        playheadTime,
        fetchedPlaybackInfo,
        presentationStartTime,
        segmentAvailabilityDuration,
        playerStats,
        isFullyLoaded,
        activeSessionsMetadata
      });
    } catch (err) {
      console.error('Failed to get player stats:', err);
      // Don't update stats on error to avoid showing stale data
    }
  }, [playerRef]);

  useEffect(() => {
    // Update immediately
    updateStats();

    // Then update every second
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <Paper 
      sx={{ 
        p: 2, 
        flex: 1,
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
        Player Stats
      </Typography>
      <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap' }}>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Buffer Fullness: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.bufferFullness !== null ? `${(stats.bufferFullness * 100).toFixed(1)}%` : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Playback Rate: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.playbackRate !== null ? `${stats.playbackRate.toFixed(2)}x` : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Playhead Time: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.playheadTime ? stats.playheadTime.toLocaleTimeString() : 'N/A'}
            <br />
            {stats.playheadTime ? stats.playheadTime.toString() : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Presentation Start Time: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.presentationStartTime ? stats.presentationStartTime.toLocaleTimeString() : 'N/A'}
            <br />
            {stats.presentationStartTime ? stats.presentationStartTime.toString() : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Segment Availability Duration: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.segmentAvailabilityDuration !== null ? `${stats.segmentAvailabilityDuration.toFixed(2)}s` : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Is Fully Loaded: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.isFullyLoaded !== null ? (stats.isFullyLoaded ? 'Yes' : 'No') : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Fetched Playback Info: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.fetchedPlaybackInfo ? JSON.stringify(stats.fetchedPlaybackInfo, null, 2) : 'N/A'}
          </Box>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box component="span" sx={{ color: '#9cdcfe' }}>Player Stats: </Box>
          <Box component="span" sx={{ color: '#4ec9b0' }}>
            {stats.playerStats ? JSON.stringify(stats.playerStats, null, 2) : 'N/A'}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default PlayerInfo; 