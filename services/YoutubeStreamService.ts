import 'server-only';

import type { Innertube } from 'youtubei.js';

import { isValidVideoId } from '@/lib/youtubeVideoId';
import { redactStreamUrl } from '@/lib/logger/redact';
import { logPlayback, withTiming } from '@/lib/logger/server';
import {
  getInnertube,
  resetInnertubeSession,
} from '@/services/YoutubeInnertubeClient';
import {
  getPoTokenSource,
  getVideoPoToken,
} from '@/services/YoutubePoTokenService';
import { isNoStreamingDataError } from '@/services/retry';

function isClientFallbackError(error: unknown): boolean {
  if (isNoStreamingDataError(error)) return true;
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('no valid url to decipher') || msg.includes('no audio format');
}

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

type ResolveOptions = {
  forceRefresh?: boolean;
  traceId?: string;
};

function getCached(videoId: string, forceRefresh?: boolean): CachedStream | null {
  if (forceRefresh) return null;
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
  if (reason === 'resolve_error' || reason === 'upstream_403') {
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
  traceId?: string,
  poOptions?: { forceRefresh?: boolean },
): Promise<{
  url: string;
  mimeType: string;
  itag: number;
  innertubeClient: ResolveClient;
}> {
  const videoPo = await getVideoPoToken(videoId, poOptions ?? {});
  const info = await yt.getBasicInfo(videoId, { client, po_token: videoPo });

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
  forceRefresh = false,
): Promise<{
  url: string;
  mimeType: string;
  itag: number;
  innertubeClient: ResolveClient;
}> {
  let lastError: unknown;

  for (let pass = 0; pass < 2; pass++) {
    const isRetryPass = pass > 0 || forceRefresh;

    if (isRetryPass) {
      resetInnertubeSession();
    }

    try {
      const yt = await getInnertube(isRetryPass, false);

      for (const client of RESOLVE_CLIENTS) {
        try {
          return await resolveWithClient(yt, videoId, client, traceId, {
            forceRefresh: isRetryPass,
          });
        } catch (error) {
          lastError = error;
          if (!isClientFallbackError(error)) throw error;
        }
      }
    } catch (error) {
      lastError = error;
      if (pass === 0) continue;
      throw error;
    }
  }

  throw lastError ?? new Error('Streaming data not available');
}

export async function resolveAudioStreamUrl(
  videoId: string,
  traceId?: string,
  options: ResolveOptions = {},
): Promise<{
  url: string;
  mimeType: string;
  cacheHit: boolean;
}> {
  const { forceRefresh = false } = options;
  const cached = getCached(videoId, forceRefresh);
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
    meta: { cacheHit: false, forceRefresh },
  });

  try {
    const { result, durationMs } = await withTiming(() =>
      resolveWithClientFallback(videoId, traceId, forceRefresh),
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
        hasPot: streamMeta.hasPot,
        poTokenSource: getPoTokenSource(),
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
