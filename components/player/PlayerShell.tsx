'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PlayerErrorBoundary } from '@/components/player/PlayerErrorBoundary';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePrefetchNext } from '@/hooks/usePrefetchNext';
import { getAudioProxyUrl } from '@/lib/getAudioStreamUrl';
import {
  clientLog,
  createClientTraceId,
  sendDiagnosticReport,
  setTraceId,
} from '@/lib/logger/client';
import { registerPlayerController } from '@/lib/playerController';
import { isValidVideoId } from '@/lib/youtubeVideoId';
import { usePlayerStore } from '@/store/usePlayerStore';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

type PlaybackMode = 'audio' | 'embed';

const SEEK_VERIFY_MS = 300;
const SEEK_TOLERANCE = 1;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function PlayerShell() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const errorCountRef = useRef(0);
  const pendingResumeRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const setPlaybackError = usePlayerStore((s) => s.setPlaybackError);
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
  const errorSrcRef = useRef<string | null>(null);
  const playbackModeRef = useRef<PlaybackMode>('audio');

  playbackModeRef.current = playbackMode;

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const clearSeekVerifyTimer = useCallback(() => {
    if (seekVerifyTimerRef.current) {
      clearTimeout(seekVerifyTimerRef.current);
      seekVerifyTimerRef.current = null;
    }
  }, []);

  const applyAudioSrc = useCallback((url: string | null) => {
    const audio = audioRef.current;
    if (url) {
      clientLog({
        level: 'info',
        event: 'audio_src_set',
        videoId: currentTrack?.sourceId,
        trackId: currentTrack?.id,
        meta: { proxyPath: url },
      });
    }
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
        audio.load();
        setPlayerReady(false);
        errorSrcRef.current = resolved;
      }
    } else {
      audio.removeAttribute('src');
      audio.load();
      setPlayerReady(false);
    }
    setAudioSrc(url);
  }, [setPlayerReady, currentTrack?.id, currentTrack?.sourceId]);

  const playAudioFromGesture = useCallback(
    (sourceId?: string) => {
      const audio = audioRef.current;
      if (!audio || !sourceId || !isValidVideoId(sourceId)) return;
      userPausedRef.current = false;
      const traceId = createClientTraceId();
      setTraceId(traceId);
      const url = getAudioProxyUrl(sourceId, retryKeyRef.current);
      applyAudioSrc(url);
      audio.play().then(() => {
        clientLog({
          level: 'info',
          event: 'audio_playing',
          videoId: sourceId,
          traceId,
        });
      }).catch((err) => {
        clientLog({
          level: 'warn',
          event: 'audio_play_failed',
          videoId: sourceId,
          traceId,
          err: err instanceof Error ? err.message : String(err),
        });
      });
    },
    [applyAudioSrc],
  );

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

  const tryResumeAfterLoad = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const shouldPlay =
      pendingResumeRef.current || usePlayerStore.getState().isPlaying;
    if (!shouldPlay || !audio.paused) return;
    pendingResumeRef.current = false;
    usePlayerStore.setState({ isPlaying: true });
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    errorCountRef.current = 0;
    pendingResumeRef.current = false;
    setRetryKey(0);
    setPlaybackMode('audio');
    setPlayerReady(false);
    setAudioSrc(null);
    clearSeekVerifyTimer();
    clearRetryTimer();
    pendingSeekRef.current = null;
    seekFailCountRef.current = 0;
  }, [playEpoch, setPlayerReady, clearSeekVerifyTimer, clearRetryTimer]);

  useEffect(() => {
    if (!currentTrack || playbackMode !== 'audio') return;
    if (!isValidVideoId(currentTrack.sourceId)) {
      skipOnError();
      return;
    }
    const traceId = createClientTraceId();
    setTraceId(traceId);
    clientLog({
      level: 'info',
      event: 'play_start',
      traceId,
      videoId: currentTrack.sourceId,
      trackId: currentTrack.id,
      meta: { retryKey },
    });
    applyAudioSrc(getAudioProxyUrl(currentTrack.sourceId, retryKey));
  }, [currentTrack, retryKey, playbackMode, playEpoch, skipOnError, applyAudioSrc]);

  useEffect(() => {
    registerPlayerController({
      playFromGesture: playAudioFromGesture,
      pauseFromUser: () => {
        userPausedRef.current = true;
        pendingResumeRef.current = false;
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
    if (!audio || !audioSrc || !playerReady) return;
    if (isPlaying) {
      userPausedRef.current = false;
      audio.play().then(() => {
        clientLog({
          level: 'info',
          event: 'audio_playing',
          videoId: currentTrack?.sourceId,
          trackId: currentTrack?.id,
        });
      }).catch((err) => {
        clientLog({
          level: 'warn',
          event: 'audio_play_failed',
          videoId: currentTrack?.sourceId,
          err: err instanceof Error ? err.message : String(err),
        });
      });
    } else {
      userPausedRef.current = true;
      audio.pause();
    }
  }, [isPlaying, audioSrc, playerReady, playbackMode, currentTrack?.id, currentTrack?.sourceId]);

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

  useEffect(
    () => () => {
      clearSeekVerifyTimer();
      clearRetryTimer();
    },
    [clearSeekVerifyTimer, clearRetryTimer],
  );

  const handleLoadedMetadata = () => {
    setPlayerReady(true);
    errorCountRef.current = 0;
    setPlaybackError(null);
    const audio = audioRef.current;
    const duration = audio?.duration ?? 0;
    clientLog({
      level: 'info',
      event: 'audio_loaded',
      videoId: currentTrack?.sourceId,
      trackId: currentTrack?.id,
      meta: {
        duration: Number.isFinite(duration) ? duration : 0,
        readyState: audio?.readyState ?? -1,
      },
    });
    if (Number.isFinite(duration) && duration > 0) {
      setPlayerDuration(duration);
    }
    applyPendingSeek();
    tryResumeAfterLoad();
  };

  const handleCanPlay = () => {
    if (!usePlayerStore.getState().playerReady) {
      setPlayerReady(true);
    }
    tryResumeAfterLoad();
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
    const audio = audioRef.current;
    if (audio?.src && errorSrcRef.current && audio.src !== errorSrcRef.current) {
      return;
    }
    const mediaError = audio?.error;

    clientLog({
      level: 'error',
      event: 'audio_error',
      videoId: currentTrack?.sourceId,
      trackId: currentTrack?.id,
      meta: {
        mediaErrorCode: mediaError?.code ?? -1,
        networkState: audio?.networkState ?? -1,
        readyState: audio?.readyState ?? -1,
        retryCount: errorCountRef.current + 1,
      },
      err: mediaError
        ? ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][mediaError.code] ?? 'unknown'
        : 'unknown',
    });

    if (usePlayerStore.getState().isPlaying) {
      pendingResumeRef.current = true;
    }

    errorCountRef.current += 1;
    if (errorCountRef.current >= MAX_RETRIES) {
      pendingResumeRef.current = false;
      setPlaybackError('לא ניתן לנגן');
      clientLog({
        level: 'error',
        event: 'audio_give_up',
        videoId: currentTrack?.sourceId,
        trackId: currentTrack?.id,
        meta: { retryCount: errorCountRef.current },
      });
      void sendDiagnosticReport();
      skipOnError();
      return;
    }

    clientLog({
      level: 'warn',
      event: 'audio_retry',
      videoId: currentTrack?.sourceId,
      meta: { attempt: errorCountRef.current },
    });

    clearRetryTimer();
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setRetryKey((k) => k + 1);
    }, RETRY_DELAY_MS);
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
        onCanPlay={handleCanPlay}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onDurationChange={handleDurationChange}
        onSeeked={handleSeeked}
        onEnded={() => playNext()}
        onError={handleAudioError}
      />
    </PlayerErrorBoundary>
  );
}
