// Type definitions for Vimeo Player
declare module '@vimeo/player' {
  interface PlayerOptions {
    id?: number | string;
    url?: string;
    width?: number | string;
    height?: number | string;
    autopause?: boolean;
    autoplay?: boolean;
    background?: boolean;
    byline?: boolean;
    color?: string;
    controls?: boolean;
    dnt?: boolean;
    keyboard?: boolean;
    loop?: boolean;
    muted?: boolean;
    pip?: boolean;
    playsinline?: boolean;
    portrait?: boolean;
    responsive?: boolean;
    speed?: boolean;
    title?: boolean;
    transparent?: boolean;
  }

  interface TimeUpdateEvent {
    duration: number;
    percent: number;
    seconds: number;
  }

  interface EventCallback {
    (data: any): void;
  }

  export default class Player {
    constructor(element: HTMLElement | HTMLIFrameElement | string, options?: PlayerOptions);

    destroy(): void;
    getVideoTitle(): Promise<string>;
    getVideoId(): Promise<number>;
    getVideoWidth(): Promise<number>;
    getVideoHeight(): Promise<number>;
    getVideoUrl(): Promise<string>;
    getVideoEmbedCode(): Promise<string>;
    getVideoDuration(): Promise<number>;
    getVideoCurrentTime(): Promise<number>;
    setCurrentTime(seconds: number): Promise<number>;
    play(): Promise<void>;
    pause(): Promise<void>;
    unload(): Promise<void>;
    setVolume(volume: number): Promise<number>;
    getVolume(): Promise<number>;
    setPlaybackRate(playbackRate: number): Promise<number>;
    getPlaybackRate(): Promise<number>;
    setQuality(quality: string): Promise<string>;
    getQuality(): Promise<string>;
    loadVideo(id: number): Promise<number>;
    ready(): Promise<void>;

    on<T>(event: string, callback: (data: T) => void): void;
    off(event: string, callback?: Function): void;
  }
}

// Type definitions for Vimeo API
declare module 'vimeo' {
  export interface VimeoConfig {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
  }

  export interface RequestOptions {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    query?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
  }

  export class Vimeo {
    constructor(clientId: string, clientSecret: string, accessToken?: string);
    constructor(config: VimeoConfig);

    request<T>(options: RequestOptions): Promise<T>;
    upload(
      filePath: string,
      options?: {
        name?: string;
        description?: string;
        privacy?: {
          view: 'anybody' | 'nobody' | 'password' | 'disable' | 'unlisted';
          embed?: 'public' | 'private' | 'whitelist';
          comments?: 'anybody' | 'nobody';
          download?: boolean;
        };
      }
    ): Promise<any>;
  }
} 