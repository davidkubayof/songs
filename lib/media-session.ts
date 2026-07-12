import type { Track } from '@/types/Music';

function resolveArtworkUrl(thumbnailUrl: string): string {
  if (thumbnailUrl.startsWith('https://')) return thumbnailUrl;
  if (typeof window !== 'undefined') {
    return new URL(thumbnailUrl, window.location.origin).href;
  }
  return thumbnailUrl;
}

export function setTrackMetadata(track: Track): void {
  if (!('mediaSession' in navigator)) return;

  const artUrl = resolveArtworkUrl(track.thumbnailUrl);
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album ?? 'Songs',
    artwork: [
      { src: artUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: artUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: artUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
    ],
  });
}

export function setPlaybackState(playing: boolean): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

export function setPositionState(
  duration: number,
  position: number,
  rate = 1,
): void {
  if (!('mediaSession' in navigator)) return;
  if (!navigator.mediaSession.setPositionState || duration <= 0) return;

  navigator.mediaSession.setPositionState({
    duration,
    playbackRate: rate,
    position: Math.min(position, duration),
  });
}

export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
}
