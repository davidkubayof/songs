import type { RedactedStreamMeta } from '@/lib/logger/types';

export function redactStreamUrl(url: string): RedactedStreamMeta {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      itag: parsed.searchParams.get('itag'),
      client: parsed.searchParams.get('c'),
      hasCpn: parsed.searchParams.has('cpn'),
      hasRange: parsed.searchParams.has('range'),
      expire: parsed.searchParams.get('expire'),
    };
  } catch {
    return {
      host: 'invalid',
      itag: null,
      client: null,
      hasCpn: false,
      hasRange: false,
      expire: null,
    };
  }
}
