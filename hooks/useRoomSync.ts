'use client';

import { useEffect } from 'react';

import { createClient } from '@/lib/supabase';
import { mapRoomRow } from '@/services/roomMappers';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useRoomStore } from '@/store/useRoomStore';

export function useRoomSync(): void {
  const roomId = useRoomStore((s) => s.roomId);
  const setRoom = useRoomStore((s) => s.setRoom);
  const isHost = useRoomStore((s) => s.isHost);
  const applyRoomPlayback = usePlayerStore((s) => s.applyRoomPlayback);
  const clearRemoteFlag = usePlayerStore((s) => s.clearRemoteFlag);

  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listening_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = mapRoomRow(payload.new as Parameters<typeof mapRoomRow>[0]);
          setRoom(room, isHost);
          if (!isHost) {
            applyRoomPlayback(room.playback);
            setTimeout(clearRemoteFlag, 50);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost, setRoom, applyRoomPlayback, clearRemoteFlag]);
}
