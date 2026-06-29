'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import type { Track } from '@/types/Music';

import { TrackListItem } from '@/components/search/TrackListItem';
import { TrackListSkeleton } from '@/components/search/TrackListSkeleton';

interface SearchResultsProps {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  hasQuery: boolean;
  onPlay: (track: Track) => void;
  onAdd: (track: Track) => void;
}

export function SearchResults({
  tracks,
  loading,
  error,
  hasQuery,
  onPlay,
  onAdd,
}: SearchResultsProps) {
  if (!hasQuery) {
    return (
      <EmptyState
        icon={Search}
        title="Search music"
        description="Find songs, artists, and albums. Results appear as you type."
      />
    );
  }

  if (loading) return <TrackListSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={Search}
        title="Search failed"
        description={error}
      />
    );
  }

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results"
        description="Try a different keyword or check your connection."
      />
    );
  }

  return (
    <ul className="flex flex-col">
      {tracks.map((track) => (
        <li key={track.id}>
          <TrackListItem track={track} onPlay={onPlay} onAdd={onAdd} />
        </li>
      ))}
    </ul>
  );
}
