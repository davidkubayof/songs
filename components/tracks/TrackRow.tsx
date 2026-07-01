'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';

import { ShareButton } from '@/components/share/ShareButton';
import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import { formatDuration } from '@/lib/formatDuration';
import type { Track } from '@/types/Music';

interface TrackRowProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAdd?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  isSaved?: boolean;
  showShare?: boolean;
}

export function TrackRow({ track, onPlay, onAdd, onRemove, isSaved, showShare = true }: TrackRowProps) {
  const thumb = track.thumbnailUrl || PLACEHOLDER_THUMBNAIL;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPlay(track)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-white/5"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          <Image src={thumb} alt="" fill className="object-cover" sizes="56px" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{track.title}</p>
          <p className="truncate text-xs text-zinc-400">{track.artist}</p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
          {formatDuration(track.duration)}
        </span>
      </button>
      {showShare && <ShareButton track={track} />}
      {onAdd && (
        <button
          type="button"
          onClick={() => onAdd(track)}
          disabled={isSaved}
          className="shrink-0 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:text-violet-300 disabled:hover:bg-transparent"
        >
          {isSaved ? 'Saved' : 'Add'}
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(track)}
          className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-red-400"
          aria-label="Remove from library"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
