'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import type { Track } from '@/types/Music';

import { TrackGrid } from '@/components/search/TrackGrid';
import { TrackListSkeleton } from '@/components/search/TrackListSkeleton';
import type { ViewMode } from '@/components/search/ViewToggle';

interface SearchResultsProps {
  tracks: Track[];
  loading: boolean;
  hasQuery: boolean;
  mode: ViewMode;
  onPlay: (track: Track) => void;
  onAdd: (track: Track) => void;
  savedIds: Set<string>;
}

export function SearchResults({
  tracks,
  loading,
  hasQuery,
  mode,
  onPlay,
  onAdd,
  savedIds,
}: SearchResultsProps) {
  if (!hasQuery) {
    return (
      <EmptyState
        icon={Search}
        title="Discover music"
        description="Search millions of tracks. Type an artist, song, or mood to begin."
        variant="blue"
      />
    );
  }

  if (loading) return <TrackListSkeleton />;

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No matches yet"
        description="Try another search — we're still looking for the perfect track."
        variant="violet"
      />
    );
  }

  return <TrackGrid tracks={tracks} mode={mode} onPlay={onPlay} onAdd={onAdd} savedIds={savedIds} />;
}
