import { create } from 'zustand';

import type { Track } from '@/types/Music';
import type { RoomPlayback } from '@/types/Room';
import { usePlaylistStore } from '@/store/usePlaylistStore';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  position: number;
  isRemoteUpdate: boolean;
  playTrack: (track: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  skipOnError: () => void;
  applyRoomPlayback: (playback: RoomPlayback) => void;
  clearRemoteFlag: () => void;
}

function findNextTrack(current: Track, playlist: Track[]): Track | null {
  if (playlist.length === 0) return null;
  const index = playlist.findIndex((t) => t.id === current.id);
  if (index < 0) return playlist[0] ?? null;
  return playlist[index + 1] ?? playlist[0] ?? null;
}

function findPreviousTrack(current: Track, playlist: Track[]): Track | null {
  if (playlist.length === 0) return null;
  const index = playlist.findIndex((t) => t.id === current.id);
  if (index <= 0) return playlist[playlist.length - 1] ?? null;
  return playlist[index - 1] ?? null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  position: 0,
  isRemoteUpdate: false,
  playTrack: (track) => set({ currentTrack: track, isPlaying: true, position: 0 }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => {
    const { currentTrack, isPlaying } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },
  setVolume: (volume) =>
    set({ volume: Math.min(1, Math.max(0, volume)) }),
  setPosition: (position) => set({ position }),
  playNext: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    const next = findNextTrack(currentTrack, usePlaylistStore.getState().tracks);
    if (next) set({ currentTrack: next, isPlaying: true, position: 0 });
  },
  playPrevious: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    const prev = findPreviousTrack(currentTrack, usePlaylistStore.getState().tracks);
    if (prev) set({ currentTrack: prev, isPlaying: true, position: 0 });
  },
  skipOnError: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    const next = findNextTrack(currentTrack, usePlaylistStore.getState().tracks);
    if (next && next.id !== currentTrack.id) {
      set({ currentTrack: next, isPlaying: true, position: 0 });
      return;
    }
    set({ currentTrack: null, isPlaying: false, position: 0 });
  },
  applyRoomPlayback: (playback) => {
    set({
      isRemoteUpdate: true,
      currentTrack: playback.currentTrack,
      position: playback.position,
      isPlaying: playback.isPlaying,
    });
  },
  clearRemoteFlag: () => set({ isRemoteUpdate: false }),
}));
