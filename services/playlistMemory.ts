import type { Track } from '@/types/Music';

const playlist: Track[] = [];

export function getServerPlaylist(): Track[] {
  return [...playlist];
}

export function addServerTrack(track: Track): Track[] {
  if (playlist.some((t) => t.id === track.id)) return [...playlist];
  playlist.push(track);
  return [...playlist];
}
