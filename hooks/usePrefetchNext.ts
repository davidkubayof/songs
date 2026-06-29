'use client';

import { useEffect } from 'react';

import { findNextTrack } from '@/lib/playerQueue';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function usePrefetchNext(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const tracks = usePlaylistStore((s) => s.tracks);

  useEffect(() => {
    if (!currentTrack) return;
    const next = findNextTrack(currentTrack, tracks);
    if (!next?.thumbnailUrl) return;

    const img = new Image();
    img.src = next.thumbnailUrl;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = next.streamUrl;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [currentTrack, tracks]);
}
