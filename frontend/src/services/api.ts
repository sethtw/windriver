import axios, { AxiosError, AxiosInstance } from 'axios';
import { AudioFile } from '../types';
import { logger } from './logging';
import { ErrorFactory, ErrorCategory } from '../types/errors';
import { ErrorRecovery } from '../utils/errorRecovery';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with interceptors
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      logger.debug('API Request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL
      });
      return config;
    },
    (error) => {
      logger.error('API Request Error', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      logger.debug('API Response', {
        status: response.status,
        url: response.config.url,
        method: response.config.method?.toUpperCase()
      });
      return response;
    },
    (error: AxiosError) => {
      const appError = ErrorFactory.createFromAxiosError(error, {
        component: 'ApiService',
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });

      logger.logError(appError, {
        component: 'ApiService',
        action: 'apiRequest'
      });

      return Promise.reject(appError);
    }
  );

  return client;
};

const apiClient = createApiClient();

// Circuit breaker for API calls
const apiCircuitBreaker = ErrorRecovery.createCircuitBreaker(5, 60000);

/**
 * API service for handling all backend communication with enterprise error handling
 */
export class ApiService {
  /**
   * Upload a file to the server with retry logic
   */
  static async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    logger.info('Starting file upload to server', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    return apiCircuitBreaker(async () => {
      await ErrorRecovery.retry(
        async () => {
          await apiClient.post('/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // Longer timeout for file uploads
          });
        },
        {
          maxAttempts: 3,
          baseDelay: 2000,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR,
            ErrorCategory.TIMEOUT
          ]
        }
      );
    });
  }

  /**
   * Delete a file from the server with retry logic
   */
  static async deleteFile(fileName: string): Promise<void> {
    logger.info('Starting file deletion from server', {
      fileName
    });

    return apiCircuitBreaker(async () => {
      await ErrorRecovery.retry(
        async () => {
          await apiClient.delete(`/files/${fileName}`);
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
    });
  }

  /**
   * Start capture and streaming process with retry logic
   */
  static async startCaptureAndStream(): Promise<void> {
    logger.info('Starting capture and stream process');

    return apiCircuitBreaker(async () => {
      await ErrorRecovery.retry(
        async () => {
          await apiClient.post('/capture-and-stream');
        },
        {
          maxAttempts: 2,
          baseDelay: 3000,
          retryableErrors: [
            ErrorCategory.NETWORK,
            ErrorCategory.SERVER_ERROR,
            ErrorCategory.TIMEOUT
          ]
        }
      );
    });
  }

  /**
   * Stop the streaming process with retry logic
   */
  static async stopStreaming(): Promise<void> {
    logger.info('Stopping streaming process');

    return apiCircuitBreaker(async () => {
      await ErrorRecovery.retry(
        async () => {
          await apiClient.post('/stop-streaming');
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
    });
  }

  /**
   * Get available audio devices with retry logic
   */
  static async getAudioDevices(): Promise<any> {
    logger.info('Retrieving audio devices from server');

    return apiCircuitBreaker(async () => {
      return ErrorRecovery.retry(
        async () => {
          const response = await apiClient.get('/audio-devices');
          return response.data;
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
    });
  }

  /**
   * Get files list with retry logic
   */
  static async getFiles(): Promise<AudioFile[]> {
    logger.info('Retrieving files list from server');

    return apiCircuitBreaker(async () => {
      return ErrorRecovery.retry(
        async () => {
          const response = await apiClient.get<AudioFile[]>('/files');
          return response.data;
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
    });
  }
} 