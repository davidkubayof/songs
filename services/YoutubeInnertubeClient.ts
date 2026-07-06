import 'server-only';

import { Innertube, UniversalCache } from 'youtubei.js';

import {
  getSessionPoToken,
  invalidatePoTokenSession,
} from '@/services/YoutubePoTokenService';

let client: Innertube | null = null;
let clientSessionKey: string | null = null;

export async function getInnertube(
  forceRefresh = false,
  allowColdStart = false,
): Promise<Innertube> {
  if (forceRefresh) {
    resetInnertubeClient();
  }
  const session = await getSessionPoToken(forceRefresh, allowColdStart);
  const key = `${session.visitorData}:${session.poToken}`;
  if (client && clientSessionKey === key) return client;

  client = await Innertube.create({
    po_token: session.poToken,
    visitor_data: session.visitorData,
    generate_session_locally: true,
    cache: new UniversalCache(false),
  });
  clientSessionKey = key;
  return client;
}

export function resetInnertubeClient(): void {
  client = null;
  clientSessionKey = null;
}

export function resetInnertubeSession(): void {
  resetInnertubeClient();
  invalidatePoTokenSession();
}
