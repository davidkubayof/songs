import type { SearchOptions, Track } from '@/types/Music';

export interface MusicService {
  search(query: string, options?: SearchOptions): Promise<Track[]>;
  getTrack(sourceId: string): Promise<Track | null>;
}
