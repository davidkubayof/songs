'use client';

import { useState } from 'react';

import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearchTracks } from '@/hooks/useSearchTracks';

export function SearchView() {
  const [query, setQuery] = useState('');
  const { tracks, loading, error, hasQuery } = useSearchTracks(query);

  return (
    <div className="flex flex-col gap-4 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      </header>
      <SearchBar value={query} onChange={setQuery} />
      <SearchResults
        tracks={tracks}
        loading={loading}
        error={error}
        hasQuery={hasQuery}
      />
    </div>
  );
}
