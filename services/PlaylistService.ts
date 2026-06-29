import type { Track } from '@/types/Music';

export interface PlaylistService {
  fetchTracks(): Promise<Track[]>;
  addTrack(track: Track): Promise<void>;
}

export async function fetchPlaylistTracks(): Promise<Track[]> {
  const res = await fetch('/api/playlist/tracks');
  if (!res.ok) throw new Error('Failed to load playlist');
  return res.json() as Promise<Track[]>;
}

export async function persistPlaylistTrack(track: Track): Promise<void> {
  const res = await fetch('/api/playlist/tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
  if (!res.ok) throw new Error('Failed to save track');
}
