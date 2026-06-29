import { create } from 'zustand';

import { createClient } from '@/lib/supabase';
import {
  fetchPlaylistTracks,
  persistPlaylistTrack,
} from '@/services/PlaylistService';
import {
  addSupabasePlaylistTrack,
  fetchSupabasePlaylist,
} from '@/services/SupabasePlaylistService';
import type { Track } from '@/types/Music';

interface PlaylistState {
  tracks: Track[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addTrack: (track: Track) => Promise<void>;
}

async function loadGuestTracks(): Promise<Track[]> {
  return fetchPlaylistTracks();
}

async function loadUserTracks(): Promise<Track[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return loadGuestTracks();
  return fetchSupabasePlaylist(supabase);
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  tracks: [],
  isHydrated: false,
  hydrate: async () => {
    try {
      const tracks = await loadUserTracks();
      set({ tracks, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
  addTrack: async (track) => {
    const previous = get().tracks;
    if (previous.some((t) => t.id === track.id)) return;
    const optimistic = [...previous, track];
    set({ tracks: optimistic });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await addSupabasePlaylistTrack(supabase, user.id, track);
      } else {
        await persistPlaylistTrack(track);
      }
    } catch {
      set({ tracks: previous });
    }
  },
}));
