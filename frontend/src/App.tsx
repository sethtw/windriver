import React, { useState, useEffect, useRef } from 'react';
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
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface AudioFile {
  name: string;
  manifest_url: string;
  manifest_url_new: string;
}

// Add Shaka Player type definitions
declare module 'shaka-player' {
  interface Player {
    addEventListener(event: string, callback: (event: { detail: any }) => void): void;
    configure(config: { streaming: { retryParameters: any } }): void;
  }
}

function App(): JSX.Element {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);

  useEffect(() => {
    // Initialize Shaka Player
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && videoRef.current) {
      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;
    }

    // Load available files
    loadFiles();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const loadFiles = async (): Promise<void> => {
    try {
      const response = await axios.get<AudioFile[]>(`${API_BASE_URL}/files`);
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

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
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: AudioFile): Promise<void> => {
    setSelectedFile(file);
    setError(null);
    console.log('Selected file:', file);

    try {
      if (playerRef.current) {
        // // Ensure the manifest URL is properly constructed
        // const manifestUrl = `${API_BASE_URL}${file.manifest_url_new}`;
        // console.log('Attempting to load manifest from:', manifestUrl);
        
        const streamId = `${API_BASE_URL}${file.manifest_url}`;
        console.log('Attempting to load manifest and segments from:', streamId);
        
        // Add error event listener with type casting
        (playerRef.current as any).addEventListener('error', (event: { detail: any }) => {
          console.error('Shaka Player error:', event.detail);
          setError(`Player error: ${event.detail.code} - ${event.detail.message}`);
        });

        // Configure network retry parameters with type casting
        (playerRef.current as any).configure({
          streaming: {
            retryParameters: {
              timeout: 10000,  // 10 seconds
              maxAttempts: 3,
              baseDelay: 1000,  // 1 second
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
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Audio Streaming Player
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <input
            accept="audio/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
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

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
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
                  onClick={() => handleFileSelect(file)}
                >
                  <ListItemText primary={file.name} />
                </ListItem>
              ))}
            </List>
          </Paper>

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
        </Box>
      </Box>
    </Container>
  );
}

export default App;
