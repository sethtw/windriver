import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { AudioFile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useFiles = () => {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<AudioFile[]>(`${API_BASE_URL}/files`);
      setFiles(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.message);
      } else {
        setError('Failed to load files');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { files, loading, error, loadFiles };
}; 