'use client';

import Link from 'next/link';
import { useState } from 'react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { resetPassword } from '@/services/authService';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await resetPassword(email);
      setMessage('Check your email for a reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
        {message && <p className="text-sm text-green-400">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-white py-3 text-sm font-medium text-black"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <Link href="/auth/login" className="text-center text-xs text-zinc-400">
          Back to sign in
        </Link>
      </form>
    </GlassPanel>
  );
}
