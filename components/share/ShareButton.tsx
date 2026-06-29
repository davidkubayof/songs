'use client';

import { Share2 } from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import type { Track } from '@/types/Music';

interface ShareButtonProps {
  track: Track;
}

export function ShareButton({ track }: ShareButtonProps) {
  const role = useAuthStore((s) => s.role);

  if (role === 'Guest') return null;

  const handleShare = async () => {
    const payload = { title: track.title, text: track.artist, url: track.streamUrl };
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
    await navigator.clipboard.writeText(track.streamUrl);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
      aria-label="Share track"
    >
      <Share2 className="h-4 w-4" />
      Share
    </button>
  );
}
