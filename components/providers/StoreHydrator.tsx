'use client';

import { useEffect } from 'react';

import { usePlaylistStore } from '@/store/usePlaylistStore';

export function StoreHydrator() {
  const hydrate = usePlaylistStore((s) => s.hydrate);
  const isHydrated = usePlaylistStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  return null;
}
