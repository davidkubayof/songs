import { create } from 'zustand';

import { createClient } from '@/lib/supabase';
import {
  createRoomService,
  fetchRoom,
} from '@/services/SupabaseRoomService';
import type { ListeningRoom } from '@/types/Room';

interface RoomState {
  roomId: string | null;
  room: ListeningRoom | null;
  isHost: boolean;
  createRoom: (name: string) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  setRoom: (room: ListeningRoom | null, isHost: boolean) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  roomId: null,
  room: null,
  isHost: false,
  createRoom: async (name) => {
    const supabase = createClient();
    const service = createRoomService(supabase);
    const roomId = await service.createRoom(name);
    const room = await fetchRoom(supabase, roomId);
    set({ roomId, isHost: true, room });
    return roomId;
  },
  joinRoom: async (roomId) => {
    const supabase = createClient();
    const service = createRoomService(supabase);
    await service.joinRoom(roomId);
    const room = await fetchRoom(supabase, roomId);
    set({ roomId, isHost: false, room });
  },
  leaveRoom: async () => {
    const { roomId } = get();
    if (roomId) {
      const supabase = createClient();
      await createRoomService(supabase).leaveRoom(roomId);
    }
    set({ roomId: null, room: null, isHost: false });
  },
  setRoom: (room, isHost) => set({ room, roomId: room?.id ?? null, isHost }),
}));
