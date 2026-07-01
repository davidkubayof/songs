'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Music2 } from 'lucide-react';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { usePlayTrack } from '@/hooks/usePlayTrack';
import type { Track } from '@/types/Music';

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playTrack = usePlayTrack();
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithRetry(`/api/music/track?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const track = (await res.json()) as Track;
        if (cancelled) return;
        playTrack(track);
        router.replace('/');
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id, playTrack, router]);

  if (error) {
    return (
      <div className="px-4 pt-safe">
        <GlassPanel className="mt-8">
          <EmptyState
            icon={Music2}
            title="Track not found"
            description="This link may be invalid or the track is unavailable."
          />
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="px-4 pt-safe pt-8 text-center text-sm text-zinc-500">
      Loading track…
    </div>
  );
}
