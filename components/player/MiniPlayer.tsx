'use client';

import { Pause, Play } from 'lucide-react';
import Image from 'next/image';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import { usePlayerStore } from '@/store/usePlayerStore';

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  if (!currentTrack) return null;

  const thumb = currentTrack.thumbnailUrl || PLACEHOLDER_THUMBNAIL;

  return (
    <GlassPanel className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.5rem)] z-40 flex items-center gap-3 p-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        <Image src={thumb} alt="" fill className="object-cover" sizes="44px" unoptimized />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{currentTrack.title}</p>
        <p className="truncate text-xs text-zinc-400">{currentTrack.artist}</p>
      </div>
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
    </GlassPanel>
  );
}
