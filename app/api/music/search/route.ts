import { NextResponse } from 'next/server';

import { getMusicService } from '@/services/createMusicService';
import { logPlayback, withTiming } from '@/lib/logger/server';
import { MusicServiceError } from '@/types/Music';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';

  if (!query.trim()) {
    return NextResponse.json(
      { error: 'Missing query parameter: q' },
      { status: 400 },
    );
  }

  try {
    const { result: tracks, durationMs } = await withTiming(async () =>
      (await getMusicService()).search(query),
    );
    logPlayback({
      level: 'info',
      domain: 'playback.search',
      event: 'search_ok',
      durationMs,
      meta: {
        queryLength: query.length,
        resultCount: tracks.length,
      },
    });
    return NextResponse.json(tracks);
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    if (error instanceof MusicServiceError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 502;
      logPlayback({
        level: 'error',
        domain: 'playback.search',
        event: 'search_fail',
        err,
        meta: { code: error.code },
      });
      return NextResponse.json({ error: error.message }, { status });
    }
    logPlayback({
      level: 'error',
      domain: 'playback.search',
      event: 'search_fail',
      err,
    });
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
