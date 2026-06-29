import type { Track } from '@/types/Music';

export interface RoomPlayback {
  currentTrack: Track | null;
  position: number;
  isPlaying: boolean;
}

export interface ListeningRoom {
  id: string;
  hostId: string;
  name: string;
  playback: RoomPlayback;
}
