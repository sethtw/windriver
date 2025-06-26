import { useState, useEffect, useRef, useCallback } from 'react';
import shaka from 'shaka-player';
import { AudioFile, PlayerEvent } from '../types';
import { logger } from '../services/logging';
import { ErrorFactory, ErrorCategory } from '../types/errors';

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
  }, [addEvent, isPlayerInitialized, videoRef]); // Fixed dependencies

  const handleFileSelect = useCallback(async (file: AudioFile): Promise<void> => {
    if (!shakaPlayerRef.current || !isPlayerInitialized) return;
    
    setError(null);
    logger.info('File selected for playback', { fileName: file.name });

    const streamId = `${API_BASE_URL}${file.manifest_url}`;
    
    try {
      logger.info('Loading manifest and segments', { streamId, fileName: file.name });
      
      (shakaPlayerRef.current as any).addEventListener('error', (event: { detail: any }) => {
        logger.error('Shaka Player error occurred', undefined, { errorDetails: event.detail });
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
      logger.info('Stream initialized successfully', { fileName: file.name });
      if (videoRef.current) {
        videoRef.current.play();
      }
    } catch (error) {
      const appError = ErrorFactory.createFromUnknownError(error, {
        component: 'useAudioPlayer',
        action: 'handleFileSelect',
        metadata: {
          fileName: file.name,
          streamId: streamId
        }
      });

      logger.logError(appError, {
        component: 'useAudioPlayer',
        action: 'handleFileSelect'
      });

      if (appError.category === ErrorCategory.PLAYER) {
        setError(`Player error: ${appError.message}`);
      } else {
        setError('Failed to play file');
      }
    }
  }, [videoRef, isPlayerInitialized]);

  return { playerRef: shakaPlayerRef, error, events, handleFileSelect };
}; 