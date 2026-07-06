import { NextRequest, NextResponse } from 'next/server';

import {
  invalidateStreamCache,
  isValidVideoId,
  resolveAudioStreamUrl,
} from '@/services/YoutubeStreamService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STREAM_HEADERS: Record<string, string> = {
  accept: '*/*',
  origin: 'https://www.youtube.com',
  referer: 'https://www.youtube.com',
  DNT: '?1',
};

function isUpstreamOk(status: number): boolean {
  return status === 200 || status === 206;
}

function applyRangeToUrl(url: string, rangeHeader: string | null): string {
  if (!rangeHeader) return url;
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/i);
  if (!match) return url;
  const start = match[1] || '0';
  const end = match[2];
  const rangeValue = end ? `${start}-${end}` : `${start}-`;
  const parsed = new URL(url);
  parsed.searchParams.set('range', rangeValue);
  return parsed.toString();
}

async function fetchUpstream(url: string, rangeHeader: string | null): Promise<Response> {
  const fetchUrl = applyRangeToUrl(url, rangeHeader);
  return fetch(fetchUrl, { headers: STREAM_HEADERS, redirect: 'follow' });
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
