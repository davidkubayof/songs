'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PlayerErrorBoundary } from '@/components/player/PlayerErrorBoundary';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePrefetchNext } from '@/hooks/usePrefetchNext';
import { getStreamResolveEndpoint } from '@/lib/getAudioStreamUrl';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { isValidVideoId } from '@/lib/youtubeVideoId';
import { usePlayerStore } from '@/store/usePlayerStore';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

type PlaybackMode = 'audio' | 'embed';

const SEEK_VERIFY_MS = 300;
const SEEK_TOLERANCE = 1;

export function PlayerShell() {
  useMediaSession();
  usePrefetchNext();

  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  useBackgroundAudio(audioRef);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const playEpoch = usePlayerStore((s) => s.playEpoch);
  const playerReady = usePlayerStore((s) => s.playerReady);
  const skipOnError = usePlayerStore((s) => s.skipOnError);
  const playNext = usePlayerStore((s) => s.playNext);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const clearSeekTarget = usePlayerStore((s) => s.clearSeekTarget);
  const setPlayerReady = usePlayerStore((s) => s.setPlayerReady);
  const setPlayerDuration = usePlayerStore((s) => s.setPlayerDuration);

  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('audio');
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const retriedRef = useRef(false);
  const resolveGenRef = useRef(0);
  const seekVerifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFailCountRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const playbackModeRef = useRef<PlaybackMode>('audio');

  playbackModeRef.current = playbackMode;

  const clearSeekVerifyTimer = useCallback(() => {
    if (seekVerifyTimerRef.current) {
      clearTimeout(seekVerifyTimerRef.current);
      seekVerifyTimerRef.current = null;
    }
  }, []);

  const fallbackToEmbed = useCallback(() => {
    setPlaybackMode('embed');
    setResolvedUrl(null);
    setPlayerReady(false);
  }, [setPlayerReady]);

  const confirmSeek = useCallback(() => {
    clearSeekVerifyTimer();
    pendingSeekRef.current = null;
    seekFailCountRef.current = 0;
    const media =
      playbackModeRef.current === 'embed' ? playerRef.current : audioRef.current;
    const actualTime = media?.currentTime;
    clearSeekTarget();
    if (actualTime != null) {
      setPosition(actualTime);
    }
  }, [clearSeekTarget, clearSeekVerifyTimer, setPosition]);

  const scheduleSeekVerify = useCallback(
    (target: number, media: HTMLMediaElement) => {
      clearSeekVerifyTimer();
      seekVerifyTimerRef.current = setTimeout(() => {
        seekVerifyTimerRef.current = null;
        const currentTarget = usePlayerStore.getState().seekTarget;
        if (currentTarget == null || pendingSeekRef.current !== target) return;

        if (Math.abs(media.currentTime - target) < SEEK_TOLERANCE) {
          confirmSeek();
          return;
        }

        seekFailCountRef.current += 1;
        if (seekFailCountRef.current < 2) {
          media.currentTime = target;
          scheduleSeekVerify(target, media);
          return;
        }

        seekFailCountRef.current = 0;
        pendingSeekRef.current = null;
        clearSeekTarget();

        if (playbackModeRef.current === 'audio') {
          setPlayerReady(false);
          setResolvedUrl(null);
          setRetryKey((k) => k + 1);
        }
      }, SEEK_VERIFY_MS);
    },
    [clearSeekVerifyTimer, confirmSeek, setPlayerReady],
  );

  const applyPendingSeek = useCallback(() => {
    const target = usePlayerStore.getState().seekTarget;
    const mode = playbackModeRef.current;
    const media = mode === 'embed' ? playerRef.current : audioRef.current;
    if (target == null || !media) return;

    let seekTime = target;
    if (mode === 'audio' && media.seekable.length > 0) {
      const end = media.seekable.end(media.seekable.length - 1);
      seekTime = Math.min(target, end);
    }

    pendingSeekRef.current = seekTime;
    media.currentTime = seekTime;
    scheduleSeekVerify(seekTime, media);
  }, [scheduleSeekVerify]);

  const handleSeeked = useCallback(() => {
    if (usePlayerStore.getState().seekTarget == null) return;
    confirmSeek();
  }, [confirmSeek]);

  useEffect(() => {
    retriedRef.current = false;
    setRetryKey(0);
    setResolvedUrl(null);
    setPlaybackMode('audio');
    setPlayerReady(false);
    clearSeekVerifyTimer();
    pendingSeekRef.current = null;
    seekFailCountRef.current = 0;
  }, [playEpoch, setPlayerReady, clearSeekVerifyTimer]);

  useEffect(() => {
    if (!currentTrack || playbackMode !== 'audio') return;

    if (!isValidVideoId(currentTrack.sourceId)) {
      skipOnError();
      return;
    }

    const gen = ++resolveGenRef.current;
    let cancelled = false;

    (async () => {
      try {
        const endpoint = getStreamResolveEndpoint(currentTrack.sourceId, retryKey);
        const res = await fetchWithRetry(endpoint);
        if (!res.ok) throw new Error('Resolve failed');
        const data = (await res.json()) as { url?: string };
        if (!data.url?.startsWith('https://')) throw new Error('Invalid stream url');
        if (cancelled || gen !== resolveGenRef.current) return;
        setResolvedUrl(data.url);
      } catch {
        if (cancelled || gen !== resolveGenRef.current) return;
        if (!retriedRef.current) {
          retriedRef.current = true;
          setRetryKey((k) => k + 1);
          return;
        }
        fallbackToEmbed();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrack, retryKey, skipOnError, playbackMode, fallbackToEmbed, playEpoch]);

  useEffect(() => {
    if (seekTarget == null || !playerReady) return;
    applyPendingSeek();
  }, [seekTarget, playerReady, applyPendingSeek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playbackMode !== 'audio') return;
    audio.volume = volume;
  }, [volume, resolvedUrl, playbackMode]);

  useEffect(() => {
    if (playbackMode === 'embed') return;
    const audio = audioRef.current;
    if (!audio || !resolvedUrl) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, resolvedUrl, playerReady, playbackMode]);

  useEffect(() => {
    if (playbackMode !== 'embed') return;
    const player = playerRef.current;
    if (!player) return;
    player.volume = volume;
    if (isPlaying) {
      player.play().catch(() => {});
    } else {
      player.pause();
    }
  }, [isPlaying, volume, playbackMode, currentTrack?.id, playerReady]);

  useEffect(() => () => clearSeekVerifyTimer(), [clearSeekVerifyTimer]);

  const handleLoadedMetadata = () => {
    setPlayerReady(true);
    const duration = audioRef.current?.duration ?? 0;
    if (Number.isFinite(duration) && duration > 0) {
      setPlayerDuration(duration);
    }
    applyPendingSeek();
  };

  const handleReady = () => {
    setPlayerReady(true);
    applyPendingSeek();
  };

  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const duration = e.currentTarget.duration;
    if (Number.isFinite(duration) && duration > 0) {
      setPlayerDuration(duration);
    }
  };

  const handleAudioError = () => {
    if (!retriedRef.current) {
      retriedRef.current = true;
      setPlayerReady(false);
      setResolvedUrl(null);
      setRetryKey((k) => k + 1);
      return;
    }
    fallbackToEmbed();
  };

  if (!currentTrack) return null;
  if (playbackMode === 'audio' && !resolvedUrl) return null;

  if (playbackMode === 'embed') {
    return (
      <PlayerErrorBoundary key={`${currentTrack.id}-embed`} onError={skipOnError}>
        <div className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0">
          <ReactPlayer
            ref={playerRef}
            src={currentTrack.streamUrl}
            playing={isPlaying}
            volume={volume}
            width={0}
            height={0}
            playsInline
            onReady={handleReady}
            onDurationChange={handleDurationChange}
            onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
            onSeeked={handleSeeked}
            onError={() => skipOnError()}
            onEnded={() => playNext()}
          />
        </div>
      </PlayerErrorBoundary>
    );
  }

  return (
    <PlayerErrorBoundary key={`${currentTrack.id}-${retryKey}`} onError={skipOnError}>
      <audio
        ref={audioRef}
        src={resolvedUrl!}
        preload="metadata"
        className="sr-only"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onDurationChange={handleDurationChange}
        onSeeked={handleSeeked}
        onEnded={() => playNext()}
        onError={handleAudioError}
      />
    </PlayerErrorBoundary>
  );
}
