import type { SupabaseClient } from '@supabase/supabase-js';

import type { ListeningRoom, RoomPlayback } from '@/types/Room';
import type { Track } from '@/types/Music';

interface RoomRow {
  id: string;
  host_id: string;
  name: string;
  current_track: Track | null;
  position: number;
  is_playing: boolean;
}

export function mapRoomRow(row: RoomRow): ListeningRoom {
  return {
    id: row.id,
    hostId: row.host_id,
    name: row.name,
    playback: {
      currentTrack: row.current_track,
      position: row.position,
      isPlaying: row.is_playing,
    },
  };
}

export function mapPlaybackPayload(playback: RoomPlayback) {
  return {
    current_track: playback.currentTrack,
    position: playback.position,
    is_playing: playback.isPlaying,
  };
}

export async function insertRoom(
  supabase: SupabaseClient,
  name: string,
  hostId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('listening_rooms')
    .insert({ name, host_id: hostId })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create room');
  return data.id as string;
}

export async function insertMember(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('room_members')
    .insert({ room_id: roomId, user_id: userId });

  if (error) throw new Error(error.message);
}
