import { NextResponse } from 'next/server';

import {
  addServerTrack,
  getServerPlaylist,
} from '@/services/playlistMemory';
import type { Track } from '@/types/Music';

export async function GET() {
  return NextResponse.json(getServerPlaylist());
}

export async function POST(request: Request) {
  try {
    const track = (await request.json()) as Track;
    if (!track?.id || !track?.title) {
      return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
    }
    return NextResponse.json(addServerTrack(track), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
