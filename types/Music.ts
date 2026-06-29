export type TrackSource = 'youtube' | 'mock';

export interface Track {
  id: string;
  source: TrackSource;
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnailUrl: string;
  streamUrl: string;
  isLive: boolean;
}

export interface SearchOptions {
  limit?: number;
  safeSearch?: boolean;
}

export type MusicServiceErrorCode = 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN';

export class MusicServiceError extends Error {
  readonly code: MusicServiceErrorCode;

  constructor(code: MusicServiceErrorCode, message: string) {
    super(message);
    this.name = 'MusicServiceError';
    this.code = code;
  }
}
