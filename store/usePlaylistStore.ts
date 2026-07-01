import { create } from 'zustand';

import { createClient } from '@/lib/supabase';
import {
  addSupabasePlaylistTrack,
  fetchSupabasePlaylist,
  removeSupabasePlaylistTrack,
} from '@/services/SupabasePlaylistService';
import {
  loadGuestPlaylist,
  removeGuestTrack,
  saveGuestPlaylist,
  saveGuestTrack,
} from '@/services/GuestPlaylistStorage';
import type { Track } from '@/types/Music';

interface PlaylistState {
  tracks: Track[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addTrack: (track: Track) => Promise<void>;
  removeTrack: (track: Track) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  tracks: [],
  isHydrated: false,
  hydrate: async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const guestTracks = await loadGuestPlaylist();
        if (guestTracks.length > 0) {
          const existing = await fetchSupabasePlaylist(supabase);
          const existingIds = new Set(existing.map((t) => t.id));
          for (const track of guestTracks) {
            if (!existingIds.has(track.id)) {
              await addSupabasePlaylistTrack(supabase, user.id, track);
            }
          }
          await saveGuestPlaylist([]);
        }
        const tracks = await fetchSupabasePlaylist(supabase);
        set({ tracks, isHydrated: true });
      } else {
        const tracks = await loadGuestPlaylist();
        set({ tracks, isHydrated: true });
      }
    } catch {
      const tracks = await loadGuestPlaylist().catch(() => []);
      set({ tracks, isHydrated: true });
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
        await saveGuestTrack(track);
      }
    } catch {
      set({ tracks: previous });
    }
  },
  removeTrack: async (track) => {
    const previous = get().tracks;
    const optimistic = previous.filter((t) => t.id !== track.id);
    set({ tracks: optimistic });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await removeSupabasePlaylistTrack(supabase, track.id);
      } else {
        await removeGuestTrack(track.id);
      }
    } catch {
      set({ tracks: previous });
    }
  },
}));
