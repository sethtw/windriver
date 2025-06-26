import { ApiService } from '../services/api';
import { sleep } from '../utils';

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
      console.log('Capturing and streaming...');
      onStreamingStart?.();
      
      // Wait for processing and reload files
      await sleep(5000);
      onFilesReload?.();
      console.log('Files loaded');
    } catch (err) {
      console.error('Failed to initialize stream:', err);
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
      console.error('Failed to stop stream:', err);
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
      console.log('Audio devices:', devices);
      onSuccess?.(devices);
    } catch (err) {
      console.error('Failed to get audio devices:', err);
      onError?.(err);
    }
  }
} 