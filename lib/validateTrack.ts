import type { Track } from '@/types/Music';
import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';

const YT_WATCH = /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{6,}/;

export function hasValidStream(track: Track): boolean {
  if (!track.sourceId || track.sourceId.length < 6) return false;
  if (!YT_WATCH.test(track.streamUrl)) return false;
  if (!track.title?.trim()) return false;
  const thumb = track.thumbnailUrl;
  if (!thumb || thumb === PLACEHOLDER_THUMBNAIL) return false;
  return thumb.startsWith('http');
}

export function filterValidTracks(tracks: Track[]): Track[] {
  return tracks.filter(hasValidStream);
}
