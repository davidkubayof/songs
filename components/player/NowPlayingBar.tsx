'use client';

import { Pause, Play, SkipBack, SkipForward, Volume2, ClipboardCopy } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { PlayerProgressBar } from '@/components/player/PlayerProgressBar';
import { PLACEHOLDER_THUMBNAIL } from '@/constants/music';
import { useTogglePlay } from '@/hooks/useTogglePlay';
import {
  getDiagnosticReport,
  sendDiagnosticReport,
} from '@/lib/logger/client';
import { usePlayerStore } from '@/store/usePlayerStore';

const diagEnabled = process.env.NEXT_PUBLIC_DIAG_ENABLED === 'true';

async function copyDiagnostic() {
  const report = getDiagnosticReport();
  try {
    await navigator.clipboard.writeText(report);
  } catch {
  }
  void sendDiagnosticReport();
}

export function NowPlayingBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackError = usePlayerStore((s) => s.playbackError);
  const togglePlay = useTogglePlay();
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="now-playing"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="glass fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] border-t border-white/10"
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
              {playbackError && (
                <p className="truncate text-xs text-red-400">{playbackError}</p>
              )}
              {diagEnabled && playbackError && (
                <button
                  type="button"
                  onClick={() => void copyDiagnostic()}
                  className="mt-1 flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                >
                  <ClipboardCopy className="h-3 w-3" />
                  העתק אבחון
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="hidden items-center gap-1 sm:flex">
                <Volume2 className="h-4 w-4 text-zinc-500" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-400"
                  aria-label="Volume"
                />
              </div>
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
