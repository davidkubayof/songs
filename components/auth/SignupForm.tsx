'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { useAuthStore } from '@/store/useAuthStore';

export function SignupForm() {
  const router = useRouter();
  const signUpEmail = useAuthStore((s) => s.signUpEmail);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUpEmail(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
          placeholder="Password (min 6 chars)"
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <Link href="/auth/login" className="text-center text-xs text-zinc-400">
          Already have an account? Sign in
        </Link>
      </form>
    </GlassPanel>
  );
}
