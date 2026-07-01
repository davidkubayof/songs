'use client';

import { useEffect, type RefObject } from 'react';

import { usePlayerStore } from '@/store/usePlayerStore';

export function useBackgroundAudio(
  audioRef: RefObject<HTMLAudioElement | null>,
): void {
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const resumeIfNeeded = () => {
      const audio = audioRef.current;
      if (!audio || !isPlaying) return;
      if (document.hidden && audio.paused) {
        audio.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', resumeIfNeeded);
    window.addEventListener('pageshow', resumeIfNeeded);

    return () => {
      document.removeEventListener('visibilitychange', resumeIfNeeded);
      window.removeEventListener('pageshow', resumeIfNeeded);
    };
  }, [audioRef, isPlaying]);
}
