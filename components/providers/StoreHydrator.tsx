'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/useAuthStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function StoreHydrator() {
  const initialize = useAuthStore((s) => s.initialize);
  const authReady = useAuthStore((s) => !s.isLoading);
  const hydrate = usePlaylistStore((s) => s.hydrate);
  const isHydrated = usePlaylistStore((s) => s.isHydrated);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (authReady && !isHydrated) hydrate();
  }, [authReady, hydrate, isHydrated]);

  return null;
}
