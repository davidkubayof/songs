'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';
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
      <GlassPanel className="p-5 text-sm text-zinc-500">
        Sign in to join listening rooms
      </GlassPanel>
    );
  }

  if (roomId) {
    return (
      <GlassPanel className="flex flex-col gap-3 p-5">
        <p className="font-medium">{room?.name ?? 'Listening Room'}</p>
        <p className="text-xs text-zinc-400 break-all">ID: {roomId}</p>
        <p className="text-xs text-zinc-500">{isHost ? 'You are hosting' : 'Connected as listener'}</p>
        <button
          type="button"
          onClick={() => leaveRoom()}
          className="text-sm text-red-400 hover:underline"
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
