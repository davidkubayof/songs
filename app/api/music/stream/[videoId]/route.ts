import { NextResponse } from 'next/server';

import { isValidVideoId, resolveAudioStreamUrl } from '@/services/YoutubeStreamService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  if (!isValidVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  try {
    const { url, mimeType } = await resolveAudioStreamUrl(videoId);
    if (!url.startsWith('https://')) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[stream]', videoId, 'invalid url');
      }
      return NextResponse.json({ error: 'Invalid stream url' }, { status: 502 });
    }
    return NextResponse.json({ url, mimeType });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[stream]', videoId, error);
    }
    return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
  }
}
