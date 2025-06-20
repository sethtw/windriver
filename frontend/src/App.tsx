import { useState, useEffect, useRef } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';

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
import { 
  useFiles, 
  useAudioPlayer, 
  useFileUpload, 
  useFileDelete, 
  useFileSelect,
  useCaptureAndStream,
  useStopStreaming,
  useAudioDevices
} from './hooks';

// Import types
import { AudioFile } from './types';
import LogViewer from './components/LogViewer';

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
  
  // Core hooks
  const { files, loading, error: filesError, loadFiles } = useFiles();
  const { playerRef, error: playerError, events, handleFileSelect: playerHandleFileSelect } = useAudioPlayer(videoRef);
  
  // File hooks
  const { handleFileUpload } = useFileUpload(loadFiles);
  const { handleFileDelete } = useFileDelete({
    selectedFile,
    setSelectedFile,
    playerRef,
    loadFiles
  });
  const { handleFileSelect } = useFileSelect({
    setSelectedFile,
    onPlayerFileSelect: playerHandleFileSelect
  });

  // Streaming hooks
  const { handleCaptureAndStream } = useCaptureAndStream({
    setIsStreaming,
    loadFiles
  });
  const { handleStopStreaming } = useStopStreaming({
    setIsStreaming,
    loadFiles
  });
  const { handleGetAudioDevices } = useAudioDevices();

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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
            onFileSelect={handleFileSelect}
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
