'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Copy, Radio } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const copyRoomId = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === 'Guest') {
    return (
      <GlassPanel>
        <EmptyState
          icon={Radio}
          title="Sign in required"
          description="Create or join a listening room with friends in real time."
          action={
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-violet-300 hover:underline"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm text-zinc-400 hover:underline"
              >
                Create Account
              </Link>
            </div>
          }
        />
      </GlassPanel>
    );
  }

  if (roomId) {
    return (
      <GlassPanel className="flex flex-col gap-3 p-5">
        <p className="font-medium">{room?.name ?? 'Listening Room'}</p>
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-xs text-zinc-400 break-all">Room ID: {roomId}</p>
          <button
            type="button"
            onClick={copyRoomId}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
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
