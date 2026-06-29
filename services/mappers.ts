import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import type { Track } from '@/types/Music';
import type { YoutubeVideoItem } from '@/types/YoutubeRaw';

export function buildTrackId(sourceId: string): string {
  return `youtube:${sourceId}`;
}

export function parseDuration(duration: string): number {
  if (!duration || duration === 'LIVE') return 0;
  const parts = duration.split(':').map(Number);
  if (parts.some((p) => Number.isNaN(p))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] ?? 0;
}

export function mapToTrack(raw: YoutubeVideoItem): Track {
  const artist = raw.author?.name ?? 'Unknown Artist';
  return {
    id: buildTrackId(raw.id),
    source: 'youtube',
    sourceId: raw.id,
    title: raw.name || 'Unknown Title',
    artist,
    duration: raw.isLive ? 0 : parseDuration(raw.duration),
    thumbnailUrl: raw.thumbnail || PLACEHOLDER_THUMBNAIL,
    streamUrl: raw.url || `https://www.youtube.com/watch?v=${raw.id}`,
    isLive: raw.isLive,
  };
}

export function mapSearchResults(items: YoutubeVideoItem[]): Track[] {
  return items.filter((item) => item.type === 'video').map(mapToTrack);
}
