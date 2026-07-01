'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PlayerErrorBoundary } from '@/components/player/PlayerErrorBoundary';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePrefetchNext } from '@/hooks/usePrefetchNext';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { getAudioProxyUrl, getStreamResolveEndpoint } from '@/lib/getAudioStreamUrl';
import { isIos } from '@/lib/isIos';
import { registerPlayerController } from '@/lib/playerController';
import { isValidVideoId } from '@/lib/youtubeVideoId';
import { usePlayerStore } from '@/store/usePlayerStore';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

type PlaybackMode = 'audio' | 'embed';

const SEEK_VERIFY_MS = 300;
const SEEK_TOLERANCE = 1;
const MAX_IOS_RETRIES = 3;

export function PlayerShell() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const useDirectStreamRef = useRef(false);
  const resolveGenRef = useRef(0);
  const errorCountRef = useRef(0);

  useMediaSession(audioRef, userPausedRef);
  usePrefetchNext();
  useBackgroundAudio(audioRef, userPausedRef);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const playEpoch = usePlayerStore((s) => s.playEpoch);
  const playerReady = usePlayerStore((s) => s.playerReady);
  const skipOnError = usePlayerStore((s) => s.skipOnError);
  const pause = usePlayerStore((s) => s.pause);
  const playNext = usePlayerStore((s) => s.playNext);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const clearSeekTarget = usePlayerStore((s) => s.clearSeekTarget);
  const setPlayerReady = usePlayerStore((s) => s.setPlayerReady);
  const setPlayerDuration = usePlayerStore((s) => s.setPlayerDuration);

  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('audio');
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const retryKeyRef = useRef(retryKey);
  retryKeyRef.current = retryKey;
  const seekVerifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFailCountRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const playbackModeRef = useRef<PlaybackMode>('audio');

  playbackModeRef.current = playbackMode;

  useEffect(() => {
    useDirectStreamRef.current = isIos();
  }, []);

  const clearSeekVerifyTimer = useCallback(() => {
    if (seekVerifyTimerRef.current) {
      clearTimeout(seekVerifyTimerRef.current);
      seekVerifyTimerRef.current = null;
    }
  }, []);

  const applyAudioSrc = useCallback((url: string | null) => {
    const audio = audioRef.current;
    if (!audio) {
      setAudioSrc(url);
      return;
    }
    if (url) {
      const resolved = url.startsWith('http')
        ? url
        : new URL(url, window.location.origin).href;
      if (audio.src !== resolved) {
        audio.src = url;
      }
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
    setAudioSrc(url);
  }, []);

  const resolveStreamUrl = useCallback(
    async (sourceId: string, cacheBust: number): Promise<string | null> => {
      if (useDirectStreamRef.current) {
        const endpoint = getStreamResolveEndpoint(sourceId, cacheBust);
        const res = await fetchWithRetry(endpoint);
        if (!res.ok) return null;
        const data = (await res.json()) as { url?: string };
        return data.url?.startsWith('https://') ? data.url : null;
      }
      return getAudioProxyUrl(sourceId, cacheBust);
    },
    [],
  );

  const playAudioFromGesture = useCallback(
    (sourceId?: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      userPausedRef.current = false;

      if (useDirectStreamRef.current && sourceId && isValidVideoId(sourceId)) {
        resolveStreamUrl(sourceId, retryKeyRef.current)
          .then((url) => {
            if (!url) return;
            applyAudioSrc(url);
            return audio.play();
          })
          .catch(() => {});
        return;
      }

      audio.play().catch(() => {});
    },
    [applyAudioSrc, resolveStreamUrl],
  );

  const fallbackToEmbed = useCallback(() => {
    if (isIos()) {
      usePlayerStore.setState({ isPlaying: false });
      return;
    }
    setPlaybackMode('embed');
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
          errorCountRef.current += 1;
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
    errorCountRef.current = 0;
    setRetryKey(0);
    setPlaybackMode('audio');
    setPlayerReady(false);
    setAudioSrc(null);
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
      const url = await resolveStreamUrl(currentTrack.sourceId, retryKey);
      if (cancelled || gen !== resolveGenRef.current) return;
      if (!url) {
        errorCountRef.current += 1;
        if (errorCountRef.current < MAX_IOS_RETRIES) {
          setRetryKey((k) => k + 1);
        } else if (isIos()) {
          usePlayerStore.setState({ isPlaying: false });
        } else {
          fallbackToEmbed();
        }
        return;
      }
      applyAudioSrc(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentTrack,
    retryKey,
    playbackMode,
    playEpoch,
    skipOnError,
    resolveStreamUrl,
    applyAudioSrc,
    fallbackToEmbed,
  ]);

  useEffect(() => {
    registerPlayerController({
      playFromGesture: playAudioFromGesture,
      pauseFromUser: () => {
        userPausedRef.current = true;
        pause();
        audioRef.current?.pause();
      },
    });
    return () => registerPlayerController(null);
  }, [playAudioFromGesture, pause]);

  useEffect(() => {
    if (seekTarget == null || !playerReady) return;
    applyPendingSeek();
  }, [seekTarget, playerReady, applyPendingSeek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playbackMode !== 'audio') return;
    audio.volume = volume;
  }, [volume, audioSrc, playbackMode]);

  useEffect(() => {
    if (playbackMode === 'embed') return;
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    if (isPlaying) {
      userPausedRef.current = false;
      audio.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      audio.pause();
    }
  }, [isPlaying, audioSrc, playerReady, playbackMode]);

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
    errorCountRef.current = 0;
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
    setPlayerReady(false);
    errorCountRef.current += 1;
    if (errorCountRef.current < MAX_IOS_RETRIES) {
      setRetryKey((k) => k + 1);
      return;
    }
    if (isIos()) {
      usePlayerStore.setState({ isPlaying: false });
      return;
    }
    fallbackToEmbed();
  };

  if (playbackMode === 'embed' && currentTrack) {
    return (
      <PlayerErrorBoundary onError={skipOnError}>
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
    <PlayerErrorBoundary onError={skipOnError}>
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
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
