import type { Track } from '@/types/Music';

import { TrackRow } from '@/components/tracks/TrackRow';

interface TrackListItemProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAdd?: (track: Track) => void;
}

export function TrackListItem({ track, onPlay, onAdd }: TrackListItemProps) {
  return <TrackRow track={track} onPlay={onPlay} onAdd={onAdd} />;
}
