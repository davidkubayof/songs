'use client';

import Link from 'next/link';
import { Music2 } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShareButton } from '@/components/share/ShareButton';
import { TrackRow } from '@/components/tracks/TrackRow';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

function NowPlayingCard() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  if (!currentTrack) {
    return (
      <EmptyState
        icon={Music2}
        title="Nothing playing"
        description="Your queue is ready. Search for music and tap play to start."
        variant="rose"
        action={
          <Link href="/search" className="text-sm font-medium text-violet-300 hover:underline">
            Explore catalog
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div>
        <p className="font-medium">{currentTrack.title}</p>
        <p className="text-sm text-zinc-400">{currentTrack.artist}</p>
        <button
          type="button"
          onClick={togglePlay}
          className="mt-3 text-sm font-medium text-violet-300 hover:underline"
        >
          {isPlaying ? 'Pause' : 'Resume'}
        </button>
      </div>
      <ShareButton track={currentTrack} />
    </div>
  );
}

export function HomeContent() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const tracks = usePlaylistStore((s) => s.tracks);
  const recent = tracks.slice(-4).reverse();

  return (
    <div className="flex flex-col gap-4 px-4 pt-safe">
      <header className="pt-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
          <p className="mt-1 text-sm text-zinc-500">Premium streaming</p>
        </div>
      </header>
      <GlassPanel className="overflow-hidden">
        <p className="border-b border-white/5 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Now Playing
        </p>
        <NowPlayingCard />
      </GlassPanel>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-400">Recent · {tracks.length}</h2>
        {recent.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={Music2}
              title="Build your library"
              description="Save tracks from search to access them offline and across devices."
              variant="violet"
            />
          </GlassPanel>
        ) : (
          <GlassPanel className="divide-y divide-white/5 p-2">
            {recent.map((track) => (
              <TrackRow key={track.id} track={track} onPlay={playTrack} />
            ))}
          </GlassPanel>
        )}
      </section>
    </div>
  );
}
