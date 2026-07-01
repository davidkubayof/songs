'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { useAuthStore } from '@/store/useAuthStore';

export function LoginForm() {
  const router = useRouter();
  const signInEmail = useAuthStore((s) => s.signInEmail);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInEmail(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-white py-3 text-sm font-medium text-black"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <Link href="/auth/forgot-password" className="text-center text-xs text-zinc-400">
          Forgot password?
        </Link>
        <Link href="/auth/signup" className="text-center text-xs text-zinc-400">
          Don&apos;t have an account? Sign up
        </Link>
      </form>
    </GlassPanel>
  );
}
