import { NextResponse } from 'next/server';

import { getMusicService } from '@/services/createMusicService';
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
    const tracks = await (await getMusicService()).search(query);
    return NextResponse.json(tracks);
  } catch (error) {
    if (error instanceof MusicServiceError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
