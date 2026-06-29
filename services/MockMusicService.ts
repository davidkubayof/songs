import { MOCK_LATENCY_MS } from '@/constants/music';
import { MOCK_RAW_TRACKS } from '@/constants/mockTracks';
import { mapToTrack } from '@/services/mappers';
import type { MusicService } from '@/services/MusicService';
import type { Track } from '@/types/Music';

const MOCK_TRACKS: Track[] = MOCK_RAW_TRACKS.map((raw) => ({
  ...mapToTrack(raw),
  id: `mock:${raw.id}`,
  source: 'mock',
  sourceId: raw.id,
}));

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchTracks(query: string): Track[] {
  const q = query.toLowerCase();
  return MOCK_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q),
  );
}

export class MockMusicService implements MusicService {
  async search(query: string): Promise<Track[]> {
    await delay(MOCK_LATENCY_MS);
    const trimmed = query.trim();
    if (!trimmed) return MOCK_TRACKS;
    const matched = matchTracks(trimmed);
    return matched.length > 0 ? matched : MOCK_TRACKS;
  }

  async getTrack(sourceId: string): Promise<Track | null> {
    await delay(MOCK_LATENCY_MS);
    return MOCK_TRACKS.find((t) => t.sourceId === sourceId) ?? null;
  }
}

export const mockMusicService = new MockMusicService();
