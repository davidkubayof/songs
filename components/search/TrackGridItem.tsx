'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

import { formatDuration } from '@/lib/formatDuration';
import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import type { Track } from '@/types/Music';

interface TrackGridItemProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAdd: (track: Track) => void;
  isSaved?: boolean;
}

export function TrackGridItem({ track, onPlay, onAdd, isSaved }: TrackGridItemProps) {
  const thumb = track.thumbnailUrl || PLACEHOLDER_THUMBNAIL;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]"
    >
      <button type="button" onClick={() => onPlay(track)} className="relative aspect-square w-full">
        <Image src={thumb} alt="" fill className="object-cover" sizes="160px" unoptimized />
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] tabular-nums">
          {formatDuration(track.duration)}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{track.title}</p>
          <p className="truncate text-xs text-zinc-500">{track.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(track)}
          disabled={isSaved}
          className="rounded-lg border border-white/10 py-1.5 text-xs text-zinc-300 hover:bg-white/10 disabled:cursor-default disabled:border-violet-500/30 disabled:text-violet-300 disabled:hover:bg-transparent"
        >
          {isSaved ? 'Saved' : 'Add'}
        </button>
      </div>
    </motion.article>
  );
}
