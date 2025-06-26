import { useState, useEffect, useRef, useCallback } from 'react';
import shaka from 'shaka-player';
import { AudioFile, PlayerEvent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useAudioPlayer = (videoRef: React.RefObject<HTMLAudioElement>) => {
  const shakaPlayerRef = useRef<shaka.Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PlayerEvent[]>([]);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState<boolean>(false);

  const addEvent = useCallback((type: string, details: any) => {
    setEvents(prev => [...prev, {
      type,
      timestamp: Date.now(),
      details
    }].slice(-50)); // Keep last 50 events
  }, []);

  // Initialize Shaka player once
  useEffect(() => {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && videoRef.current && !isPlayerInitialized) {
      // Create player without media element
      const shakaPlayer = new shaka.Player();
      // Attach the media element using the attach method
      shakaPlayerRef.current = shakaPlayer;
      shakaPlayerRef.current.attach(videoRef.current);

      // Add event listeners
      const eventTypes = [
        'buffering',
        'loaded',
        'loading',
        'manifestparsed',
        'manifestupdated',
        'started',
        'statechanged'
      ];

      eventTypes.forEach(eventType => {
        shakaPlayerRef.current!.addEventListener(eventType, (event: { detail: any }) => {
          addEvent(eventType, event.detail);
        });
      });

      setIsPlayerInitialized(true);
    }

    return () => {
      if (shakaPlayerRef.current) {
        shakaPlayerRef.current.destroy();
        setIsPlayerInitialized(false);
      }
    };
  }, []); // No dependencies - only run once

  const handleFileSelect = useCallback(async (file: AudioFile): Promise<void> => {
    if (!shakaPlayerRef.current || !isPlayerInitialized) return;
    
    setError(null);
    console.log('Selected file:', file);

    try {
      const streamId = `${API_BASE_URL}${file.manifest_url}`;
      console.log('Attempting to load manifest and segments from:', streamId);
      
      (shakaPlayerRef.current as any).addEventListener('error', (event: { detail: any }) => {
        console.error('Shaka Player error:', event.detail);
        setError(`Player error: ${event.detail.code} - ${event.detail.message}`);
      });

      (shakaPlayerRef.current as any).configure({
        streaming: {
          retryParameters: {
            timeout: 10000,
            maxAttempts: 3,
            baseDelay: 1000,
            backoffFactor: 2,
            fuzzFactor: 0.5
          }
        }
      });

      await shakaPlayerRef.current.load(streamId);
      console.log(`Stream ${file.name} initialized`);
      if (videoRef.current) {
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Detailed error:', err);
      if (err.code && err.message) {
        setError(`Failed to play file: ${err.code} - ${err.message}`);
      } else {
        setError('Failed to play file');
      }
    }
  }, [videoRef, isPlayerInitialized]);

  return { playerRef: shakaPlayerRef, error, events, handleFileSelect };
}; 