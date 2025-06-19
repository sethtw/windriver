import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Box, Typography } from '@mui/material';

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

// Import handlers
import { FileHandlers, StreamingHandlers } from './handlers';

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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    await FileHandlers.handleFileUpload(event, loadFiles);
  }, [loadFiles]);

  const handleFileDelete = useCallback(async (file: AudioFile): Promise<void> => {
    await FileHandlers.handleFileDelete(
      file,
      selectedFile?.name || null,
      loadFiles,
      undefined,
      () => setSelectedFile(null),
      async () => {
        if (playerRef.current) {
          await playerRef.current.destroy();
        }
      }
    );
  }, [selectedFile, loadFiles, playerRef]);

  const onFileSelect = useCallback((file: AudioFile) => {
    FileHandlers.handleFileSelect(file, setSelectedFile, handleFileSelect);
  }, [handleFileSelect]);

  const handleCaptureAndStream = useCallback(async (): Promise<void> => {
    await StreamingHandlers.handleCaptureAndStream(
      () => setIsStreaming(true),
      () => setIsStreaming(false),
      loadFiles
    );
  }, [loadFiles]);

  const handleStopStreaming = useCallback(async (): Promise<void> => {
    await StreamingHandlers.handleStopStreaming(
      () => setIsStreaming(false),
      undefined,
      loadFiles
    );
  }, [loadFiles]);

  const handleGetAudioDevices = useCallback(async (): Promise<void> => {
    await StreamingHandlers.handleGetAudioDevices();
  }, []);

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
