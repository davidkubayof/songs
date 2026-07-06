import 'server-only';

import { BG } from 'bgutils-js';
import { JSDOM } from 'jsdom';
import { Innertube, ProtoUtils } from 'youtubei.js';

const PO_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo';

export type PoTokenSession = {
  poToken: string;
  visitorData: string;
  expiresAt: number;
};

let cached: PoTokenSession | null = null;
let generationPromise: Promise<PoTokenSession> | null = null;

function getFromEnv(): PoTokenSession | null {
  const poToken = process.env.YOUTUBE_PO_TOKEN?.trim();
  const visitorData = process.env.YOUTUBE_VISITOR_DATA?.trim();
  if (!poToken || !visitorData) return null;
  return { poToken, visitorData, expiresAt: Date.now() + PO_TOKEN_TTL_MS };
}

function setupDom(): { dom: JSDOM; globalObj: Record<string, unknown> } {
  const dom = new JSDOM();
  const globalObj = dom.window as unknown as Record<string, unknown>;
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
  });
  return { dom, globalObj };
}

async function loadInterpreterScript(
  dom: JSDOM,
  bgChallenge: NonNullable<
    Awaited<ReturnType<Innertube['getAttestationChallenge']>>['bg_challenge']
  >,
): Promise<void> {
  const safeScript =
    bgChallenge.interpreter_url.private_do_not_access_or_else_safe_script_wrapped_value;
  if (safeScript) {
    dom.window.eval(safeScript);
    return;
  }

  const interpreterUrl =
    bgChallenge.interpreter_url
      .private_do_not_access_or_else_trusted_resource_url_wrapped_value;
  if (!interpreterUrl) throw new Error('Could not get interpreter url');

  const bgScriptResponse = await fetch(`https:${interpreterUrl}`);
  const interpreterJavascript = await bgScriptResponse.text();
  if (!interpreterJavascript) throw new Error('Could not load VM');

  dom.window.eval(interpreterJavascript);
}

async function createColdStartSession(visitorData: string): Promise<PoTokenSession> {
  let identifier = visitorData;
  try {
    const decoded = ProtoUtils.decodeVisitorData(visitorData);
    if (decoded.id) identifier = decoded.id;
  } catch {
  }
  return {
    poToken: BG.PoToken.generateColdStartToken(identifier),
    visitorData,
    expiresAt: Date.now() + PO_TOKEN_TTL_MS,
  };
}

async function generatePoToken(): Promise<PoTokenSession> {
  const bootstrap = await Innertube.create({ retrieve_player: false });
  const visitorData = bootstrap.session.context.client.visitorData;
  if (!visitorData) throw new Error('Could not get visitor data');

  try {
    const { dom, globalObj } = setupDom();
    const challengeResponse = await bootstrap.getAttestationChallenge('ENGAGEMENT_TYPE_UNBOUND');
    const bgChallenge = challengeResponse.bg_challenge;
    if (!bgChallenge) throw new Error('Could not get challenge');

    await loadInterpreterScript(dom, bgChallenge);

    const poTokenResult = await BG.PoToken.generate({
      program: bgChallenge.program,
      globalName: bgChallenge.global_name,
      bgConfig: {
        fetch,
        globalObj,
        identifier: (() => {
          try {
            const decoded = ProtoUtils.decodeVisitorData(visitorData);
            return decoded.id ?? visitorData;
          } catch {
            return visitorData;
          }
        })(),
        requestKey: REQUEST_KEY,
      },
    });

    return {
      poToken: poTokenResult.poToken,
      visitorData,
      expiresAt: Date.now() + PO_TOKEN_TTL_MS,
    };
  } catch {
    return createColdStartSession(visitorData);
  }
}

export async function getPoTokenSession(forceRefresh = false): Promise<PoTokenSession> {
  const fromEnv = getFromEnv();
  if (fromEnv && !forceRefresh) return fromEnv;

  if (cached && !forceRefresh && Date.now() < cached.expiresAt) {
    return cached;
  }

  if (generationPromise && !forceRefresh) {
    return generationPromise;
  }

  generationPromise = generatePoToken()
    .then((session) => {
      cached = session;
      generationPromise = null;
      return session;
    })
    .catch(async () => {
      generationPromise = null;
      const bootstrap = await Innertube.create({ retrieve_player: false });
      const visitorData = bootstrap.session.context.client.visitorData;
      if (!visitorData) throw new Error('Could not get visitor data');
      const session = await createColdStartSession(visitorData);
      cached = session;
      return session;
    });

  return generationPromise;
}

export function invalidatePoTokenSession(): void {
  if (process.env.YOUTUBE_PO_TOKEN?.trim()) return;
  cached = null;
  generationPromise = null;
}
