'use client';

import { useState } from 'react';

import { formatDuration } from '@/lib/formatDuration';
import { usePlayerStore } from '@/store/usePlayerStore';

export function PlayerProgressBar() {
  const position = usePlayerStore((s) => s.position);
  const trackDuration = usePlayerStore((s) => s.currentTrack?.duration ?? 0);
  const playerDuration = usePlayerStore((s) => s.playerDuration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const beginSeek = usePlayerStore((s) => s.beginSeek);
  const endSeek = usePlayerStore((s) => s.endSeek);

  const duration = Math.max(trackDuration, playerDuration);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayPosition = dragValue ?? position;

  const commitSeek = (value: number) => {
    setDragValue(null);
    if (duration <= 0) {
      endSeek();
      return;
    }
    const clamped = Math.min(duration, Math.max(0, value));
    seekTo(clamped);
    endSeek();
  };

  return (
    <div className="flex items-center gap-2 px-4 pb-1">
      <span className="w-8 text-[10px] tabular-nums text-zinc-500">
        {formatDuration(Math.floor(displayPosition))}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(displayPosition, duration || 0)}
        onPointerDown={() => beginSeek()}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-400"
        aria-label="Seek"
      />
      <span className="w-8 text-right text-[10px] tabular-nums text-zinc-500">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
