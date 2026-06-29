import type { SupabaseClient } from '@supabase/supabase-js';

import {
  insertMember,
  insertRoom,
  mapPlaybackPayload,
  mapRoomRow,
} from '@/services/roomMappers';
import type { RoomService } from '@/services/RoomService';
import type { RoomPlayback } from '@/types/Room';

export function createRoomService(supabase: SupabaseClient): RoomService {
  return {
    async createRoom(name) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const roomId = await insertRoom(supabase, name, user.id);
      await insertMember(supabase, roomId, user.id);
      return roomId;
    },

    async joinRoom(roomId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await insertMember(supabase, roomId, user.id);
    },

    async leaveRoom(roomId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    },

    async updatePlayback(roomId, playback: RoomPlayback) {
      const { error } = await supabase
        .from('listening_rooms')
        .update(mapPlaybackPayload(playback))
        .eq('id', roomId);

      if (error) throw new Error(error.message);
    },
  };
}

export async function fetchRoom(
  supabase: SupabaseClient,
  roomId: string,
) {
  const { data, error } = await supabase
    .from('listening_rooms')
    .select('id, host_id, name, current_track, position, is_playing')
    .eq('id', roomId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRoomRow(data);
}
