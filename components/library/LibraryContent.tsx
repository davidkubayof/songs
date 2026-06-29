'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { TrackRow } from '@/components/tracks/TrackRow';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylistStore } from '@/store/usePlaylistStore';

export function LibraryContent() {
  const tracks = usePlaylistStore((s) => s.tracks);
  const isHydrated = usePlaylistStore((s) => s.isHydrated);
  const playTrack = usePlayerStore((s) => s.playTrack);

  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {tracks.length} saved {tracks.length === 1 ? 'track' : 'tracks'}
        </p>
      </header>
      {!isHydrated ? (
        <GlassPanel className="p-8 text-center text-sm text-zinc-500">
          Loading library...
        </GlassPanel>
      ) : tracks.length === 0 ? (
        <GlassPanel className="flex flex-col items-center p-8 text-center">
          <p className="text-sm text-zinc-400">Your library is empty</p>
          <p className="mt-2 text-xs text-zinc-500">
            Use Add on Search results to save tracks
          </p>
        </GlassPanel>
      ) : (
        <GlassPanel className="divide-y divide-white/5 p-2">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} onPlay={playTrack} />
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
