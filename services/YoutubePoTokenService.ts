import 'server-only';

import { BG, buildURL, getHeaders } from 'bgutils-js';
import type { WebPoSignalOutput } from 'bgutils-js';
import { JSDOM } from 'jsdom';
import { Innertube, ProtoUtils } from 'youtubei.js';

import { logPlayback } from '@/lib/logger/server';

type WebPoMinter = InstanceType<typeof BG.WebPoMinter>;

const PO_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo';
const BOTGUARD_TIMEOUT_MS = 10_000;

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
let cachedInterpreterHash: string | null = null;

function getFromEnv(): MintContext | null {
  const poToken = process.env.YOUTUBE_PO_TOKEN?.trim();
  const visitorData = process.env.YOUTUBE_VISITOR_DATA?.trim();
  if (!poToken || !visitorData) return null;
  return {
    visitorData,
    sessionPoToken: poToken,
    webPoMinter: null,
    isColdStart: false,
    isEnv: true,
    expiresAt: Date.now() + PO_TOKEN_TTL_MS,
  };
}

function visitorIdentifier(visitorData: string): string {
  try {
    const decoded = ProtoUtils.decodeVisitorData(visitorData);
    return decoded.id ?? visitorData;
  } catch {
    return visitorData;
  }
}

function getPersistentDom(): { dom: JSDOM; globalObj: Record<string, unknown> } {
  if (!persistentDom) {
    persistentDom = new JSDOM();
    Object.assign(globalThis, {
      window: persistentDom.window,
      document: persistentDom.window.document,
    });
  }
  return {
    dom: persistentDom,
    globalObj: persistentDom.window as unknown as Record<string, unknown>,
  };
}

async function loadInterpreterScript(
  dom: JSDOM,
  bgChallenge: NonNullable<
    Awaited<ReturnType<Innertube['getAttestationChallenge']>>['bg_challenge']
  >,
): Promise<void> {
  const globalObj = dom.window as unknown as Record<string, unknown>;
  if (
    cachedInterpreterHash === bgChallenge.interpreter_hash &&
    globalObj[bgChallenge.global_name]
  ) {
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

  if (!globalObj[bgChallenge.global_name]) {
    throw new Error('VM not found');
  }

  cachedInterpreterHash = bgChallenge.interpreter_hash;
}

async function mintWithBotGuard(
  visitorData: string,
  bgChallenge: NonNullable<
    Awaited<ReturnType<Innertube['getAttestationChallenge']>>['bg_challenge']
  >,
): Promise<{ sessionPoToken: string; webPoMinter: WebPoMinter }> {
  const { dom, globalObj } = getPersistentDom();
  await loadInterpreterScript(dom, bgChallenge);

  const botguard = await BG.BotGuardClient.create({
    program: bgChallenge.program,
    globalName: bgChallenge.global_name,
    globalObj,
  });

  const webPoSignalOutput: WebPoSignalOutput = [];
  const botguardResponse = await botguard.snapshot({ webPoSignalOutput }, BOTGUARD_TIMEOUT_MS);

  const integrityResponse = await fetch(buildURL('GenerateIT', false), {
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
  const sessionPoToken = await webPoMinter.mintAsWebsafeString(visitorIdentifier(visitorData));

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
    sessionPoToken: BG.PoToken.generateColdStartToken(visitorIdentifier(visitorData)),
    webPoMinter: null,
    isColdStart: true,
    isEnv: false,
    expiresAt: Date.now() + PO_TOKEN_TTL_MS,
  };
}

async function generateMintContext(allowColdStart: boolean): Promise<MintContext> {
  const bootstrap = await Innertube.create({ retrieve_player: false });
  const visitorData = bootstrap.session.context.client.visitorData;
  if (!visitorData) throw new Error('Could not get visitor data');

  try {
    const challengeResponse = await bootstrap.getAttestationChallenge('ENGAGEMENT_TYPE_UNBOUND');
    const bgChallenge = challengeResponse.bg_challenge;
    if (!bgChallenge) throw new Error('Could not get challenge');

    const { sessionPoToken, webPoMinter } = await mintWithBotGuard(visitorData, bgChallenge);

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
  const fromEnv = getFromEnv();
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

  if (ctx.isColdStart) {
    logPlayback({
      level: 'warn',
      domain: 'playback.resolve',
      event: 'po_token_cold_start',
      videoId,
      meta: { forVideo: false },
    });
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
  cachedInterpreterHash = null;
}
