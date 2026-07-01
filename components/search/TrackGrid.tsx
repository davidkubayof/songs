'use client';

import { motion, AnimatePresence } from 'framer-motion';

import type { Track } from '@/types/Music';
import type { ViewMode } from '@/components/search/ViewToggle';

import { TrackGridItem } from '@/components/search/TrackGridItem';
import { TrackListItem } from '@/components/search/TrackListItem';

interface TrackGridProps {
  tracks: Track[];
  mode: ViewMode;
  onPlay: (track: Track) => void;
  onAdd: (track: Track) => void;
  savedIds: Set<string>;
}

export function TrackGrid({ tracks, mode, onPlay, onAdd, savedIds }: TrackGridProps) {
  return (
    <AnimatePresence mode="popLayout">
      {mode === 'grid' ? (
        <motion.div
          key="grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          {tracks.map((track) => (
            <TrackGridItem
              key={track.id}
              track={track}
              onPlay={onPlay}
              onAdd={onAdd}
              isSaved={savedIds.has(track.id)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.ul key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1">
          {tracks.map((track) => (
            <li key={track.id}>
              <TrackListItem
                track={track}
                onPlay={onPlay}
                onAdd={onAdd}
                isSaved={savedIds.has(track.id)}
              />
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}
