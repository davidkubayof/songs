'use client';

import { Radio } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoomStore } from '@/store/useRoomStore';

import { CreateRoomForm } from '@/components/rooms/CreateRoomForm';
import { JoinRoomForm } from '@/components/rooms/JoinRoomForm';

export function RoomPanel() {
  const role = useAuthStore((s) => s.role);
  const room = useRoomStore((s) => s.room);
  const roomId = useRoomStore((s) => s.roomId);
  const isHost = useRoomStore((s) => s.isHost);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);

  if (role === 'Guest') {
    return (
      <GlassPanel>
        <EmptyState
          icon={Radio}
          title="Sign in required"
          description="Create or join a listening room with friends in real time."
        />
      </GlassPanel>
    );
  }

  if (roomId) {
    return (
      <GlassPanel className="flex flex-col gap-3 p-5">
        <p className="font-medium">{room?.name ?? 'Listening Room'}</p>
        <p className="text-xs text-zinc-400 break-all">Room ID: {roomId}</p>
        <p className="text-xs text-violet-300/80">
          {isHost ? 'Hosting — playback syncs to listeners' : 'Listening live'}
        </p>
        <button
          type="button"
          onClick={() => leaveRoom()}
          className="mt-2 text-sm text-red-400 hover:underline"
        >
          Leave room
        </button>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(role === 'PremiumUser' || role === 'Admin') && <CreateRoomForm />}
      <JoinRoomForm />
    </div>
  );
}
