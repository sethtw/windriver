import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Box, Typography } from '@mui/material';
import axios from 'axios';
import shaka from 'shaka-player';

// Import components
import FileList from './components/FileList';
import AudioPlayer from './components/AudioPlayer';
import FileUploader from './components/FileUploader';
import CaptureAndStream from './components/CaptureAndStream';
import AudioDevices from './components/AudioDevices';
import StopStreaming from './components/StopStreaming';
import ErrorAlert from './components/ErrorAlert';
import PlayerEvents from './components/PlayerEvents';
import PlayerInfo from './components/PlayerInfo';

// Import hooks
import { useFiles, useAudioPlayer } from './hooks';

// Import types
import { AudioFile } from './types';

// Import utilities
import { sleep } from './utils';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Add Shaka Player type definitions
declare module 'shaka-player' {
  interface Player {
    addEventListener(event: string, callback: (event: { detail: any }) => void): void;
    configure(config: { streaming: { retryParameters: any } }): void;
  }
}

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
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FileUploader onFileUpload={handleFileUpload} loading={loading} />
          <AudioDevices onGetAudioDevices={handleGetAudioDevices} loading={loading} />
          {!isStreaming ? (
            <CaptureAndStream onCaptureAndStream={handleCaptureAndStream} loading={loading} />
          ) : (
            <StopStreaming onStopStreaming={handleStopStreaming} loading={loading} />
          )}
        </Box>
        <ErrorAlert error={filesError || playerError} />

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <FileList
            files={files}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            onFileDelete={handleFileDelete}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <AudioPlayer videoRef={videoRef} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <PlayerInfo playerRef={playerRef} />
        <PlayerEvents events={events} />
      </Box>
    </Container>
  );
}

export default App;
