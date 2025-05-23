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
  CircularProgress
} from '@mui/material';
import shaka from 'shaka-player';
import axios, { AxiosError } from 'axios';
const API_BASE_URL = 'http://localhost:8000';

interface AudioFile {
  name: string;
  manifest_url: string;
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

  useEffect(() => {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && videoRef.current) {
      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoRef]);

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

  return { playerRef, error, handleFileSelect };
};

// FileList component
const FileList: React.FC<{ files: AudioFile[], selectedFile: AudioFile | null, onFileSelect: (file: AudioFile) => void }> = ({ files, selectedFile, onFileSelect }) => (
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
  <Paper sx={{ p: 2, mb: 2 }}>
    <input
      accept="audio/*"
      style={{ display: 'none' }}
      id="file-upload"
      type="file"
      onChange={onFileUpload}
    />
    <label htmlFor="file-upload">
      <Button
        variant="contained"
        component="span"
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Upload Audio'}
      </Button>
    </label>
  </Paper>
);

// CaptureAndStream component
const CaptureAndStream: React.FC<{ onCaptureAndStream: () => void, loading: boolean }> = ({ onCaptureAndStream, loading }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
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
  </Paper>
);

// AudioDevices component
const AudioDevices: React.FC<{ onGetAudioDevices: () => void, loading: boolean }> = ({ onGetAudioDevices, loading }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
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
  </Paper>
);

// StopStreaming component
const StopStreaming: React.FC<{ onStopStreaming: () => void, loading: boolean }> = ({ onStopStreaming, loading }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
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
  </Paper>
);

// ErrorAlert component
const ErrorAlert: React.FC<{ error: string | null }> = ({ error }) => (
  error ? (
    <Typography color="error" sx={{ mb: 2 }}>
      {error}
    </Typography>
  ) : null
);

function App(): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const videoRef = useRef<HTMLAudioElement>(null);
  const { files, loading, error: filesError, loadFiles } = useFiles();
  const { playerRef, error: playerError, handleFileSelect } = useAudioPlayer(videoRef);

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
          <FileList files={files} selectedFile={selectedFile} onFileSelect={onFileSelect} />
          <AudioPlayer videoRef={videoRef} />
        </Box>
      </Box>
    </Container>
  );
}

export default App;
