import { useState, useCallback } from 'react';
import { AudioFile } from '../types';

export const useActivePlayers = () => {
  const [activePlayers, setActivePlayers] = useState<AudioFile[]>([]);

  const addPlayer = useCallback((file: AudioFile) => {
    setActivePlayers(prev => {
      // Check if player already exists for this file
      const playerExists = prev.some(player => player.name === file.name);
      if (!playerExists) {
        return [...prev, file];
      }
      return prev;
    });
  }, []);

  const removePlayer = useCallback((fileName: string) => {
    setActivePlayers(prev => prev.filter(player => player.name !== fileName));
  }, []);

  const clearAllPlayers = useCallback(() => {
    setActivePlayers([]);
  }, []);

  const isPlayerActive = useCallback((fileName: string) => {
    return activePlayers.some(player => player.name === fileName);
  }, [activePlayers]);

  return {
    activePlayers,
    addPlayer,
    removePlayer,
    clearAllPlayers,
    isPlayerActive
  };
}; 