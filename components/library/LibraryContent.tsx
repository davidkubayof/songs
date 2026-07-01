'use client';

import Link from 'next/link';
import { Library as LibraryIcon } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrackRow } from '@/components/tracks/TrackRow';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function LibraryContent() {
  const tracks = usePlaylistStore((s) => s.tracks);
  const isHydrated = usePlaylistStore((s) => s.isHydrated);
  const playTrack = usePlayTrack();
  const removeTrack = usePlaylistStore((s) => s.removeTrack);

  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {tracks.length} saved {tracks.length === 1 ? 'track' : 'tracks'}
        </p>
        <Link href="/rooms" className="mt-2 inline-block text-sm text-violet-300 hover:underline">
          Listening rooms →
        </Link>
      </header>
      {!isHydrated ? (
        <GlassPanel className="p-8 text-center text-sm text-zinc-500">
          Loading your library…
        </GlassPanel>
      ) : tracks.length === 0 ? (
        <GlassPanel>
          <EmptyState
            icon={LibraryIcon}
            title="Your library is empty"
            description="Save tracks from Search. Guest playlists work offline too."
            action={
              <Link href="/search" className="text-sm text-violet-300 hover:underline">
                Discover music
              </Link>
            }
          />
        </GlassPanel>
      ) : (
        <GlassPanel className="divide-y divide-white/5 p-2">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} onPlay={playTrack} onRemove={removeTrack} />
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
