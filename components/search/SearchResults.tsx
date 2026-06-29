'use client';

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
      <p className="px-1 pt-8 text-center text-sm text-zinc-500">
        Find your next favorite track
      </p>
    );
  }

  if (loading) return <TrackListSkeleton />;

  if (error) {
    return (
      <p className="px-1 pt-8 text-center text-sm text-red-400">{error}</p>
    );
  }

  if (tracks.length === 0) {
    return (
      <p className="px-1 pt-8 text-center text-sm text-zinc-500">
        No results found
      </p>
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
