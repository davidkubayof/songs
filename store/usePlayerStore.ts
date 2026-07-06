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
  isSeeking: boolean;
  playerReady: boolean;
  playerDuration: number;
  isRemoteUpdate: boolean;
  playEpoch: number;
  playbackError: string | null;
  playTrack: (track: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  seekTo: (position: number) => void;
  beginSeek: () => void;
  endSeek: () => void;
  clearSeekTarget: () => void;
  setPlayerReady: (ready: boolean) => void;
  setPlayerDuration: (duration: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  skipOnError: () => void;
  setPlaybackError: (message: string | null) => void;
  clearPlaybackError: () => void;
  applyRoomPlayback: (playback: RoomPlayback) => void;
  clearRemoteFlag: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  position: 0,
  seekTarget: null,
  isSeeking: false,
  playerReady: false,
  playerDuration: 0,
  isRemoteUpdate: false,
  playEpoch: 0,
  playbackError: null,
  playTrack: (track) =>
    set((state) => ({
      currentTrack: track,
      isPlaying: true,
      position: 0,
      seekTarget: null,
      playerReady: false,
      playerDuration: 0,
      playbackError: null,
      playEpoch: state.playEpoch + 1,
    })),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => {
    const { currentTrack, isPlaying } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },
  setVolume: (volume) =>
    set({ volume: Math.min(1, Math.max(0, volume)) }),
  setPosition: (position) => {
    const { isSeeking, seekTarget } = get();
    if (isSeeking || seekTarget != null) return;
    set({ position });
  },
  seekTo: (position) => set({ position, seekTarget: position }),
  beginSeek: () => set({ isSeeking: true }),
  endSeek: () => set({ isSeeking: false }),
  clearSeekTarget: () => set({ seekTarget: null }),
  setPlayerReady: (ready) => set({ playerReady: ready }),
  setPlayerDuration: (duration) => set({ playerDuration: duration }),
  playNext: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    const next = findNextTrack(currentTrack, usePlaylistStore.getState().tracks);
    if (next) {
      set({
        currentTrack: next,
        isPlaying: true,
        position: 0,
        seekTarget: null,
        playerReady: false,
        playerDuration: 0,
      });
    }
  },
  playPrevious: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    const prev = findPreviousTrack(currentTrack, usePlaylistStore.getState().tracks);
    if (prev) {
      set({
        currentTrack: prev,
        isPlaying: true,
        position: 0,
        seekTarget: null,
        playerReady: false,
        playerDuration: 0,
      });
    }
  },
  skipOnError: () => {
    const { currentTrack, playEpoch } = get();
    if (!currentTrack) return;
    const next = findNextTrack(currentTrack, usePlaylistStore.getState().tracks);
    if (next && next.id !== currentTrack.id) {
      set({
        currentTrack: next,
        isPlaying: true,
        position: 0,
        seekTarget: null,
        playerReady: false,
        playerDuration: 0,
        playbackError: null,
        playEpoch: playEpoch + 1,
      });
      return;
    }
    set({ currentTrack: null, isPlaying: false, position: 0, seekTarget: null, playbackError: null });
  },
  setPlaybackError: (message) => set({ playbackError: message }),
  clearPlaybackError: () => set({ playbackError: null }),
  applyRoomPlayback: (playback) => {
    set({
      isRemoteUpdate: true,
      currentTrack: playback.currentTrack,
      position: playback.position,
      isPlaying: playback.isPlaying,
      seekTarget: playback.position,
    });
  },
  clearRemoteFlag: () => set({ isRemoteUpdate: false }),
}));
