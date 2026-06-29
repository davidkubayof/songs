'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { HomeAuthBar } from '@/components/home/HomeAuthBar';
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
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
        <HomeAuthBar />
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
                className="mt-3 text-sm text-white hover:underline"
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
            </div>
            <ShareButton track={currentTrack} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Nothing playing yet</p>
        )}
      </GlassPanel>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">
          Your Playlist ({tracks.length})
        </h2>
        {recent.length === 0 ? (
          <GlassPanel className="p-5 text-sm text-zinc-500">
            Add tracks from Search to build your playlist
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
