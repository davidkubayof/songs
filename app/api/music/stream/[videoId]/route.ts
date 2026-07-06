import { NextRequest, NextResponse } from 'next/server';

import { isValidVideoId, resolveAudioStreamUrl } from '@/services/YoutubeStreamService';
import { createTraceId, logPlayback } from '@/lib/logger/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TRACE_HEADER = 'X-Playback-Trace-Id';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const clientTrace = request.nextUrl.searchParams.get('trace');
  const traceId = clientTrace ?? createTraceId();

  if (!isValidVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  try {
    const { url, mimeType } = await resolveAudioStreamUrl(videoId, traceId);
    if (!url.startsWith('https://')) {
      logPlayback({
        level: 'error',
        domain: 'playback.resolve',
        event: 'stream_invalid_url',
        traceId,
        videoId,
      });
      const res = NextResponse.json({ error: 'Invalid stream url' }, { status: 502 });
      res.headers.set(TRACE_HEADER, traceId);
      return res;
    }
    const res = NextResponse.json({ url, mimeType });
    res.headers.set(TRACE_HEADER, traceId);
    return res;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logPlayback({
      level: 'error',
      domain: 'playback.resolve',
      event: 'stream_resolve_fail',
      traceId,
      videoId,
      err,
    });
    const res = NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    res.headers.set(TRACE_HEADER, traceId);
    return res;
  }
}
