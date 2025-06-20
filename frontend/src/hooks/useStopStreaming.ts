import { useCallback } from 'react';
import { StreamingHandlers } from '../handlers/streamingHandlers';
import { logger } from '../services/logging';
import { StreamingError, ErrorFactory, ErrorCategory } from '../types/errors';
import { ErrorRecovery } from '../utils/errorRecovery';

interface UseStopStreamingProps {
  setIsStreaming: (isStreaming: boolean) => void;
  loadFiles: () => void;
}

export const useStopStreaming = ({
  setIsStreaming,
  loadFiles
}: UseStopStreamingProps) => {
  const handleStopStreaming = useCallback(async (): Promise<void> => {
    logger.info('Starting stop streaming operation');

    try {
      // Use error recovery with retry logic
      await ErrorRecovery.retry(
        async () => {
          await StreamingHandlers.handleStopStreaming(
            () => {
              setIsStreaming(false);
              logger.info('Streaming stopped successfully');
            },
            (error) => {
              logger.error('Failed to stop streaming', error);
            },
            () => {
              loadFiles();
              logger.info('Files reloaded after streaming stop');
            }
          );
        },
        {
          maxAttempts: 2,
          baseDelay: 1000,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR
          ]
        }
      );

      logger.info('Stop streaming operation completed successfully');
    } catch (error) {
      const appError = ErrorFactory.createFromUnknownError(error, {
        component: 'useStopStreaming',
        action: 'handleStopStreaming'
      });

      // Create specific streaming error
      const streamingError = new StreamingError(
        'Failed to stop streaming',
        'stop',
        appError.context,
        appError
      );

      logger.logError(streamingError, {
        component: 'useStopStreaming',
        action: 'handleStopStreaming'
      });

      // Ensure streaming state is reset even on error
      setIsStreaming(false);
      throw streamingError;
    }
  }, [setIsStreaming, loadFiles]);

  return { handleStopStreaming };
}; 