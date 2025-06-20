import { useCallback } from 'react';
import { FileHandlers } from '../handlers/fileHandlers';
import { logger } from '../services/logging';
import { FileOperationError, ErrorFactory, ErrorCategory } from '../types/errors';
import { ErrorRecovery } from '../utils/errorRecovery';

export const useFileUpload = (loadFiles: () => void) => {
  const handleFileUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      logger.warn('No file selected for upload');
      return;
    }

    logger.info('Starting file upload', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      // Use error recovery with retry logic
      await ErrorRecovery.retry(
        async () => {
          await FileHandlers.handleFileUpload(event, loadFiles);
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR,
            ErrorCategory.TIMEOUT
          ]
        }
      );

      logger.info('File upload completed successfully', {
        fileName: file.name
      });
    } catch (error) {
      const appError = ErrorFactory.createFromUnknownError(error, {
        component: 'useFileUpload',
        action: 'handleFileUpload',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });

      // Create specific file operation error
      const fileError = new FileOperationError(
        `Failed to upload file: ${file.name}`,
        'upload',
        appError.context,
        appError
      );

      logger.logError(fileError, {
        component: 'useFileUpload',
        action: 'handleFileUpload'
      });

      throw fileError;
    }
  }, [loadFiles]);

  return { handleFileUpload };
}; 