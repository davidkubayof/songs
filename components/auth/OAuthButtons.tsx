'use client';

import { useAuthStore } from '@/store/useAuthStore';

export function OAuthButtons() {
  const signInGoogle = useAuthStore((s) => s.signInGoogle);

  return (
    <button
      type="button"
      onClick={() => signInGoogle()}
      className="w-full rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5"
    >
      Continue with Google
    </button>
  );
}
