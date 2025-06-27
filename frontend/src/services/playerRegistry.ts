import shaka from 'shaka-player';

class PlayerRegistry {
  private players = new Map<string, shaka.Player>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private playerStates = new Map<string, {
    isPlaying: boolean;
    currentTime: number;
    volume: number;
  }>();

  // Store manifest URL for reattachment
  private manifestUrls = new Map<string, string>();

  getPlayer(fileName: string): shaka.Player | null {
    return this.players.get(fileName) || null;
  }

  getAudioElement(fileName: string): HTMLAudioElement | null {
    return this.audioElements.get(fileName) || null;
  }

  registerPlayer(fileName: string, player: shaka.Player, audioElement: HTMLAudioElement) {
    console.log('registerPlayer called for:', fileName, 'player:', player, 'audioElement:', audioElement);
    this.players.set(fileName, player);
    this.audioElements.set(fileName, audioElement);
    
    // Store current state
    this.playerStates.set(fileName, {
      isPlaying: !audioElement.paused,
      currentTime: audioElement.currentTime,
      volume: audioElement.volume
    });
    
    console.log('Player registered with state:', this.playerStates.get(fileName));
  }

  unregisterPlayer(fileName: string) {
    const player = this.players.get(fileName);
    if (player) {
      player.destroy();
      this.players.delete(fileName);
      this.audioElements.delete(fileName);
      this.playerStates.delete(fileName);
    }
  }

  isPlayerRegistered(fileName: string): boolean {
    return this.players.has(fileName);
  }

  getPlayerState(fileName: string) {
    return this.playerStates.get(fileName);
  }

  updatePlayerState(fileName: string, state: Partial<{
    isPlaying: boolean;
    currentTime: number;
    volume: number;
  }>) {
    const currentState = this.playerStates.get(fileName);
    if (currentState) {
      this.playerStates.set(fileName, { ...currentState, ...state });
      console.log('Updated player state for:', fileName, 'new state:', this.playerStates.get(fileName));
    }
  }

  // Update player state from audio element
  updatePlayerStateFromAudio(fileName: string, audioElement: HTMLAudioElement) {
    this.updatePlayerState(fileName, {
      isPlaying: !audioElement.paused,
      currentTime: audioElement.currentTime,
      volume: audioElement.volume
    });
  }

  // Reattach player to a new audio element (for when component remounts)
  async reattachPlayer(fileName: string, newAudioElement: HTMLAudioElement) {
    console.log('reattachPlayer called for:', fileName, 'newAudioElement:', newAudioElement);
    const player = this.players.get(fileName);
    console.log('Found player in registry:', player);
    
    if (player) {
      console.log('Attaching player to new audio element');
      
      // Store current state before reattaching
      const state = this.playerStates.get(fileName);
      console.log('Current player state:', state);
      
      // Attach to new audio element
      player.attach(newAudioElement);
      this.audioElements.set(fileName, newAudioElement);
      
      // Verify attachment worked
      console.log('Player attached, checking if it controls the audio element');
      console.log('Audio element readyState:', newAudioElement.readyState);
      console.log('Audio element paused:', newAudioElement.paused);
      console.log('Audio element currentTime:', newAudioElement.currentTime);
      
      // Reload content using stored manifest URL
      const manifestUrl = this.getManifestUrl(fileName);
      if (manifestUrl) {
        console.log('Reloading content with stored manifest URL:', manifestUrl);
        try {
          await player.load(manifestUrl);
          console.log('Content reloaded successfully');
          
          // Restore state after successful reload
          if (state) {
            console.log('Restoring player state:', state);
            newAudioElement.currentTime = state.currentTime;
            newAudioElement.volume = state.volume;
            if (state.isPlaying) {
              console.log('Resuming playback for:', fileName);
              try {
                await newAudioElement.play();
                console.log('Playback resumed successfully');
              } catch (error) {
                console.error('Failed to resume playback:', error);
              }
            }
          }
        } catch (error) {
          console.error('Failed to reload content:', error);
        }
      } else {
        console.log('No manifest URL stored for:', fileName);
        // Just restore state without reloading
        if (state) {
          console.log('Restoring player state (no reload):', state);
          newAudioElement.currentTime = state.currentTime;
          newAudioElement.volume = state.volume;
          if (state.isPlaying) {
            console.log('Resuming playback for:', fileName);
            try {
              await newAudioElement.play();
              console.log('Playback resumed successfully');
            } catch (error) {
              console.error('Failed to resume playback:', error);
            }
          }
        }
      }
    } else {
      console.log('No player found in registry for:', fileName);
    }
  }

  setManifestUrl(fileName: string, manifestUrl: string) {
    this.manifestUrls.set(fileName, manifestUrl);
    console.log('Stored manifest URL for:', fileName, manifestUrl);
  }

  getManifestUrl(fileName: string): string | null {
    return this.manifestUrls.get(fileName) || null;
  }
}

export const playerRegistry = new PlayerRegistry(); 