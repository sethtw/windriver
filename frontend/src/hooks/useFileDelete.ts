import { useCallback } from 'react';
import { AudioFile } from '../types';
import { FileHandlers } from '../handlers/fileHandlers';
import { logger } from '../services/logging';
import { FileOperationError, ErrorFactory, ErrorCategory } from '../types/errors';
import { ErrorRecovery } from '../utils/errorRecovery';

interface UseFileDeleteProps {
  selectedFile: AudioFile | null;
  setSelectedFile: (file: AudioFile | null) => void;
  playerRef: React.RefObject<any>;
  loadFiles: () => void;
}

export const useFileDelete = ({
  selectedFile,
  setSelectedFile,
  playerRef,
  loadFiles
}: UseFileDeleteProps) => {
  const handleFileDelete = useCallback(async (file: AudioFile): Promise<void> => {
    logger.info('Starting file deletion', {
      fileName: file.name,
      isSelected: selectedFile?.name === file.name
    });

    try {
      // Use error recovery with retry logic
      await ErrorRecovery.retry(
        async () => {
          await FileHandlers.handleFileDelete(
            file,
            selectedFile?.name || null,
            loadFiles,
            (error) => {
              logger.error('File deletion failed', error);
            },
            () => setSelectedFile(null),
            async () => {
              if (playerRef.current) {
                await playerRef.current.destroy();
              }
            }
          );
        },
        {
          maxAttempts: 2,
          baseDelay: 500,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR
          ]
        }
      );

      logger.info('File deletion completed successfully', {
        fileName: file.name
      });
    } catch (error) {
      const appError = ErrorFactory.createFromUnknownError(error, {
        component: 'useFileDelete',
        action: 'handleFileDelete',
        metadata: {
          fileName: file.name,
          isSelected: selectedFile?.name === file.name
        }
      });

      // Create specific file operation error
      const fileError = new FileOperationError(
        `Failed to delete file: ${file.name}`,
        'delete',
        appError.context,
        appError
      );

      logger.logError(fileError, {
        component: 'useFileDelete',
        action: 'handleFileDelete'
      });

      throw fileError;
    }
  }, [selectedFile, setSelectedFile, playerRef, loadFiles]);

  return { handleFileDelete };
}; 