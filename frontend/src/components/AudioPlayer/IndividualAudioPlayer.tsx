import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Typography, Paper, Box, Button, IconButton, Chip } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import shaka from 'shaka-player';
import { AudioFile } from '../../types';
import { playerRegistry } from '../../services/playerRegistry';

interface IndividualAudioPlayerProps {
  file: AudioFile;
  onRemove: (fileName: string) => void;
}

const IndividualAudioPlayer: React.FC<IndividualAudioPlayerProps> = ({ file, onRemove }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState<boolean>(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const loadFile = useCallback(async (player?: shaka.Player) => {
    const targetPlayer = player || playerRegistry.getPlayer(file.name);
    if (!targetPlayer || !isPlayerInitialized) return;
    
    setError(null);
    try {
      const streamId = `${API_BASE_URL}${file.manifest_url}`;
      console.log(`Loading ${file.name} from:`, streamId);
      
      // Check if player is already loaded with this content
      let currentManifestUrl: string | null = null;
      try {
        currentManifestUrl = await targetPlayer.getAssetUri();
        console.log(`Current manifest URL:`, currentManifestUrl);
      } catch (e) {
        console.log(`Could not get current manifest URL:`, e);
      }
      
      // If player is already loaded with the same content, don't reload
      if (currentManifestUrl === streamId) {
        console.log(`Player already loaded with same content, skipping load`);
        return;
      }
      
      targetPlayer.addEventListener('error', (event: { detail: any }) => {
        console.error(`Player ${file.name} error:`, event.detail);
        setError(`Player error: ${event.detail.code} - ${event.detail.message}`);
      });

      targetPlayer.configure({
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

      await targetPlayer.load(streamId);
      console.log(`Stream ${file.name} initialized`);
      
      // Store manifest URL for future reattachment
      playerRegistry.setManifestUrl(file.name, streamId);
    } catch (err: any) {
      console.error(`Error loading ${file.name}:`, err);
      if (err.code && err.message) {
        setError(`Failed to load: ${err.code} - ${err.message}`);
      } else {
        setError('Failed to load file');
      }
    }
  }, [file, API_BASE_URL, isPlayerInitialized]);

  // Initialize Shaka player once per file
  useEffect(() => {
    // Use a stable identifier that doesn't change when object references change
    const fileIdentifier = file.name || file.manifest_url || JSON.stringify(file);
    console.log('IndividualAudioPlayer useEffect - fileIdentifier:', fileIdentifier, 'audioRef.current:', !!audioRef.current);
    
    // Wait for audio element to be ready
    if (!audioRef.current) {
      console.log('Audio element not ready yet, waiting...');
      return;
    }
    
    if (playerRegistry.isPlayerRegistered(file.name)) {
      console.log('Player already registered for:', file.name);
      // Reuse existing player
      const existingPlayer = playerRegistry.getPlayer(file.name);
      const existingAudio = playerRegistry.getAudioElement(file.name);
      console.log('Existing player:', existingPlayer, 'existing audio:', existingAudio);
      
      if (existingPlayer && audioRef.current) {
        // Reattach to current audio element
        console.log('Reattaching player for:', file.name);
        playerRegistry.reattachPlayer(file.name, audioRef.current).catch(console.error);
        setIsPlayerInitialized(true);
        // Content reload is handled in reattachPlayer
        return;
      }
    }

    // Create new player if not exists
    console.log('Creating new player for:', file.name);
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && audioRef.current) {
      const player = new shaka.Player();
      player.attach(audioRef.current);
      playerRegistry.registerPlayer(file.name, player, audioRef.current);
      setIsPlayerInitialized(true);
      
      // Only load file for new players
      loadFile(player);
    }

    return () => {
      console.log('IndividualAudioPlayer cleanup for:', file.name);
      // Don't destroy player on unmount, keep it in registry
      // The player will be reused when component remounts
    };
  }, [file.name, loadFile]); // Only depend on file.name, not the entire file object

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      playerRegistry.updatePlayerState(file.name, { isPlaying: true });
    };
    const handlePause = () => {
      setIsPlaying(false);
      playerRegistry.updatePlayerState(file.name, { isPlaying: false });
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      playerRegistry.updatePlayerState(file.name, { currentTime: audio.currentTime });
    };
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
  }, [file.name]);

  const handlePlayPause = () => {
    const player = playerRegistry.getPlayer(file.name);
    const audio = audioRef.current;
    
    if (!player || !audio) {
      console.log('No player or audio element available for play/pause');
      return;
    }
    
    console.log('handlePlayPause called, current isPlaying:', isPlaying);
    console.log('Audio element readyState:', audio.readyState);
    console.log('Audio element paused:', audio.paused);
    console.log('Audio element currentTime:', audio.currentTime);
    console.log('Audio element duration:', audio.duration);
    
    if (isPlaying) {
      console.log('Pausing audio');
      audio.pause();
    } else {
      console.log('Playing audio');
      // Check if audio is ready to play
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        audio.play().catch((error) => {
          console.error('Failed to play audio:', error);
          setError(`Play failed: ${error.message}`);
        });
      } else {
        console.log('Audio not ready to play, readyState:', audio.readyState);
        setError('Audio not ready to play yet');
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