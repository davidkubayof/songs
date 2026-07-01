'use client';

import { formatDuration } from '@/lib/formatDuration';
import { usePlayerStore } from '@/store/usePlayerStore';

export function PlayerProgressBar() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.currentTrack?.duration ?? 0);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const handleSeek = (value: number) => {
    if (duration <= 0) return;
    seekTo(Math.min(duration, Math.max(0, value)));
  };

  return (
    <div className="flex items-center gap-2 px-4 pb-1">
      <span className="w-8 text-[10px] tabular-nums text-zinc-500">
        {formatDuration(Math.floor(position))}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={Math.min(position, duration || 0)}
        onChange={(e) => handleSeek(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-400"
        aria-label="Seek"
      />
      <span className="w-8 text-right text-[10px] tabular-nums text-zinc-500">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
