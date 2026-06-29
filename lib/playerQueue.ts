import type { Track } from '@/types/Music';

export function findNextTrack(current: Track, playlist: Track[]): Track | null {
  if (playlist.length === 0) return null;
  const index = playlist.findIndex((t) => t.id === current.id);
  if (index < 0) return playlist[0] ?? null;
  return playlist[index + 1] ?? playlist[0] ?? null;
}

export function findPreviousTrack(current: Track, playlist: Track[]): Track | null {
  if (playlist.length === 0) return null;
  const index = playlist.findIndex((t) => t.id === current.id);
  if (index <= 0) return playlist[playlist.length - 1] ?? null;
  return playlist[index - 1] ?? null;
}
