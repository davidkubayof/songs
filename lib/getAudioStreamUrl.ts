export function getStreamResolveEndpoint(sourceId: string, cacheBust = 0): string {
  const base = `/api/music/stream/${encodeURIComponent(sourceId)}`;
  return cacheBust > 0 ? `${base}?v=${cacheBust}` : base;
}

export function getAudioProxyUrl(sourceId: string, cacheBust = 0): string {
  const base = `/api/music/proxy/${encodeURIComponent(sourceId)}`;
  return cacheBust > 0 ? `${base}?v=${cacheBust}` : base;
}
