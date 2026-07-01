'use client';

import { useEffect } from 'react';

import {
  clearMediaSession,
  setPlaybackState,
  setPositionState,
  setTrackMetadata,
} from '@/lib/media-session';
import { usePlayerStore } from '@/store/usePlayerStore';

export function useMediaSession(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
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
    setPositionState(currentTrack.duration, position);
  }, [currentTrack, isPlaying, position]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.setActionHandler('play', () => {
      usePlayerStore.setState({ isPlaying: true });
    });
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seekTo(details.seekTime);
    });

    return () => {
      ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'].forEach((action) => {
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
      });
    };
  }, [currentTrack, pause, playNext, playPrevious, seekTo]);
}
