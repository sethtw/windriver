declare module 'shaka-player' {
  export class Player {
    constructor(video: HTMLMediaElement);
    load(uri: string): Promise<void>;
    play(): Promise<void>;
    destroy(): Promise<void>;
  }

  export namespace polyfill {
    function installAll(): void;
  }

  export namespace Player {
    function isBrowserSupported(): boolean;
  }
} 