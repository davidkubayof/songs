'use client';

import { formatDuration } from '@/lib/formatDuration';
import { usePlayerStore } from '@/store/usePlayerStore';

export function PlayerProgressBar() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.currentTrack?.duration ?? 0);
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-2 px-4 pb-1">
      <span className="w-8 text-[10px] tabular-nums text-zinc-500">
        {formatDuration(Math.floor(position))}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-violet-400 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-[10px] tabular-nums text-zinc-500">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
