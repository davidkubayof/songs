'use client';

import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { PlayerProgressBar } from '@/components/player/PlayerProgressBar';
import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import { usePlayerStore } from '@/store/usePlayerStore';

export function NowPlayingBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="now-playing"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="glass fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-white/10"
        >
          <PlayerProgressBar />
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
              <Image
                src={currentTrack.thumbnailUrl || PLACEHOLDER_THUMBNAIL}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{currentTrack.title}</p>
              <p className="truncate text-xs text-zinc-400">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={playPrevious} className="p-2 text-zinc-400 hover:text-white">
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button type="button" onClick={playNext} className="p-2 text-zinc-400 hover:text-white">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
