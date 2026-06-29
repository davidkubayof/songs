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

function parseTracks(data: unknown): Track[] {
  if (!Array.isArray(data)) return [];
  return data as Track[];
}

export function useSearchTracks(query: string): SearchState {
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = debouncedQuery.trim();
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!trimmed) {
      setTracks([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/music/search?q=${encodeURIComponent(trimmed)}`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof body.error === 'string' ? body.error : 'Search failed',
          );
        }
        return parseTracks(body);
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
  }, [trimmed]);

  return { tracks, loading: loading || (query.trim().length > 0 && query.trim() !== trimmed), error, hasQuery };
}
