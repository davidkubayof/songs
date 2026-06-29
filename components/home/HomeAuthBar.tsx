'use client';

import Link from 'next/link';

import { useAuthStore } from '@/store/useAuthStore';

export function HomeAuthBar() {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  if (role === 'Guest') {
    return (
      <Link
        href="/auth/login"
        className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
      >
        Sign in to sync your library
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-zinc-400">
      <span>{user?.email}</span>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{role}</span>
      <button type="button" onClick={() => signOut()} className="hover:text-white">
        Sign out
      </button>
    </div>
  );
}
