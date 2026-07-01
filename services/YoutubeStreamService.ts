import 'server-only';

import { isValidVideoId } from '@/lib/youtubeVideoId';
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

export async function resolveAudioStreamUrl(videoId: string): Promise<{
  url: string;
  mimeType: string;
}> {
  const cached = getCached(videoId);
  if (cached) {
    return { url: cached.url, mimeType: cached.mimeType };
  }

  const yt = await getInnertube();
  const info = await withRetry(() => yt.getBasicInfo(videoId, { client: 'IOS' }));
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  if (!format) throw new Error('No audio format');

  const url = await format.decipher(yt.session.player);
  if (!url?.startsWith('https://')) throw new Error('Invalid stream url');

  const mimeType = format.mime_type ?? 'audio/mp4';
  setCache(videoId, url, mimeType);
  return { url, mimeType };
}
