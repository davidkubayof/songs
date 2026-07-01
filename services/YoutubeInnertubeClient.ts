import 'server-only';

import { Innertube } from 'youtubei.js';

let client: Innertube | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (!client) client = await Innertube.create();
  return client;
}
