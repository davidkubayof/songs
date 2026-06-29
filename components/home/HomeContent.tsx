'use client';

import Link from 'next/link';
import { Music2 } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfileMenu } from '@/components/home/ProfileMenu';
import { ShareButton } from '@/components/share/ShareButton';
import { TrackRow } from '@/components/tracks/TrackRow';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function HomeContent() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const tracks = usePlaylistStore((s) => s.tracks);
  const recent = tracks.slice(-3).reverse();

  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="flex items-start justify-between pt-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
          <p className="mt-1 text-sm text-zinc-500">Your music, anywhere</p>
        </div>
        <ProfileMenu />
      </header>
      <GlassPanel className="p-5">
        <h2 className="text-sm font-medium text-zinc-400">Now Playing</h2>
        {currentTrack ? (
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{currentTrack.title}</p>
              <p className="text-sm text-zinc-400">{currentTrack.artist}</p>
              <button
                type="button"
                onClick={togglePlay}
                className="mt-3 text-sm text-violet-300 hover:underline"
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
            </div>
            <ShareButton track={currentTrack} />
          </div>
        ) : (
          <EmptyState
            icon={Music2}
            title="Nothing playing"
            description="Search for a track and tap to start listening."
            action={
              <Link href="/search" className="text-sm text-violet-300 hover:underline">
                Browse music
              </Link>
            }
          />
        )}
      </GlassPanel>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">
          Recent ({tracks.length})
        </h2>
        {recent.length === 0 ? (
          <GlassPanel>
            <EmptyState
              icon={Music2}
              title="No tracks yet"
              description="Add songs from Search to build your playlist."
              action={
                <Link href="/search" className="text-sm text-violet-300 hover:underline">
                  Go to Search
                </Link>
              }
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
