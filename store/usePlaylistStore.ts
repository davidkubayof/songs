import { create } from 'zustand';

import {
  fetchPlaylistTracks,
  persistPlaylistTrack,
} from '@/services/PlaylistService';
import type { Track } from '@/types/Music';

interface PlaylistState {
  tracks: Track[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addTrack: (track: Track) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  tracks: [],
  isHydrated: false,
  hydrate: async () => {
    try {
      const tracks = await fetchPlaylistTracks();
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
      await persistPlaylistTrack(track);
    } catch {
      set({ tracks: previous });
    }
  },
}));
