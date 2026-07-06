import 'server-only';

import type { Innertube } from 'youtubei.js';

import { isValidVideoId } from '@/lib/youtubeVideoId';
import { redactStreamUrl } from '@/lib/logger/redact';
import { logPlayback, withTiming } from '@/lib/logger/server';
import {
  getInnertube,
  resetInnertubeSession,
} from '@/services/YoutubeInnertubeClient';
import { getPoTokenSession } from '@/services/YoutubePoTokenService';
import { isNoStreamingDataError } from '@/services/retry';

export { isValidVideoId };

const CACHE_TTL_MS = 30 * 60 * 1000;

const RESOLVE_CLIENTS = [
  'IOS',
  'ANDROID',
  'TV_EMBEDDED',
  'WEB_CREATOR',
  'MWEB',
] as const;

type ResolveClient = (typeof RESOLVE_CLIENTS)[number];

type CachedStream = {
  url: string;
  mimeType: string;
  innertubeClient: ResolveClient;
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

function setCache(
  videoId: string,
  url: string,
  mimeType: string,
  innertubeClient: ResolveClient,
): void {
  streamCache.set(videoId, {
    url,
    mimeType,
    innertubeClient,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateStreamCache(
  videoId: string,
  reason?: string,
  traceId?: string,
): void {
  streamCache.delete(videoId);
  if (reason === 'resolve_error') {
    resetInnertubeSession();
  }
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

function playabilityMeta(info: {
  playability_status?: { status?: string; reason?: string } | null;
}) {
  return {
    playabilityStatus: info.playability_status?.status ?? null,
    reason: info.playability_status?.reason ?? null,
  };
}

async function resolveWithClient(
  yt: Innertube,
  videoId: string,
  client: ResolveClient,
  poToken: string,
  traceId?: string,
): Promise<{
  url: string;
  mimeType: string;
  itag: number;
  innertubeClient: ResolveClient;
}> {
  const info = await yt.getBasicInfo(videoId, { client, po_token: poToken });

  if (!info.streaming_data) {
    logPlayback({
      level: 'warn',
      domain: 'playback.resolve',
      event: 'resolve_client_fail',
      traceId,
      videoId,
      meta: { innertubeClient: client, ...playabilityMeta(info) },
      err: 'Streaming data not available',
    });
    throw new Error('Streaming data not available');
  }

  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  if (!format) throw new Error('No audio format');

  const deciphered = await format.decipher(yt.session.player);
  if (!deciphered?.startsWith('https://')) throw new Error('Invalid stream url');

  const url = withCpn(deciphered, info.cpn);
  const mimeType = format.mime_type ?? 'audio/mp4';
  return { url, mimeType, itag: format.itag, innertubeClient: client };
}

async function resolveWithClientFallback(
  videoId: string,
  traceId?: string,
): Promise<{
  url: string;
  mimeType: string;
  itag: number;
  innertubeClient: ResolveClient;
}> {
  let lastError: unknown;

  for (let pass = 0; pass < 2; pass++) {
    if (pass > 0) {
      resetInnertubeSession();
    }
    const session = await getPoTokenSession(pass > 0);
    const yt = await getInnertube();

    for (const client of RESOLVE_CLIENTS) {
      try {
        return await resolveWithClient(yt, videoId, client, session.poToken, traceId);
      } catch (error) {
        lastError = error;
        if (!isNoStreamingDataError(error)) throw error;
      }
    }
  }

  throw lastError ?? new Error('Streaming data not available');
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
      meta: { cacheHit: true, innertubeClient: cached.innertubeClient },
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
    const { result, durationMs } = await withTiming(() =>
      resolveWithClientFallback(videoId, traceId),
    );

    setCache(videoId, result.url, result.mimeType, result.innertubeClient);

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
        innertubeClient: result.innertubeClient,
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
