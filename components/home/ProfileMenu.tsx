'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, User } from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';

function AdminLink({ onClose }: { onClose: () => void }) {
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading || role !== 'Admin') return null;
  return (
    <Link
      href="/admin"
      className="block rounded-xl px-4 py-2.5 text-sm hover:bg-white/10"
      onClick={onClose}
    >
      Admin Dashboard
    </Link>
  );
}

export function ProfileMenu() {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
        aria-label="Profile menu"
      >
        <User className="h-5 w-5" />
      </button>
      {open && (
        <div className="glass absolute right-0 top-12 z-50 min-w-48 rounded-2xl p-2 shadow-xl">
          {role === 'Guest' ? (
            <Link
              href="/auth/login"
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/10"
              onClick={close}
            >
              Sign In
            </Link>
          ) : (
            <>
              <p className="truncate px-4 py-2 text-xs text-zinc-500">{user?.email}</p>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm hover:bg-white/10"
                onClick={close}
              >
                <Settings className="h-4 w-4" /> Profile
              </Link>
              <AdminLink onClose={close} />
              <button
                type="button"
                onClick={() => {
                  signOut();
                  close();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-400 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
