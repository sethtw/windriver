import { useState, useEffect, useRef } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';

// Import components
import FileList from './components/FileList';
import { MultiAudioPlayer } from './components/AudioPlayer';
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
  useCaptureAndStream,
  useStopStreaming,
  useAudioDevices,
  useActivePlayers
} from './hooks';

// Import types
import { AudioFile } from './types';

function App(): JSX.Element {
  const [showPlayerInfo, setShowPlayerInfo] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const videoRef = useRef<HTMLAudioElement>(null);
  
  // Core hooks
  const { files, loading, error: filesError, loadFiles } = useFiles();
  const { playerRef, error: playerError, events } = useAudioPlayer(videoRef);
  const { activePlayers, addPlayer, removePlayer, clearAllPlayers } = useActivePlayers();
  
  // File hooks
  const { handleFileUpload } = useFileUpload(loadFiles);
  const { handleFileDelete } = useFileDelete({
    selectedFile: null, // No longer using single selected file
    setSelectedFile: () => {}, // No longer using single selected file
    playerRef,
    loadFiles
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
  }, []);

  // Handle file selection to add to active players
  const handleFileSelectForPlayer = (file: AudioFile) => {
    addPlayer(file);
  };

  // Handle removing a player
  const handleRemovePlayer = (fileName: string) => {
    removePlayer(fileName);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Multi-Audio Streaming Player
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FileUploader onFileUpload={handleFileUpload} loading={loading} />
          <AudioDevices onGetAudioDevices={handleGetAudioDevices} loading={loading} />
          {!isStreaming ? (
            <CaptureAndStream onCaptureAndStream={handleCaptureAndStream} loading={loading} />
          ) : (
            <StopStreaming onStopStreaming={handleStopStreaming} loading={loading} />
          )}
          {activePlayers.length > 0 && (
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={clearAllPlayers}
              disabled={loading}
            >
              Clear All Players
            </Button>
          )}
        </Box>
        <ErrorAlert error={filesError || playerError} />

        <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
          <Box sx={{ flex: '0 0 300px' }}>
            <Typography variant="h6" gutterBottom>
              Available Files
            </Typography>
            <FileList
              files={files}
              selectedFile={null}
              activePlayers={activePlayers}
              onFileSelect={handleFileSelectForPlayer}
              onFileDelete={handleFileDelete}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <MultiAudioPlayer
              activePlayers={activePlayers}
              onRemovePlayer={handleRemovePlayer}
            />
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button variant="contained" color="primary" onClick={() => setShowPlayerInfo(!showPlayerInfo)}>
          {showPlayerInfo ? 'Hide Player Info' : 'Show Player Info'}
        </Button>
        {showPlayerInfo && (
          <>
            <PlayerInfo playerRef={playerRef} />
            <PlayerEvents events={events} />
          </>
        )}
      </Box>
    </Container>
  );
}

export default App;
