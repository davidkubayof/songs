'use client';

import { useState } from 'react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { useRoomStore } from '@/store/useRoomStore';

export function JoinRoomForm() {
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await joinRoom(roomId.trim());
      setRoomId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border border-white/10 py-2.5 text-sm hover:bg-white/5"
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </GlassPanel>
  );
}
