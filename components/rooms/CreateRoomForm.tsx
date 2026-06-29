'use client';

import { useState } from 'react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { useRoomStore } from '@/store/useRoomStore';

export function CreateRoomForm() {
  const createRoom = useRoomStore((s) => s.createRoom);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createRoom(name.trim() || 'Listening Room');
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name"
          className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-white py-2.5 text-sm font-medium text-black"
        >
          {loading ? 'Creating...' : 'Host Room'}
        </button>
      </form>
    </GlassPanel>
  );
}
