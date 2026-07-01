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
  const progressPct =
    duration > 0 ? Math.min(100, (displayPosition / duration) * 100) : 0;
  const isDragging = dragValue != null;

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
      <div className="group relative flex flex-1 items-center py-3">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-white/10" />
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-violet-400 ${
              isDragging ? '' : 'transition-[width] duration-300'
            }`}
            style={{ width: `${progressPct}%` }}
          />
          <div
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400 shadow transition-opacity ${
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{ left: `${progressPct}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(displayPosition, duration || 0)}
          onPointerDown={() => beginSeek()}
          onInput={(e) => setDragValue(Number(e.currentTarget.value))}
          onChange={(e) => setDragValue(Number(e.target.value))}
          onPointerUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Seek"
        />
      </div>
      <span className="w-8 text-right text-[10px] tabular-nums text-zinc-500">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
