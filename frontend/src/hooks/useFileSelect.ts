import { useCallback } from 'react';
import { AudioFile } from '../types';
import { FileHandlers } from '../handlers/fileHandlers';

interface UseFileSelectProps {
  setSelectedFile: (file: AudioFile | null) => void;
  onPlayerFileSelect?: (file: AudioFile) => void;
}

export const useFileSelect = ({ 
  setSelectedFile, 
  onPlayerFileSelect 
}: UseFileSelectProps) => {
  const handleFileSelect = useCallback((file: AudioFile) => {
    FileHandlers.handleFileSelect(file, setSelectedFile, onPlayerFileSelect || (() => {}));
  }, [setSelectedFile, onPlayerFileSelect]);

  return { handleFileSelect };
}; 