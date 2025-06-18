import { useState, useEffect, useRef, useCallback } from 'react';
import shaka from 'shaka-player';
import { AudioFile, PlayerEvent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const useAudioPlayer = (videoRef: React.RefObject<HTMLAudioElement>) => {
  const playerRef = useRef<shaka.Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PlayerEvent[]>([]);

  const addEvent = useCallback((type: string, details: any) => {
    setEvents(prev => [...prev, {
      type,
      timestamp: Date.now(),
      details
    }].slice(-50)); // Keep last 50 events
  }, []);

  useEffect(() => {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported() && videoRef.current) {
      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

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
        player.addEventListener(eventType, (event: { detail: any }) => {
          addEvent(eventType, event.detail);
        });
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoRef, addEvent]);

  const handleFileSelect = useCallback(async (file: AudioFile): Promise<void> => {
    setError(null);
    console.log('Selected file:', file);

    try {
      if (playerRef.current) {
        const streamId = `${API_BASE_URL}${file.manifest_url}`;
        console.log('Attempting to load manifest and segments from:', streamId);
        
        (playerRef.current as any).addEventListener('error', (event: { detail: any }) => {
          console.error('Shaka Player error:', event.detail);
          setError(`Player error: ${event.detail.code} - ${event.detail.message}`);
        });

        (playerRef.current as any).configure({
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

        await playerRef.current.load(streamId);
        console.log(`Stream ${file.name} initialized`);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }
    } catch (err: any) {
      console.error('Detailed error:', err);
      if (err.code && err.message) {
        setError(`Failed to play file: ${err.code} - ${err.message}`);
      } else {
        setError('Failed to play file');
      }
    }
  }, [videoRef]);

  return { playerRef, error, events, handleFileSelect };
}; 