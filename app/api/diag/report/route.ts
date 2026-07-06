import { NextRequest, NextResponse } from 'next/server';

import { logPlayback } from '@/lib/logger/server';
import type { PlaybackLogEntry } from '@/lib/logger/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  let body: {
    entries?: PlaybackLogEntry[];
    userAgent?: string;
    isPwa?: boolean;
    isIos?: boolean;
    traceId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const entries = Array.isArray(body.entries) ? body.entries.slice(-100) : [];
  const errorCount = entries.filter((e) => e.level === 'error').length;
  const warnCount = entries.filter((e) => e.level === 'warn').length;
  const traceIds = [
    ...new Set(
      entries
        .map((e) => e.traceId)
        .filter((id): id is string => Boolean(id)),
    ),
  ].slice(0, 5);

  logPlayback({
    level: 'info',
    domain: 'playback.diag',
    event: 'diag_report_received',
    traceId: body.traceId,
    meta: {
      entryCount: entries.length,
      errorCount,
      warnCount,
      traceIds: traceIds.join(','),
      isPwa: body.isPwa ?? false,
      isIos: body.isIos ?? false,
      userAgent: body.userAgent?.slice(0, 80) ?? null,
      ip,
    },
  });

  return NextResponse.json({ ok: true });
}
