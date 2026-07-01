'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { ViewToggle } from '@/components/search/ViewToggle';
import { useSearchTracks } from '@/hooks/useSearchTracks';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function SearchView() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const { tracks, loading, hasQuery } = useSearchTracks(query);
  const playTrack = usePlayTrack();
  const addTrack = usePlaylistStore((s) => s.addTrack);
  const playlistTracks = usePlaylistStore((s) => s.tracks);
  const savedIds = useMemo(() => new Set(playlistTracks.map((t) => t.id)), [playlistTracks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 px-4 pt-safe"
    >
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <ViewToggle mode={mode} onChange={setMode} />
      </header>
      <SearchBar value={query} onChange={setQuery} />
      <SearchResults
        tracks={tracks}
        loading={loading}
        hasQuery={hasQuery}
        mode={mode}
        onPlay={playTrack}
        onAdd={addTrack}
        savedIds={savedIds}
      />
    </motion.div>
  );
}
