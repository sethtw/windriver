declare module 'shaka-player' {
  export class Player {
    constructor(video?: HTMLMediaElement);
    attach(video: HTMLMediaElement): void;
    load(uri: string): Promise<void>;
    play(): Promise<void>;
    destroy(): Promise<void>;
    goToLive(): Promise<void>;
    getAssetUri(): Promise<string>;
    getActiveSessionsMetadata(): Promise<Object>;
    getAudioTracks(): Promise<Array>;
    getBufferedInfo(): Promise<Object>;
    getBufferFullness(): Promise<number>;
    getFetchedPlaybackInfo(): Promise<Object>;
    getPlaybackRate(): Promise<number>;
    getPlayheadTimeAsDate(): Promise<Date>;
    getPresentationStartTimeAsDate(): Promise<Date>;
    getSegmentAvailabilityDuration(): Promise<number>;
    getStats(): Promise<Object>;
    isBuffering(): Promise<boolean>;
    isEnded(): Promise<boolean>;
    isFullyLoaded(): Promise<boolean>;
    addEventListener(event: string, callback: (event: { detail: any }) => void): void;
    configure(config: { streaming: { retryParameters: any } }): void;
  }

  export namespace polyfill {
    function installAll(): void;
  }

  export namespace Player {
    function isBrowserSupported(): boolean;
  }
} 