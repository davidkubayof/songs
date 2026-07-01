'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

import { PlayerErrorBoundary } from '@/components/player/PlayerErrorBoundary';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePrefetchNext } from '@/hooks/usePrefetchNext';
import { usePlayerStore } from '@/store/usePlayerStore';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export function PlayerShell() {
  useMediaSession();
  usePrefetchNext();

  const playerRef = useRef<HTMLVideoElement>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const skipOnError = usePlayerStore((s) => s.skipOnError);
  const playNext = usePlayerStore((s) => s.playNext);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const clearSeekTarget = usePlayerStore((s) => s.clearSeekTarget);

  useEffect(() => {
    if (seekTarget == null || !playerRef.current) return;
    playerRef.current.currentTime = seekTarget;
    clearSeekTarget();
  }, [seekTarget, clearSeekTarget]);

  if (!currentTrack) return null;

  return (
    <PlayerErrorBoundary key={currentTrack.id} onError={skipOnError}>
      <div className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0">
        <ReactPlayer
          ref={playerRef}
          src={currentTrack.streamUrl}
          playing={isPlaying}
          volume={volume}
          width={0}
          height={0}
          playsInline
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onError={() => skipOnError()}
          onEnded={() => playNext()}
        />
      </div>
    </PlayerErrorBoundary>
  );
}
