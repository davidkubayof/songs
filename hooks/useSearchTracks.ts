'use client';

import { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { SEARCH_DEBOUNCE_MS } from '@/constants/music';
import type { Track } from '@/types/Music';

interface SearchState {
  tracks: Track[];
  loading: boolean;
  hasQuery: boolean;
}

function parseTracks(data: unknown): Track[] {
  if (!Array.isArray(data)) return [];
  return data as Track[];
}

export function useSearchTracks(query: string): SearchState {
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmed = debouncedQuery.trim();
  const hasQuery = query.trim().length > 0;
  const isDebouncing = hasQuery && query.trim() !== trimmed;

  useEffect(() => {
    if (!trimmed) {
      setTracks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchWithRetry(`/api/music/search?q=${encodeURIComponent(trimmed)}`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        const body = await res.json().catch(() => []);
        return res.ok ? parseTracks(body) : [];
      })
      .then((data) => {
        if (!cancelled) setTracks(data);
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  return { tracks, loading: loading || isDebouncing, hasQuery };
}
