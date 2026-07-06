import 'server-only';

import type { Innertube } from 'youtubei.js';

import { isValidVideoId } from '@/lib/youtubeVideoId';
import { getInnertube } from '@/services/YoutubeInnertubeClient';
import { withRetry } from '@/services/retry';

export { isValidVideoId };

const CACHE_TTL_MS = 30 * 60 * 1000;
const STREAM_CLIENTS = ['IOS', 'ANDROID', 'WEB', 'MWEB'] as const;
const PREFERRED_ITAGS = [140, 139, 141] as const;

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

export function invalidateStreamCache(videoId: string): void {
  streamCache.delete(videoId);
}

function isIosCompatibleFormat(format: { mime_type?: string; itag: number }): boolean {
  const mime = (format.mime_type ?? '').toLowerCase();
  if (mime.includes('mp4') || mime.includes('m4a')) return true;
  return PREFERRED_ITAGS.includes(format.itag as (typeof PREFERRED_ITAGS)[number]);
}

function pickFormat(info: Awaited<ReturnType<Innertube['getBasicInfo']>>) {
  for (const itag of PREFERRED_ITAGS) {
    try {
      const format = info.chooseFormat({ itag });
      if (format && isIosCompatibleFormat(format)) return format;
    } catch {
      continue;
    }
  }

  const strategies = [
    { type: 'audio' as const, codec: 'mp4a', quality: 'best' },
    { type: 'audio' as const, quality: 'best', format: 'mp4' },
  ];

  for (const options of strategies) {
    try {
      const format = info.chooseFormat(options);
      if (format && isIosCompatibleFormat(format)) return format;
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveFromClient(
  yt: Innertube,
  videoId: string,
  client: (typeof STREAM_CLIENTS)[number],
): Promise<{ url: string; mimeType: string } | null> {
  const info = await withRetry(() => yt.getBasicInfo(videoId, { client }));
  const format = pickFormat(info);
  if (!format) return null;

  const url = await format.decipher(yt.session.player);
  if (!url?.startsWith('https://')) return null;

  return { url, mimeType: format.mime_type ?? 'audio/mp4' };
}

export async function resolveAudioStreamUrl(videoId: string): Promise<{
  url: string;
  mimeType: string;
}> {
  const cached = getCached(videoId);
  if (cached) {
    return { url: cached.url, mimeType: cached.mimeType };
  }

  const yt = await getInnertube();
  let lastError: unknown;

  for (const client of STREAM_CLIENTS) {
    try {
      const resolved = await resolveFromClient(yt, videoId, client);
      if (!resolved) continue;
      setCache(videoId, resolved.url, resolved.mimeType);
      return resolved;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No audio format');
}
