import 'server-only';

import { BG, buildURL, getHeaders } from 'bgutils-js';
import type { BgConfig, WebPoSignalOutput } from 'bgutils-js';
import { JSDOM } from 'jsdom';
import { Innertube } from 'youtubei.js';

import { logPlayback } from '@/lib/logger/server';

type WebPoMinter = InstanceType<typeof BG.WebPoMinter>;

const PO_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo';
const BOTGUARD_TIMEOUT_MS = 10_000;

export type PoTokenSource = 'env' | 'minted' | 'cold_start';

export type PoTokenSession = {
  poToken: string;
  visitorData: string;
  expiresAt: number;
};

type MintContext = {
  visitorData: string;
  sessionPoToken: string;
  webPoMinter: WebPoMinter | null;
  isColdStart: boolean;
  isEnv: boolean;
  expiresAt: number;
};

let mintContext: MintContext | null = null;
let generationPromise: Promise<MintContext> | null = null;
let persistentDom: JSDOM | null = null;

function ensureDom(): void {
  if (!persistentDom) {
    persistentDom = new JSDOM();
    Object.assign(globalThis, {
      window: persistentDom.window,
      document: persistentDom.window.document,
    });
  }
}

async function fetchVisitorData(): Promise<string> {
  const bootstrap = await Innertube.create({ retrieve_player: false });
  const visitorData = bootstrap.session.context.client.visitorData;
  if (!visitorData) throw new Error('Could not get visitor data');
  return visitorData;
}

async function getFromEnv(): Promise<MintContext | null> {
  const poToken = process.env.YOUTUBE_PO_TOKEN?.trim();
  if (!poToken) return null;

  const visitorData =
    process.env.YOUTUBE_VISITOR_DATA?.trim() || (await fetchVisitorData());

  logPlayback({
    level: 'info',
    domain: 'playback.resolve',
    event: 'po_token_env_override',
    meta: {
      hasVisitorDataEnv: Boolean(process.env.YOUTUBE_VISITOR_DATA?.trim()),
    },
  });

  return {
    visitorData,
    sessionPoToken: poToken,
    webPoMinter: null,
    isColdStart: false,
    isEnv: true,
    expiresAt: Date.now() + PO_TOKEN_TTL_MS,
  };
}

function createBgConfig(visitorData: string): BgConfig {
  ensureDom();
  return {
    fetch: (input, init) => fetch(input, init),
    globalObj: globalThis,
    identifier: visitorData,
    requestKey: REQUEST_KEY,
    useYouTubeAPI: true,
  };
}

async function mintWithBotGuard(
  visitorData: string,
): Promise<{ sessionPoToken: string; webPoMinter: WebPoMinter }> {
  const bgConfig = createBgConfig(visitorData);
  const globalObj = globalThis as Record<string, unknown>;

  const bgChallenge = await BG.Challenge.create(bgConfig);
  if (!bgChallenge) throw new Error('Could not get challenge');

  const interpreterJavascript =
    bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
  if (!interpreterJavascript) throw new Error('Could not load VM');

  new Function(interpreterJavascript)();

  const botguard = await BG.BotGuardClient.create({
    program: bgChallenge.program,
    globalName: bgChallenge.globalName,
    globalObj,
  });

  const webPoSignalOutput: WebPoSignalOutput = [];
  const botguardResponse = await botguard.snapshot({ webPoSignalOutput }, BOTGUARD_TIMEOUT_MS);

  const integrityResponse = await fetch(buildURL('GenerateIT', true), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify([REQUEST_KEY, botguardResponse]),
  });

  const integrityTokenJson = (await integrityResponse.json()) as [
    string,
    number,
    number,
    string,
  ];

  const integrityTokenData = {
    integrityToken: integrityTokenJson[0],
    estimatedTtlSecs: integrityTokenJson[1],
    mintRefreshThreshold: integrityTokenJson[2],
    websafeFallbackToken: integrityTokenJson[3],
  };

  const webPoMinter = await BG.WebPoMinter.create(integrityTokenData, webPoSignalOutput);
  const sessionPoToken = await webPoMinter.mintAsWebsafeString(visitorData);

  return { sessionPoToken, webPoMinter };
}

