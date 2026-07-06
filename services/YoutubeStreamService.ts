import 'server-only';

import { isValidVideoId } from '@/lib/youtubeVideoId';
import { redactStreamUrl } from '@/lib/logger/redact';
import { logPlayback, withTiming } from '@/lib/logger/server';
import { getInnertube } from '@/services/YoutubeInnertubeClient';
import { withRetry } from '@/services/retry';

export { isValidVideoId };

const CACHE_TTL_MS = 30 * 60 * 1000;

type CachedStream = {
  url: string;
  mimeType: string;
  expiresAt: number;
};

const streamCache = new Map<string, CachedStream>();

function getCached(videoId: string): CachedStream | null {
  const entry = streamCache.get(videoId);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    streamCache.delete(videoId);
    return null;
  }
  return entry;
}

function setCache(videoId: string, url: string, mimeType: string): void {
  streamCache.set(videoId, {
    url,
    mimeType,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateStreamCache(
  videoId: string,
  reason?: string,
  traceId?: string,
): void {
  streamCache.delete(videoId);
  logPlayback({
    level: 'info',
    domain: 'playback.resolve',
    event: 'cache_invalidated',
    traceId,
    videoId,
    meta: { reason: reason ?? 'unknown' },
  });
}

function withCpn(baseUrl: string, cpn: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('cpn', cpn);
  return url.toString();
}

export async function resolveAudioStreamUrl(
  videoId: string,
  traceId?: string,
): Promise<{
  url: string;
  mimeType: string;
  cacheHit: boolean;
}> {
  const cached = getCached(videoId);
  if (cached) {
    logPlayback({
      level: 'info',
      domain: 'playback.resolve',
      event: 'resolve_cache_hit',
      traceId,
      videoId,
      meta: { cacheHit: true },
    });
    return { url: cached.url, mimeType: cached.mimeType, cacheHit: true };
  }

  logPlayback({
    level: 'info',
    domain: 'playback.resolve',
    event: 'resolve_start',
    traceId,
    videoId,
    meta: { cacheHit: false },
  });

  try {
    const { result, durationMs } = await withTiming(async () => {
      const yt = await getInnertube();
      const info = await withRetry(() => yt.getBasicInfo(videoId, { client: 'IOS' }));
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      if (!format) throw new Error('No audio format');

      const deciphered = await format.decipher(yt.session.player);
      if (!deciphered?.startsWith('https://')) throw new Error('Invalid stream url');

      const url = withCpn(deciphered, info.cpn);
      const mimeType = format.mime_type ?? 'audio/mp4';
      setCache(videoId, url, mimeType);
      return { url, mimeType, itag: format.itag };
    });

    const streamMeta = redactStreamUrl(result.url);
    logPlayback({
      level: 'info',
      domain: 'playback.resolve',
      event: 'resolve_ok',
      traceId,
      videoId,
      durationMs,
      meta: {
        cacheHit: false,
        itag: streamMeta.itag ?? result.itag,
        client: streamMeta.client,
        hasCpn: streamMeta.hasCpn,
        host: streamMeta.host,
        mime: result.mimeType,
      },
    });

    return { url: result.url, mimeType: result.mimeType, cacheHit: false };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logPlayback({
      level: 'error',
      domain: 'playback.resolve',
      event: 'resolve_fail',
      traceId,
      videoId,
      err,
    });
    throw error;
  }
}
