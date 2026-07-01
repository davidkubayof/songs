'use client';

import { useCallback } from 'react';

import { getPlayerController } from '@/lib/playerController';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/Music';

export function usePlayTrack() {
  const playTrack = usePlayerStore((s) => s.playTrack);

  return useCallback(
    (track: Track) => {
      playTrack(track);
      getPlayerController()?.playFromGesture(track.sourceId);
    },
    [playTrack],
  );
}
