import { MOCK_LATENCY_MS } from '@/constants/music';
import type { MusicService } from '@/services/MusicService';
import type { Track } from '@/types/Music';

const MOCK_TRACKS: Track[] = [
  {
    id: 'mock:1',
    source: 'mock',
    sourceId: '1',
    title: 'Midnight Drive',
    artist: 'Neon Waves',
    album: 'City Lights',
    duration: 214,
    thumbnailUrl: '/placeholder-track.png',
    streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isLive: false,
  },
  {
    id: 'mock:2',
    source: 'mock',
    sourceId: '2',
    title: 'Ocean Breeze',
    artist: 'Coastal Echo',
    duration: 187,
    thumbnailUrl: '/placeholder-track.png',
    streamUrl: 'https://www.youtube.com/watch?v=ktvTqknDobU',
    isLive: false,
  },
  {
    id: 'mock:3',
    source: 'mock',
    sourceId: '3',
    title: 'Golden Hour',
    artist: 'Sunset Collective',
    album: 'Horizons',
    duration: 245,
    thumbnailUrl: '/placeholder-track.png',
    streamUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    isLive: false,
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockMusicService implements MusicService {
  async search(query: string): Promise<Track[]> {
    await delay(MOCK_LATENCY_MS);
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_TRACKS;
    return MOCK_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q),
    );
  }

  async getTrack(sourceId: string): Promise<Track | null> {
    await delay(MOCK_LATENCY_MS);
    return MOCK_TRACKS.find((t) => t.sourceId === sourceId) ?? null;
  }
}

export const mockMusicService = new MockMusicService();
