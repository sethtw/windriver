export interface AudioFile {
  name: string;
  manifest_url: string;
}

export interface PlayerEvent {
  type: string;
  timestamp: number;
  details: any;
}

export interface PlayerStats {
  bufferFullness: number | null;
  playbackRate: number | null;
  playheadTime: Date | null;
  fetchedPlaybackInfo: any | null;
  presentationStartTime: Date | null;
  segmentAvailabilityDuration: number | null;
  playerStats: any | null;
  isFullyLoaded: boolean | null;
  activeSessionsMetadata: any | null;
} 