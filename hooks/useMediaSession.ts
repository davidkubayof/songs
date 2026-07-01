'use client';

import { useEffect, type RefObject } from 'react';

import {
  clearMediaSession,
  setPlaybackState,
  setPositionState,
  setTrackMetadata,
} from '@/lib/media-session';
import { usePlayerStore } from '@/store/usePlayerStore';

const SEEK_SKIP_SECONDS = 10;

export function useMediaSession(
  audioRef: RefObject<HTMLAudioElement | null>,
  userPausedRef: RefObject<boolean>,
): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
  const playerDuration = usePlayerStore((s) => s.playerDuration);
  const pause = usePlayerStore((s) => s.pause);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const seekTo = usePlayerStore((s) => s.seekTo);

  useEffect(() => {
    if (!currentTrack) {
      clearMediaSession();
      return;
    }
    setTrackMetadata(currentTrack);
    setPlaybackState(isPlaying);
    const duration = playerDuration > 0 ? playerDuration : currentTrack.duration;
    setPositionState(duration, position);
  }, [currentTrack, isPlaying, position, playerDuration]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.setActionHandler('play', () => {
      userPausedRef.current = false;
      usePlayerStore.setState({ isPlaying: true });
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      userPausedRef.current = true;
      audioRef.current?.pause();
      pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seekTo(details.seekTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skip = details.seekOffset ?? SEEK_SKIP_SECONDS;
      const pos = usePlayerStore.getState().position;
      seekTo(Math.max(0, pos - skip));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skip = details.seekOffset ?? SEEK_SKIP_SECONDS;
      const state = usePlayerStore.getState();
      const duration =
        state.playerDuration > 0 ? state.playerDuration : (currentTrack.duration ?? 0);
      seekTo(Math.min(duration, state.position + skip));
    });

    return () => {
      [
        'play',
        'pause',
        'previoustrack',
        'nexttrack',
        'seekto',
        'seekbackward',
        'seekforward',
      ].forEach((action) => {
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
      });
    };
  }, [audioRef, userPausedRef, currentTrack, pause, playNext, playPrevious, seekTo]);
}
