import { useCallback } from 'react';
import { StreamingHandlers } from '../handlers/streamingHandlers';
import { logger } from '../services/logging';
import { AppError, ErrorFactory, ErrorCategory, ErrorSeverity } from '../types/errors';
import { ErrorRecovery } from '../utils/errorRecovery';

export const useAudioDevices = () => {
  const handleGetAudioDevices = useCallback(async (): Promise<void> => {
    logger.info('Starting audio devices retrieval');

    try {
      // Use error recovery with retry logic
      await ErrorRecovery.retry(
        async () => {
          await StreamingHandlers.handleGetAudioDevices(
            (devices) => {
              logger.info('Audio devices retrieved successfully', {
                deviceCount: devices?.length || 0
              });
            },
            (error) => {
              logger.error('Failed to get audio devices', error);
            }
          );
        },
        {
          maxAttempts: 2,
          baseDelay: 1000,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR,
            ErrorCategory.TIMEOUT
          ]
        }
      );

      logger.info('Audio devices operation completed successfully');
    } catch (error) {
      const appError = ErrorFactory.createFromUnknownError(error, {
        component: 'useAudioDevices',
        action: 'handleGetAudioDevices'
      });

      // Create specific error for audio devices
      const audioDevicesError = new AppError(
        'Failed to retrieve audio devices',
        ErrorCategory.CLIENT_ERROR,
        ErrorSeverity.MEDIUM,
        appError.context,
        true,
        appError,
        'Unable to access audio devices. Please check your browser permissions.'
      );

      logger.logError(audioDevicesError, {
        component: 'useAudioDevices',
        action: 'handleGetAudioDevices'
      });

      throw audioDevicesError;
    }
  }, []);

  return { handleGetAudioDevices };
}; 