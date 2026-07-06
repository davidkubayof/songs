import { getTraceId } from '@/lib/logger/client';

function appendParams(base: string, params: Record<string, string | undefined>): string {
  const url = new URL(base, 'http://local');
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const qs = url.searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

export function getStreamResolveEndpoint(sourceId: string, cacheBust = 0): string {
  const base = `/api/music/stream/${encodeURIComponent(sourceId)}`;
  return appendParams(base, {
    v: cacheBust > 0 ? String(cacheBust) : undefined,
    trace: getTraceId() ?? undefined,
  });
}

export function getAudioProxyUrl(sourceId: string, cacheBust = 0): string {
  const base = `/api/music/proxy/${encodeURIComponent(sourceId)}`;
  return appendParams(base, {
    v: cacheBust > 0 ? String(cacheBust) : undefined,
    trace: getTraceId() ?? undefined,
  });
}
