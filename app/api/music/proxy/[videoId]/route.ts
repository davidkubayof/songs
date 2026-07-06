import { NextRequest, NextResponse } from 'next/server';

import {
  invalidateStreamCache,
  isValidVideoId,
  resolveAudioStreamUrl,
} from '@/services/YoutubeStreamService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const YOUTUBE_UPSTREAM_HEADERS: Record<string, string> = {
  accept: '*/*',
  origin: 'https://www.youtube.com',
  referer: 'https://www.youtube.com',
  DNT: '?1',
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

function isUpstreamOk(status: number): boolean {
  return status === 200 || status === 206;
}

async function fetchUpstream(url: string, range: string | null): Promise<Response> {
  const headers: Record<string, string> = { ...YOUTUBE_UPSTREAM_HEADERS };
  if (range) {
    headers.Range = range;
  }
  return fetch(url, { headers });
}

function buildStreamResponse(upstream: Response, mimeType: string): NextResponse {
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  if (!isValidVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  const range = request.headers.get('range');

  try {
    let { url, mimeType } = await resolveAudioStreamUrl(videoId);
    let upstream = await fetchUpstream(url, range);

    if (!isUpstreamOk(upstream.status)) {
      invalidateStreamCache(videoId);
      ({ url, mimeType } = await resolveAudioStreamUrl(videoId));
      upstream = await fetchUpstream(url, range);
    }

    if (!isUpstreamOk(upstream.status)) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[proxy]', videoId, 'upstream failed', upstream.status);
      }
      return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    }

    return buildStreamResponse(upstream, mimeType);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[proxy]', videoId, 'resolve failed', error);
    }
    return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
  }
}