async function createColdStartContext(visitorData: string): Promise<MintContext> {
  logPlayback({
    level: 'warn',
    domain: 'playback.resolve',
    event: 'po_token_cold_start',
    meta: { reason: 'botguard_mint_failed' },
  });
  return {
    visitorData,
    sessionPoToken: BG.PoToken.generateColdStartToken(visitorData),
    webPoMinter: null,
    isColdStart: true,
    isEnv: false,
    expiresAt: Date.now() + PO_TOKEN_TTL_MS,
  };
}

async function generateMintContext(allowColdStart: boolean): Promise<MintContext> {
  const visitorData = await fetchVisitorData();

  try {
    const { sessionPoToken, webPoMinter } = await mintWithBotGuard(visitorData);

    logPlayback({
      level: 'info',
      domain: 'playback.resolve',
      event: 'po_token_minted',
    });

    return {
      visitorData,
      sessionPoToken,
      webPoMinter,
      isColdStart: false,
      isEnv: false,
      expiresAt: Date.now() + PO_TOKEN_TTL_MS,
    };
  } catch (error) {
    if (allowColdStart) {
      return createColdStartContext(visitorData);
    }
    const err = error instanceof Error ? error.message : String(error);
    logPlayback({
      level: 'error',
      domain: 'playback.resolve',
      event: 'po_token_mint_failed',
      err,
    });
    throw error;
  }
}

async function getMintContext(
  forceRefresh = false,
  allowColdStart = false,
): Promise<MintContext> {
  const fromEnv = await getFromEnv();
  if (fromEnv && !forceRefresh) return fromEnv;

  if (mintContext && !forceRefresh && Date.now() < mintContext.expiresAt) {
    return mintContext;
  }

  if (generationPromise && !forceRefresh) {
    return generationPromise;
  }

  generationPromise = generateMintContext(allowColdStart)
    .then((context) => {
      mintContext = context;
      generationPromise = null;
      return context;
    })
    .catch((error) => {
      generationPromise = null;
      throw error;
    });

  return generationPromise;
}

export function getPoTokenSource(): PoTokenSource {
  if (process.env.YOUTUBE_PO_TOKEN?.trim()) return 'env';
  if (!mintContext) return 'minted';
  if (mintContext.isColdStart) return 'cold_start';
  return 'minted';
}

export async function getSessionPoToken(
  forceRefresh = false,
  allowColdStart = false,
): Promise<{ poToken: string; visitorData: string }> {
  const ctx = await getMintContext(forceRefresh, allowColdStart);
  return { poToken: ctx.sessionPoToken, visitorData: ctx.visitorData };
}

export async function getVideoPoToken(
  videoId: string,
  options: { forceRefresh?: boolean; allowColdStart?: boolean } = {},
): Promise<string> {
  const ctx = await getMintContext(options.forceRefresh ?? false, options.allowColdStart ?? false);

  if (ctx.webPoMinter) {
    return ctx.webPoMinter.mintAsWebsafeString(videoId);
  }

  return ctx.sessionPoToken;
}

export async function getPoTokenSession(
  forceRefresh = false,
  allowColdStart = false,
): Promise<PoTokenSession> {
  const ctx = await getMintContext(forceRefresh, allowColdStart);
  return {
    poToken: ctx.sessionPoToken,
    visitorData: ctx.visitorData,
    expiresAt: ctx.expiresAt,
  };
}

export function invalidatePoTokenSession(): void {
  if (process.env.YOUTUBE_PO_TOKEN?.trim()) return;
  mintContext = null;
  generationPromise = null;
}
