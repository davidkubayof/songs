import Image from 'next/image';

import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import type { Track } from '@/types/Music';

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'LIVE';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TrackListItemProps {
  track: Track;
}

export function TrackListItem({ track }: TrackListItemProps) {
  const thumb = track.thumbnailUrl || PLACEHOLDER_THUMBNAIL;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left transition-colors hover:bg-white/5 active:bg-white/10"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
        <Image
          src={thumb}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{track.title}</p>
        <p className="truncate text-xs text-zinc-400">{track.artist}</p>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
        {formatDuration(track.duration)}
      </span>
    </button>
  );
}
