'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { CopyDiagnosticButton, isDiagnosticEnabled } from '@/components/diagnostic/CopyDiagnosticButton';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  if (isLoading) {
    return (
      <div className="px-4 pt-safe pt-4 text-sm text-zinc-500">Loading profile…</div>
    );
  }

  if (role === 'Guest') {
    return (
      <div className="flex flex-col gap-6 px-4 pt-safe">
        <header className="pt-4">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-zinc-400">Sign in to manage your account</p>
        </header>
        <GlassPanel className="p-6 text-center text-sm">
          <User className="mx-auto mb-3 h-10 w-10 text-zinc-500" />
          <p className="text-zinc-400">You are browsing as a guest</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-400"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"
            >
              Create Account
            </Link>
          </div>
        </GlassPanel>
        {isDiagnosticEnabled && (
          <GlassPanel className="p-6">
            <CopyDiagnosticButton className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white" />
          </GlassPanel>
        )}
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDisplayName(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-safe">
      <header className="pt-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Your account settings</p>
      </header>
      <GlassPanel className="flex flex-col items-center gap-4 p-6">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800">
          {profile?.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-10 w-10 text-zinc-500" />
            </div>
          )}
        </div>
        <span className="rounded-full bg-violet-500/20 px-3 py-0.5 text-xs text-violet-200">
          {role}
        </span>
      </GlassPanel>
      <GlassPanel className="flex flex-col gap-4 p-6 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-zinc-500">Email</span>
          <span>{user?.email ?? '—'}</span>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="display-name" className="text-zinc-500">
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-violet-400"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || name.trim() === (profile?.displayName ?? '')}
            className="mt-1 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </GlassPanel>
      {isDiagnosticEnabled && (
        <GlassPanel className="p-6">
          <CopyDiagnosticButton className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white" />
        </GlassPanel>
      )}
      <div className="flex flex-col gap-2">
        {role === 'Admin' && (
          <Link
            href="/admin"
            className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm hover:bg-white/5"
          >
            Admin Dashboard
          </Link>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-red-400 hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
