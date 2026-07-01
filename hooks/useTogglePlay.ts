'use client';

import { useCallback } from 'react';

import { getPlayerController } from '@/lib/playerController';
import { usePlayerStore } from '@/store/usePlayerStore';

export function useTogglePlay() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return useCallback(() => {
    if (isPlaying) {
      getPlayerController()?.pauseFromUser();
      return;
    }
    togglePlay();
    getPlayerController()?.playFromGesture(currentTrack?.sourceId);
  }, [isPlaying, togglePlay, currentTrack?.sourceId]);
}
