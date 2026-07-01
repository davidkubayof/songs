'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { createClient } from '@/lib/supabase';
import { updatePassword } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export function ResetPasswordForm() {
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
      setSessionChecked(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      await initialize();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <GlassPanel className="p-6">
        <p className="text-sm text-zinc-400">Loading...</p>
      </GlassPanel>
    );
  }

  if (!hasSession) {
    return (
      <GlassPanel className="p-6">
        <p className="text-sm text-red-400">Invalid or expired reset link.</p>
        <Link href="/auth/forgot-password" className="mt-4 block text-center text-xs text-zinc-400">
          Request a new reset link
        </Link>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 6 chars)"
          minLength={6}
          required
          className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          minLength={6}
          required
          className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-white py-3 text-sm font-medium text-black"
        >
          {loading ? 'Updating...' : 'Set New Password'}
        </button>
      </form>
    </GlassPanel>
  );
}
