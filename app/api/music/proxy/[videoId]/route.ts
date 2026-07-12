import { NextRequest, NextResponse } from 'next/server';

import {
  invalidateStreamCache,
  isValidVideoId,
  resolveAudioStreamUrl,
} from '@/services/PipedStreamService';
import { redactStreamUrl } from '@/lib/logger/redact';
import { createTraceId, logPlayback, withTiming } from '@/lib/logger/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TRACE_HEADER = 'X-Playback-Trace-Id';

async function fetchUpstream(
  url: string,
  range: string | null,
): Promise<Response> {
  const headers: HeadersInit = {
    Accept: '*/*',
    'User-Agent': 'Mozilla/5.0 (compatible; SongsPWA/1.0)',
  };
  if (range) {
    headers['Range'] = range;
  }
  return fetch(url, { headers, signal: AbortSignal.timeout(60_000) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const clientTrace = request.nextUrl.searchParams.get('trace');
  const traceId = clientTrace ?? createTraceId();
  const range = request.headers.get('range');
  const userAgent = request.headers.get('user-agent')?.slice(0, 80) ?? null;

  if (!isValidVideoId(videoId)) {
    logPlayback({
      level: 'warn',
      domain: 'playback.proxy',
      event: 'proxy_invalid_video_id',
      traceId,
      videoId,
    });
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  logPlayback({
    level: 'info',
    domain: 'playback.proxy',
    event: 'proxy_request',
    traceId,
    videoId,
    meta: {
      hasRange: Boolean(range),
      clientTrace: clientTrace ?? null,
      userAgent,
      source: 'piped',
    },
  });

  let responseStatus = 500;

  try {
    let forceRefresh = false;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { result: resolved, durationMs: resolveMs } = await withTiming(() =>
        resolveAudioStreamUrl(videoId, traceId, { forceRefresh }),
      );
      const { url, mimeType, cacheHit, instance } = resolved;

      const streamMeta = redactStreamUrl(url);
      logPlayback({
        level: 'info',
        domain: 'playback.proxy',
        event: 'upstream_fetch',
        traceId,
        videoId,
        durationMs: resolveMs,
        meta: {
          cacheHit,
          attempt: attempt + 1,
          instance,
          ...streamMeta,
        },
      });

      const { result: upstream, durationMs: fetchMs } = await withTiming(() =>
        fetchUpstream(url, range),
      );

      if (upstream.ok || upstream.status === 206) {
        logPlayback({
          level: 'info',
          domain: 'playback.proxy',
          event: 'upstream_ok',
          traceId,
          videoId,
          durationMs: fetchMs,
          meta: {
            upstreamStatus: upstream.status,
            contentLength: upstream.headers.get('content-length'),
            cacheHit,
            resolveMs,
            attempt: attempt + 1,
            instance,
          },
        });

        responseStatus = upstream.status;

        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', mimeType);
        responseHeaders.set('Accept-Ranges', 'bytes');
        responseHeaders.set('Cache-Control', 'no-store, no-cache');
        responseHeaders.set(TRACE_HEADER, traceId);

        const contentLength = upstream.headers.get('content-length');
        if (contentLength) responseHeaders.set('Content-Length', contentLength);

        const contentRange = upstream.headers.get('content-range');
        if (contentRange) responseHeaders.set('Content-Range', contentRange);

        return new NextResponse(upstream.body, {
          status: upstream.status,
          headers: responseHeaders,
        });
      }

      const upstreamStatus = upstream.status;
      logPlayback({
        level: 'error',
        domain: 'playback.proxy',
        event: 'upstream_failed',
        traceId,
        videoId,
        durationMs: fetchMs,
        meta: {
          ...streamMeta,
          upstreamStatus,
          hasRange: Boolean(range),
          cacheHit,
          resolveMs,
          attempt: attempt + 1,
          instance,
        },
        err: upstream.statusText || 'upstream error',
      });

      if ((upstreamStatus === 403 || upstreamStatus >= 500) && attempt === 0) {
        invalidateStreamCache(videoId, `upstream_${upstreamStatus}`, traceId);
        forceRefresh = true;
        continue;
      }

      invalidateStreamCache(videoId, 'upstream_failed', traceId);
      responseStatus = 502;
      const errRes = NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
      errRes.headers.set(TRACE_HEADER, traceId);
      return errRes;
    }

    responseStatus = 502;
    const errRes = NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    errRes.headers.set(TRACE_HEADER, traceId);
    return errRes;
  } catch (error) {
    invalidateStreamCache(videoId, 'resolve_error', traceId);
    const err = error instanceof Error ? error.message : String(error);
    logPlayback({
      level: 'error',
      domain: 'playback.proxy',
      event: 'proxy_error',
      traceId,
      videoId,
      err,
    });
    responseStatus = 502;
    const errRes = NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    errRes.headers.set(TRACE_HEADER, traceId);
    return errRes;
  } finally {
    logPlayback({
      level: 'info',
      domain: 'playback.proxy',
      event: 'proxy_response',
      traceId,
      videoId,
      meta: { responseStatus },
    });
  }
}
