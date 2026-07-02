import { NextRequest, NextResponse } from 'next/server';

import { isValidVideoId, resolveAudioStreamUrl } from '@/services/YoutubeStreamService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const YOUTUBE_UPSTREAM_HEADERS: HeadersInit = {
  Referer: 'https://www.youtube.com/',
  Origin: 'https://www.youtube.com',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  if (!isValidVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  try {
    const { url, mimeType } = await resolveAudioStreamUrl(videoId);

    const upstreamHeaders: Record<string, string> = {
      ...(YOUTUBE_UPSTREAM_HEADERS as Record<string, string>),
    };
    const range = request.headers.get('range');
    if (range) {
      upstreamHeaders['Range'] = range;
    }

    const upstream = await fetch(url, { headers: upstreamHeaders });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', mimeType);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'no-store, no-cache');

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[proxy]', videoId, error);
    }
    return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
  }
}
