import { AudioFile } from '../types';
import { ApiService } from '../services/api';
import { logger } from '../services/logging';

/**
 * File operation handlers for managing audio files
 */
export class FileHandlers {
  /**
   * Handle file upload from input element
   */
  static async handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await ApiService.uploadFile(file);
      onSuccess?.();
    } catch (err) {
      logger.error('Failed to upload file', undefined, { error: err });
      onError?.(err);
    }
  }

  /**
   * Handle file deletion
   */
  static async handleFileDelete(
    file: AudioFile,
    selectedFileName: string | null,
    onSuccess?: () => void,
    onError?: (error: any) => void,
    onSelectionClear?: () => void,
    onPlayerDestroy?: () => void
  ): Promise<void> {
    try {
      await ApiService.deleteFile(file.name);
      onSuccess?.();
      
      // Clear selection if deleted file was selected
      if (selectedFileName === file.name) {
        onSelectionClear?.();
        onPlayerDestroy?.();
      }
    } catch (err) {
      logger.error('Failed to delete file', undefined, { error: err });
      onError?.(err);
    }
  }

  /**
   * Handle file selection
   */
  static handleFileSelect(
    file: AudioFile,
    onSelectionChange: (file: AudioFile) => void,
    onPlayerFileSelect: (file: AudioFile) => void
  ): void {
    onSelectionChange(file);
    onPlayerFileSelect(file);
  }
} 