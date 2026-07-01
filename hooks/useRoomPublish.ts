'use client';

import { useEffect, useRef } from 'react';

import { createClient } from '@/lib/supabase';
import { createRoomService } from '@/services/SupabaseRoomService';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useRoomStore } from '@/store/useRoomStore';

const PUBLISH_MS = 400;

export function useRoomPublish(): void {
  const roomId = useRoomStore((s) => s.roomId);
  const isHost = useRoomStore((s) => s.isHost);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const isRemoteUpdate = usePlayerStore((s) => s.isRemoteUpdate);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!roomId || !isHost || isRemoteUpdate) return;

    if (timer.current) clearTimeout(timer.current);

    const publish = async () => {
      const supabase = createClient();
      const service = createRoomService(supabase);
      const effectivePosition = seekTarget ?? position;
      await service.updatePlayback(roomId, {
        currentTrack,
        position: effectivePosition,
        isPlaying,
      });
    };

    if (seekTarget != null) {
      void publish();
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    timer.current = setTimeout(() => void publish(), PUBLISH_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [roomId, isHost, currentTrack, isPlaying, position, seekTarget, isRemoteUpdate]);
}
