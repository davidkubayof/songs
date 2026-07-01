import type { SupabaseClient } from '@supabase/supabase-js';

import type { Track } from '@/types/Music';

function rowToTrack(data: Record<string, unknown>): Track {
  return data as unknown as Track;
}

export async function fetchSupabasePlaylist(
  supabase: SupabaseClient,
): Promise<Track[]> {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select('track_data')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToTrack(row.track_data as Record<string, unknown>));
}

export async function addSupabasePlaylistTrack(
  supabase: SupabaseClient,
  userId: string,
  track: Track,
): Promise<void> {
  const { error } = await supabase.from('playlist_tracks').insert({
    user_id: userId,
    track_id: track.id,
    track_data: track,
  });

  if (error) throw new Error(error.message);
}

export async function removeSupabasePlaylistTrack(
  supabase: SupabaseClient,
  trackId: string,
): Promise<void> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('track_id', trackId);

  if (error) throw new Error(error.message);
}
