'use client';

import { useEffect } from 'react';

import { getAudioProxyUrl, getStreamResolveEndpoint } from '@/lib/getAudioStreamUrl';
import { isIos } from '@/lib/isIos';
import { findNextTrack } from '@/lib/playerQueue';
import { isValidVideoId } from '@/lib/youtubeVideoId';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function usePrefetchNext(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const tracks = usePlaylistStore((s) => s.tracks);

  useEffect(() => {
    if (!currentTrack) return;
    const next = findNextTrack(currentTrack, tracks);
    if (!next?.thumbnailUrl || !isValidVideoId(next.sourceId)) return;

    const img = new Image();
    img.src = next.thumbnailUrl;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'fetch';
    link.href = isIos()
      ? getStreamResolveEndpoint(next.sourceId)
      : getAudioProxyUrl(next.sourceId);
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [currentTrack, tracks]);
}
