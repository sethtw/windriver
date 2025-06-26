import { ApiService } from '../services/api';
import { sleep } from '../utils';
import { logger } from '../services/logging';

/**
 * Streaming operation handlers for managing audio capture and streaming
 */
export class StreamingHandlers {
  /**
   * Handle capture and streaming initialization
   */
  static async handleCaptureAndStream(
    onStreamingStart?: () => void,
    onStreamingError?: () => void,
    onFilesReload?: () => void
  ): Promise<void> {
    try {
      await ApiService.startCaptureAndStream();
      logger.info('Capturing and streaming...');
      onStreamingStart?.();
      
      // Wait for processing and reload files
      await sleep(5000);
      onFilesReload?.();
      logger.info('Files loaded');
    } catch (err) {
      logger.error('Failed to initialize stream', undefined, { error: err });
      onStreamingError?.();
    }
  }

  /**
   * Handle stopping the streaming process
   */
  static async handleStopStreaming(
    onStreamingStop?: () => void,
    onError?: (error: any) => void,
    onFilesReload?: () => void
  ): Promise<void> {
    try {
      await ApiService.stopStreaming();
      onStreamingStop?.();
      onFilesReload?.();
    } catch (err) {
      logger.error('Failed to stop stream', undefined, { error: err });
      onError?.(err);
    }
  }

  /**
   * Handle getting audio devices
   */
  static async handleGetAudioDevices(
    onSuccess?: (devices: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      const devices = await ApiService.getAudioDevices();
      logger.info('Audio devices:', devices);
      onSuccess?.(devices);
    } catch (err) {
      logger.error('Failed to get audio devices', undefined, { error: err });
      onError?.(err);
    }
  }
} 