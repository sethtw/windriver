import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Typography, Paper, Box, Button, IconButton, Chip } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import shaka from 'shaka-player';
import { AudioFile } from '../../types';

interface IndividualAudioPlayerProps {
  file: AudioFile;
  onRemove: (fileName: string) => void;
}

const IndividualAudioPlayer: React.FC<IndividualAudioPlayerProps> = ({ file, onRemove }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState<boolean>(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Initialize Shaka player once
  useEffect(() => {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && audioRef.current && !isPlayerInitialized) {
      const player = new shaka.Player();
      playerRef.current = player;
      playerRef.current.attach(audioRef.current);

      // Add event listeners
      const eventTypes = [
        'buffering',
        'loaded',
        'loading',
        'manifestparsed',
        'manifestupdated',
        'started',
        'statechanged'
      ];

      eventTypes.forEach(eventType => {
        playerRef.current!.addEventListener(eventType, (event: { detail: any }) => {
          console.log(`Player ${file.name} - ${eventType}:`, event.detail);
        });
      });

      setIsPlayerInitialized(true);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        setIsPlayerInitialized(false);
      }
    };
  }, []); // No dependencies - only run once

  const loadFile = useCallback(async () => {
    if (!playerRef.current || !isPlayerInitialized) return;
    
    setError(null);
    try {
      const streamId = `${API_BASE_URL}${file.manifest_url}`;
      console.log(`Loading ${file.name} from:`, streamId);
      
      playerRef.current.addEventListener('error', (event: { detail: any }) => {
        console.error(`Player ${file.name} error:`, event.detail);
        setError(`Player error: ${event.detail.code} - ${event.detail.message}`);
      });

      playerRef.current.configure({
        streaming: {
          retryParameters: {
            timeout: 10000,
            maxAttempts: 3,
            baseDelay: 1000,
            backoffFactor: 2,
            fuzzFactor: 0.5
          }
        }
      });

      await playerRef.current.load(streamId);
      console.log(`Stream ${file.name} initialized`);
    } catch (err: any) {
      console.error(`Error loading ${file.name}:`, err);
      if (err.code && err.message) {
        setError(`Failed to load: ${err.code} - ${err.message}`);
      } else {
        setError('Failed to load file');
      }
    }
  }, [file, API_BASE_URL, isPlayerInitialized]);

  // Load file when player is initialized and file changes
  useEffect(() => {
    if (isPlayerInitialized) {
      loadFile();
    }
  }, [isPlayerInitialized, loadFile]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const fadeOut = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const startVolume = audio.volume;
    const duration = 5000; // 5 seconds
    const steps = 50; // 50 steps for smooth fade
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;

    const fadeInterval = setInterval(() => {
      if (audio.volume > (0 + volumeStep)) {
        audio.volume -= volumeStep;
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  };

  const fadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetVolume = audio.volume > 0 ? audio.volume : 1;
    const startVolume = 0.001;
    const duration = 5000; // 5 seconds
    const steps = 50; // 50 steps for smooth fade
    const stepDuration = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;

    // Set initial volume to 0 and play the audio
    audio.volume = startVolume;
    audio.play();

    const fadeInterval = setInterval(() => {
      // Fade in the audio
      if (audio.volume < (targetVolume - volumeStep)) {
        audio.volume += volumeStep;
      } else {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Paper sx={{ p: 2, minWidth: 300, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" noWrap sx={{ maxWidth: 200 }}>
          {file.name}
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => onRemove(file.name)}
          sx={{ ml: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {error && (
        <Chip 
          label={error} 
          color="error" 
          size="small" 
          sx={{ mb: 1 }}
        />
      )}

      <audio
        ref={audioRef}
        controls
        style={{ width: '100%', marginBottom: 8 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="small"
          onClick={handlePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          size="small"
          onClick={fadeIn}
        >
          Fade In
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          size="small"
          onClick={fadeOut}
        >
          Fade Out
        </Button>
      </Box>
    </Paper>
  );
};

export default IndividualAudioPlayer; 