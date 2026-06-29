'use client';

import { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH_DEBOUNCE_MS } from '@/constants/music';
import type { Track } from '@/types/Music';

interface SearchState {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  hasQuery: boolean;
}

export function useSearchTracks(query: string): SearchState {
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = debouncedQuery.trim();
  const hasQuery = trimmed.length > 0;

  useEffect(() => {
    if (!hasQuery) {
      setTracks([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/music/search?q=${encodeURIComponent(trimmed)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Search failed');
        }
        return res.json() as Promise<Track[]>;
      })
      .then((data) => {
        if (!cancelled) setTracks(data);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setTracks([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trimmed, hasQuery]);

  return { tracks, loading, error, hasQuery };
}
