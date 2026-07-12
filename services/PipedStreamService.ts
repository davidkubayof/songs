import 'server-only';

import { isValidVideoId } from '@/lib/youtubeVideoId';
import { redactStreamUrl } from '@/lib/logger/redact';
import { logPlayback, withTiming } from '@/lib/logger/server';

export { isValidVideoId };

const CACHE_TTL_MS = 30 * 60 * 1000;

const DEFAULT_PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi-libre.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.adminforge.de',
];

type PipedAudioStream = {
  url: string;
  format?: string;
  quality?: string;
  mimeType?: string;
  bitrate?: number;
  videoOnly?: boolean;
  audioOnly?: boolean;
};

type PipedStreamsResponse = {
  audioStreams?: PipedAudioStream[];
  videoStreams?: PipedAudioStream[];
  error?: string;
};

type CachedStream = {
  url: string;
  mimeType: string;
  instance: string;
  expiresAt: number;
};

const streamCache = new Map<string, CachedStream>();

function getPipedInstances(): string[] {
  const fromEnv = process.env.PIPED_API_BASE?.trim();
  if (fromEnv) {
    return [fromEnv.replace(/\/$/, ''), ...DEFAULT_PIPED_INSTANCES];
  }
  return DEFAULT_PIPED_INSTANCES;
}

function pickBestAudioStream(streams: PipedAudioStream[]): PipedAudioStream | null {
  if (!streams.length) return null;
  return [...streams].sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
}

function isPlayableInAudioElement(stream: PipedAudioStream): boolean {
  if (!stream.url) return false;
  const mime = stream.mimeType?.toLowerCase() ?? '';
  const format = stream.format?.toUpperCase() ?? '';
  if (mime.includes('mpegurl') || format === 'HLS' || format === 'DASH') return false;
  return true;
}

function pickFallbackVideoStream(streams: PipedAudioStream[]): PipedAudioStream | null {
  const candidates = streams.filter((s) => !s.videoOnly && isPlayableInAudioElement(s));
  if (!candidates.length) return null;

  const audioOnly = candidates.filter((s) => s.audioOnly);
  if (audioOnly.length) {
    return pickBestAudioStream(audioOnly);
  }

  return [...candidates].sort((a, b) => {
    const ba = a.bitrate && a.bitrate > 0 ? a.bitrate : Number.MAX_SAFE_INTEGER;
    const bb = b.bitrate && b.bitrate > 0 ? b.bitrate : Number.MAX_SAFE_INTEGER;
    return ba - bb;
  })[0];
}

function pickStream(data: PipedStreamsResponse): PipedAudioStream | null {
  const fromAudio = pickBestAudioStream(data.audioStreams ?? []);
  if (fromAudio) return fromAudio;
  return pickFallbackVideoStream(data.videoStreams ?? []);
}

function mimeFromStream(stream: PipedAudioStream): string {
  if (stream.mimeType) return stream.mimeType;
  const format = stream.format?.toUpperCase() ?? '';
  if (format.includes('OPUS') || format.includes('WEBM')) return 'audio/webm';
  if (format.includes('M4A') || format.includes('MP4')) return 'audio/mp4';
  return 'audio/mp4';
}

async function fetchFromInstance(
  instance: string,
  videoId: string,
  traceId?: string,
): Promise<{ url: string; mimeType: string; instance: string }> {
  const base = instance.replace(/\/$/, '');
  const apiUrl = `${base}/streams/${encodeURIComponent(videoId)}`;

  const response = await fetch(apiUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Piped ${base} returned ${response.status}`);
  }

  const data = (await response.json()) as PipedStreamsResponse;
  if (data.error) {
    throw new Error(`Piped ${base}: ${data.error.slice(0, 120)}`);
  }

  const best = pickStream(data);
  if (!best?.url) {
    throw new Error(`Piped ${base} returned no playable streams`);
  }

  logPlayback({
    level: 'info',
    domain: 'playback.resolve',
    event: 'piped_resolve_ok',
    traceId,
    videoId,
    meta: {
      instance: base,
      format: best.format ?? null,
      quality: best.quality ?? null,
      ...redactStreamUrl(best.url),
    },
  });

  return {
    url: best.url,
    mimeType: mimeFromStream(best),
    instance: base,
  };
}

export function invalidateStreamCache(videoId: string, reason: string, traceId?: string): void {
  if (!streamCache.delete(videoId)) return;
  logPlayback({
    level: 'info',
    domain: 'playback.resolve',
    event: 'cache_invalidate',
    traceId,
    videoId,
    meta: { reason, source: 'piped' },
  });
}

type ResolveOptions = {
  forceRefresh?: boolean;
  traceId?: string;
};

export async function resolveAudioStreamUrl(
  videoId: string,
  traceId?: string,
  options: ResolveOptions = {},
): Promise<{ url: string; mimeType: string; cacheHit: boolean; instance: string }> {
  const { forceRefresh = false } = options;

  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid video id');
  }

  const cached = streamCache.get(videoId);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return {
      url: cached.url,
      mimeType: cached.mimeType,
      cacheHit: true,
      instance: cached.instance,
    };
  }

  const instances = getPipedInstances();
  const errors: string[] = [];

  for (const instance of instances) {
    try {
      const { result, durationMs } = await withTiming(() =>
        fetchFromInstance(instance, videoId, traceId),
      );

      streamCache.set(videoId, {
        url: result.url,
        mimeType: result.mimeType,
        instance: result.instance,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      logPlayback({
        level: 'info',
        domain: 'playback.resolve',
        event: 'resolve_ok',
        traceId,
        videoId,
        durationMs,
        meta: {
          cacheHit: false,
          source: 'piped',
          instance: result.instance,
          ...redactStreamUrl(result.url),
        },
      });

      return {
        url: result.url,
        mimeType: result.mimeType,
        cacheHit: false,
        instance: result.instance,
      };
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      errors.push(`${instance}: ${err}`);
      logPlayback({
        level: 'warn',
        domain: 'playback.resolve',
        event: 'piped_instance_failed',
        traceId,
        videoId,
        meta: { instance },
        err,
      });
    }
  }

  logPlayback({
    level: 'error',
    domain: 'playback.resolve',
    event: 'resolve_fail',
    traceId,
    videoId,
    err: errors.join(' | ') || 'all piped instances failed',
  });

  throw new Error('Stream unavailable');
}
