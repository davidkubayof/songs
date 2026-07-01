import { NextResponse } from 'next/server';

import { getMusicService } from '@/services/createMusicService';
import { MusicServiceError } from '@/types/Music';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? '';

  if (!id.trim()) {
    return NextResponse.json(
      { error: 'Missing query parameter: id' },
      { status: 400 },
    );
  }

  try {
    const track = await (await getMusicService()).getTrack(id);
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    return NextResponse.json(track);
  } catch (error) {
    if (error instanceof MusicServiceError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Failed to load track' }, { status: 500 });
  }
}
