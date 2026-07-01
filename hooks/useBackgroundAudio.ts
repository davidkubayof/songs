'use client';

import { useEffect, type RefObject } from 'react';

import { usePlayerStore } from '@/store/usePlayerStore';

const STALL_RETRY_MS = 500;

export function useBackgroundAudio(
  audioRef: RefObject<HTMLAudioElement | null>,
  userPausedRef: RefObject<boolean>,
): void {
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const resumeIfNeeded = () => {
      if (!document.hidden) return;
      const el = audioRef.current;
      if (!el || !usePlayerStore.getState().isPlaying) return;
      if (el.paused) {
        el.play().catch(() => {});
      }
    };

    const handlePause = () => {
      if (!document.hidden) return;
      if (userPausedRef.current) return;
      if (!usePlayerStore.getState().isPlaying) return;
      audioRef.current?.play().catch(() => {});
    };

    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    const handleStall = () => {
      if (!document.hidden) return;
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(resumeIfNeeded, STALL_RETRY_MS);
    };

    document.addEventListener('visibilitychange', resumeIfNeeded);
    window.addEventListener('pagehide', resumeIfNeeded);
    window.addEventListener('pageshow', resumeIfNeeded);
    window.addEventListener('focus', resumeIfNeeded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('stalled', handleStall);
    audio.addEventListener('waiting', handleStall);

    return () => {
      document.removeEventListener('visibilitychange', resumeIfNeeded);
      window.removeEventListener('pagehide', resumeIfNeeded);
      window.removeEventListener('pageshow', resumeIfNeeded);
      window.removeEventListener('focus', resumeIfNeeded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('stalled', handleStall);
      audio.removeEventListener('waiting', handleStall);
      if (stallTimer) clearTimeout(stallTimer);
    };
  }, [audioRef, userPausedRef, isPlaying]);
}
