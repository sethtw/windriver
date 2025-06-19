import axios from 'axios';
import { AudioFile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * API service for handling all backend communication
 */
export class ApiService {
  /**
   * Upload a file to the server
   */
  static async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete a file from the server
   */
  static async deleteFile(fileName: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/files/${fileName}`);
  }

  /**
   * Start capture and streaming process
   */
  static async startCaptureAndStream(): Promise<void> {
    await axios.post(`${API_BASE_URL}/capture-and-stream`);
  }

  /**
   * Stop the streaming process
   */
  static async stopStreaming(): Promise<void> {
    await axios.post(`${API_BASE_URL}/stop-streaming`);
  }

  /**
   * Get available audio devices
   */
  static async getAudioDevices(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/audio-devices`);
    return response.data;
  }
} 