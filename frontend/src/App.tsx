import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import shaka from 'shaka-player';
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AudioFile {
  name: string;
  manifest_url: string;
}

interface PlayerEvent {
  type: string;
  timestamp: number;
  details: any;
}

interface PlayerStats {
  bufferFullness: number | null;
  playbackRate: number | null;
  playheadTime: Date | null;
  fetchedPlaybackInfo: any | null;
  presentationStartTime: Date | null;
  segmentAvailabilityDuration: number | null;
  playerStats: any | null;
  isFullyLoaded: boolean | null;
}

// Add Shaka Player type definitions
declare module 'shaka-player' {
  interface Player {
    addEventListener(event: string, callback: (event: { detail: any }) => void): void;
    configure(config: { streaming: { retryParameters: any } }): void;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Custom hook for file loading
const useFiles = () => {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<AudioFile[]>(`${API_BASE_URL}/files`);
      setFiles(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.message);
      } else {
        setError('Failed to load files');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { files, loading, error, loadFiles };
};

// Custom hook for audio player
const useAudioPlayer = (videoRef: React.RefObject<HTMLAudioElement>) => {
  const playerRef = useRef<shaka.Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PlayerEvent[]>([]);

  const addEvent = useCallback((type: string, details: any) => {
    setEvents(prev => [...prev, {
      type,
      timestamp: Date.now(),
      details
    }].slice(-50)); // Keep last 50 events
  }, []);

  useEffect(() => {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && videoRef.current) {
      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

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
        player.addEventListener(eventType, (event: { detail: any }) => {
          addEvent(eventType, event.detail);
        });
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoRef, addEvent]);

  const handleFileSelect = useCallback(async (file: AudioFile): Promise<void> => {
    setError(null);
    console.log('Selected file:', file);

    try {
      if (playerRef.current) {
        const streamId = `${API_BASE_URL}${file.manifest_url}`;
        console.log('Attempting to load manifest and segments from:', streamId);
        
        (playerRef.current as any).addEventListener('error', (event: { detail: any }) => {
          console.error('Shaka Player error:', event.detail);
          setError(`Player error: ${event.detail.code} - ${event.detail.message}`);
        });

        (playerRef.current as any).configure({
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
        if (videoRef.current) {
          videoRef.current.play();
        }
      }
    } catch (err: any) {
      console.error('Detailed error:', err);
      if (err.code && err.message) {
        setError(`Failed to play file: ${err.code} - ${err.message}`);
      } else {
        setError('Failed to play file');
      }
    }
  }, [videoRef]);

  return { playerRef, error, events, handleFileSelect };
};

// FileList component
const FileList: React.FC<{ 
  files: AudioFile[], 
  selectedFile: AudioFile | null, 
  onFileSelect: (file: AudioFile) => void,
  onFileDelete: (file: AudioFile) => Promise<void>
}> = ({ files, selectedFile, onFileSelect, onFileDelete }) => (
  <Paper sx={{ p: 2, flex: 1 }}>
    <Typography variant="h6" gutterBottom>
      Available Files
    </Typography>
    <List>
      {files.map((file) => (
        <ListItem
          key={file.name}
          button
          selected={selectedFile?.name === file.name}
          onClick={() => onFileSelect(file)}
          secondaryAction={
            <IconButton
              edge="end"
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(file);
              }}
            >
              <DeleteIcon />
            </IconButton>
          }
        >
          <ListItemText primary={file.name} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

// AudioPlayer component
const AudioPlayer: React.FC<{ videoRef: React.RefObject<HTMLAudioElement> }> = ({ videoRef }) => (
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

// FileUploader component
const FileUploader: React.FC<{ onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void, loading: boolean }> = ({ onFileUpload, loading }) => (
  <label htmlFor="file-upload">
    <input
      accept="audio/*"
      style={{ display: 'none' }}
      id="file-upload"
      type="file"
      onChange={onFileUpload}
    />
    <Button
      variant="contained"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Upload Audio'}
    </Button>
  </label>
);

// CaptureAndStream component
const CaptureAndStream: React.FC<{ onCaptureAndStream: () => void, loading: boolean }> = ({ onCaptureAndStream, loading }) => (
  <label htmlFor="start-streaming">
    <Button
      onClick={onCaptureAndStream}
      variant="contained"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Start Streaming'}
    </Button>
  </label>
);

// AudioDevices component
const AudioDevices: React.FC<{ onGetAudioDevices: () => void, loading: boolean }> = ({ onGetAudioDevices, loading }) => (
  <label htmlFor="get-audio-devices">
    <Button
      onClick={onGetAudioDevices}
      variant="contained"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Get Audio Devices'}
    </Button>
  </label>
);

// StopStreaming component
const StopStreaming: React.FC<{ onStopStreaming: () => void, loading: boolean }> = ({ onStopStreaming, loading }) => (
  <label htmlFor="stop-streaming">
    <Button
      onClick={onStopStreaming}
      variant="contained"
      color="secondary"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} /> : 'Stop Streaming'}
    </Button>
  </label>
);

// ErrorAlert component
const ErrorAlert: React.FC<{ error: string | null }> = ({ error }) => (
  error ? (
    <Typography color="error" sx={{ mb: 2 }}>
      {error}
    </Typography>
  ) : null
);

// PlayerEvents component
const PlayerEvents: React.FC<{ events: PlayerEvent[] }> = ({ events }) => (
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

// PlayerInfo component
const PlayerInfo: React.FC<{ playerRef: React.RefObject<shaka.Player> }> = ({ playerRef }) => {
  const [stats, setStats] = useState<PlayerStats>({
    bufferFullness: null,
    playbackRate: null,
    playheadTime: null,
    fetchedPlaybackInfo: null,
    presentationStartTime: null,
    segmentAvailabilityDuration: null,
    playerStats: null,
    isFullyLoaded: null
  });

  useEffect(() => {
    const updateStats = async () => {
      if (playerRef.current) {
        try {
          const [
            bufferFullness,
            playbackRate,
            playheadTime,
            fetchedPlaybackInfo,
            presentationStartTime,
            segmentAvailabilityDuration,
            playerStats,
            isFullyLoaded
          ] = await Promise.all([
            playerRef.current.getBufferFullness(),
            playerRef.current.getPlaybackRate(),
            playerRef.current.getPlayheadTimeAsDate(),
            playerRef.current.getFetchedPlaybackInfo(),
            playerRef.current.getPresentationStartTimeAsDate(),
            playerRef.current.getSegmentAvailabilityDuration(),
            playerRef.current.getStats(),
            playerRef.current.isFullyLoaded()
          ]);

          setStats({
            bufferFullness,
            playbackRate,
            playheadTime,
            fetchedPlaybackInfo,
            presentationStartTime,
            segmentAvailabilityDuration,
            playerStats,
            isFullyLoaded
          });
        } catch (err) {
          console.error('Failed to get player stats:', err);
        }
      }
    };

    // Update immediately
    updateStats();

    // Then update every second
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [playerRef]);

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

function App(): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const videoRef = useRef<HTMLAudioElement>(null);
  const { files, loading, error: filesError, loadFiles } = useFiles();
  const { playerRef, error: playerError, events, handleFileSelect } = useAudioPlayer(videoRef);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await loadFiles();
    } catch (err) {
      console.error('Failed to upload file:', err);
    }
  };

  const handleFileDelete = async (file: AudioFile): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/files/${file.name}`);
      await loadFiles();
      if (selectedFile?.name === file.name) {
        setSelectedFile(null);
        if (playerRef.current) {
          await playerRef.current.destroy();
        }
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const onFileSelect = useCallback((file: AudioFile) => {
    setSelectedFile(file);
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleCaptureAndStream = async (): Promise<void> => {
    try {
      axios.post(`${API_BASE_URL}/capture-and-stream`);
      console.log('Capturing and streaming...');
      setIsStreaming(true);
      await sleep(5000);
      await loadFiles();
      console.log('Files loaded');
    } catch (err) {
      console.error('Failed to initialize stream:', err);
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = async (): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/stop-streaming`);
      setIsStreaming(false);
      await loadFiles();
    } catch (err) {
      console.error('Failed to stop stream:', err);
    }
  };

  const handleGetAudioDevices = async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/audio-devices`);
      console.log('Audio devices:', response.data);
    } catch (err) {
      console.error('Failed to get audio devices:', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Audio Streaming Player
        </Typography>

        <FileUploader onFileUpload={handleFileUpload} loading={loading} />
        <AudioDevices onGetAudioDevices={handleGetAudioDevices} loading={loading} />
        {!isStreaming ? (
          <CaptureAndStream onCaptureAndStream={handleCaptureAndStream} loading={loading} />
        ) : (
          <StopStreaming onStopStreaming={handleStopStreaming} loading={loading} />
        )}
        <ErrorAlert error={filesError || playerError} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FileList 
            files={files} 
            selectedFile={selectedFile} 
            onFileSelect={onFileSelect} 
            onFileDelete={handleFileDelete}
          />
          <AudioPlayer videoRef={videoRef} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <PlayerInfo playerRef={playerRef} />
        <PlayerEvents events={events} />
      </Box>
    </Container>
  );
}

export default App;
