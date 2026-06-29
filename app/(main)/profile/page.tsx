'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { GlassPanel } from '@/components/ui/GlassPanel';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);

  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Your account settings</p>
      </header>
      <GlassPanel className="flex flex-col gap-3 p-6 text-sm">
        <div className="flex justify-between border-b border-white/5 pb-3">
          <span className="text-zinc-500">Email</span>
          <span>{user?.email ?? '—'}</span>
        </div>
        <div className="flex justify-between border-b border-white/5 pb-3">
          <span className="text-zinc-500">Display name</span>
          <span>{profile?.displayName ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Role</span>
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
            {role}
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
