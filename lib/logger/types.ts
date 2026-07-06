export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogDomain =
  | 'playback.proxy'
  | 'playback.resolve'
  | 'playback.player'
  | 'playback.search'
  | 'playback.diag';

export interface PlaybackLogEntry {
  ts: string;
  level: LogLevel;
  domain: LogDomain;
  event: string;
  traceId?: string;
  videoId?: string;
  trackId?: string;
  durationMs?: number;
  meta?: Record<string, string | number | boolean | null>;
  err?: string;
}

export interface RedactedStreamMeta {
  host: string;
  itag: string | null;
  client: string | null;
  hasCpn: boolean;
  hasRange: boolean;
  expire: string | null;
}
