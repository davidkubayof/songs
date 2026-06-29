'use client';

import { useRoomPublish } from '@/hooks/useRoomPublish';
import { useRoomSync } from '@/hooks/useRoomSync';

export function RoomSyncProvider() {
  useRoomSync();
  useRoomPublish();
  return null;
}
