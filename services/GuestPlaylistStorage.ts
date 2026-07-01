import { songsDb } from '@/lib/dexie-db';
import type { Track } from '@/types/Music';

export async function loadGuestPlaylist(): Promise<Track[]> {
  const rows = await songsDb.tracks.orderBy('id').toArray();
  return rows.map((row) => row.track);
}

export async function saveGuestTrack(track: Track): Promise<void> {
  await songsDb.tracks.put({ id: track.id, track });
}

export async function removeGuestTrack(trackId: string): Promise<void> {
  await songsDb.tracks.delete(trackId);
}

export async function saveGuestPlaylist(tracks: Track[]): Promise<void> {
  await songsDb.transaction('rw', songsDb.tracks, async () => {
    await songsDb.tracks.clear();
    await songsDb.tracks.bulkPut(tracks.map((track) => ({ id: track.id, track })));
  });
}
