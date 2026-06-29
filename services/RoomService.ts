import type { RoomPlayback } from '@/types/Room';

export interface RoomService {
  createRoom(name: string): Promise<string>;
  joinRoom(roomId: string): Promise<void>;
  leaveRoom(roomId: string): Promise<void>;
  updatePlayback(roomId: string, playback: RoomPlayback): Promise<void>;
}
