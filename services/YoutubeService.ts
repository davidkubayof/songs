import 'server-only';

import ytsr from '@distube/ytsr';

import { SEARCH_DEFAULT_LIMIT } from '@/constants/music';
import { mapSearchResults, mapToTrack } from '@/services/mappers';
import type { MusicService } from '@/services/MusicService';
import { withRetry } from '@/services/retry';
import { searchYoutubeApi } from '@/services/youtubeApiSearch';
import type { SearchOptions, Track } from '@/types/Music';
import { MusicServiceError } from '@/types/Music';
import type { YoutubeVideoItem } from '@/types/YoutubeRaw';

function ytsrOptions() {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return {
    limit: SEARCH_DEFAULT_LIMIT,
    safeSearch: true,
    type: 'video' as const,
    requestOptions: key
      ? { headers: { 'X-Origin': 'https://www.youtube.com' } }
      : undefined,
  };
}

function toVideoItems(items: ytsr.Video[]): YoutubeVideoItem[] {
  return items as YoutubeVideoItem[];
}

function wrapError(error: unknown, code: 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN'): never {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new MusicServiceError(code, message);
}

export class YoutubeService implements MusicService {
  async search(query: string, options?: SearchOptions): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const apiItems = await searchYoutubeApi(trimmed);
      if (apiItems.length > 0) return mapSearchResults(apiItems);

      const result = await withRetry(() => ytsr(trimmed, {
        ...ytsrOptions(),
        limit: options?.limit ?? SEARCH_DEFAULT_LIMIT,
      }));
      return mapSearchResults(toVideoItems(result.items ?? []));
    } catch (error) {
      wrapError(error, 'NETWORK');
    }
  }

  async getTrack(sourceId: string): Promise<Track | null> {
    const id = sourceId.trim();
    if (!id) return null;

    try {
      const result = await withRetry(() =>
        ytsr(id, { limit: 1, type: 'video' }),
      );
      const item = toVideoItems(result.items ?? [])[0];
      if (item) return mapToTrack(item);
      return null;
    } catch {
      return null;
    }
  }
}

export const youtubeService = new YoutubeService();
