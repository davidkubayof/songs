import { create } from 'zustand';

import { findNextTrack, findPreviousTrack } from '@/lib/playerQueue';
import type { Track } from '@/types/Music';
import type { RoomPlayback } from '@/types/Room';
import { usePlaylistStore } from '@/store/usePlaylistStore';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  position: number;
  seekTarget: number | null;
  isRemoteUpdate: boolean;
  playTrack: (track: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  seekTo: (position: number) => void;
  clearSeekTarget: () => void;
  playNext: () => void;
  playPrevious: () => void;
  skipOnError: () => void;
  applyRoomPlayback: (playback: RoomPlayback) => void;
  clearRemoteFlag: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  position: 0,
  seekTarget: null,
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
  seekTo: (position) => set({ position, seekTarget: position }),
  clearSeekTarget: () => set({ seekTarget: null }),
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
