import { useCallback } from 'react';
import { StreamingHandlers } from '../handlers/streamingHandlers';
import { logger } from '../services/logging';
import { StreamingError, ErrorFactory, ErrorCategory } from '../types/errors';
import { ErrorRecovery } from '../utils/errorRecovery';

interface UseCaptureAndStreamProps {
  setIsStreaming: (isStreaming: boolean) => void;
  loadFiles: () => void;
}

export const useCaptureAndStream = ({
  setIsStreaming,
  loadFiles
}: UseCaptureAndStreamProps) => {
  const handleCaptureAndStream = useCallback(async (): Promise<void> => {
    logger.info('Starting capture and stream operation');

    try {
      // Use error recovery with retry logic
      await ErrorRecovery.retry(
        async () => {
          await StreamingHandlers.handleCaptureAndStream(
            () => {
              setIsStreaming(true);
              logger.info('Streaming started successfully');
            },
            () => {
              setIsStreaming(false);
              logger.warn('Streaming failed to start');
            },
            () => {
              loadFiles();
              logger.info('Files reloaded after streaming start');
            }
          );
        },
        {
          maxAttempts: 2,
          baseDelay: 2000,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR,
            ErrorCategory.TIMEOUT
          ]
        }
      );

      logger.info('Capture and stream operation completed successfully');
    } catch (error) {
      const appError = ErrorFactory.createFromUnknownError(error, {
        component: 'useCaptureAndStream',
        action: 'handleCaptureAndStream'
      });

      // Create specific streaming error
      const streamingError = new StreamingError(
        'Failed to start capture and stream',
        'start',
        appError.context,
        appError
      );

      logger.logError(streamingError, {
        component: 'useCaptureAndStream',
        action: 'handleCaptureAndStream'
      });

      // Reset streaming state on error
      setIsStreaming(false);
      throw streamingError;
    }
  }, [setIsStreaming, loadFiles]);

  return { handleCaptureAndStream };
}; 