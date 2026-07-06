import 'server-only';

import type { LogLevel, PlaybackLogEntry } from '@/lib/logger/types';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') {
    return env;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

export function createTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function logPlayback(
  entry: Omit<PlaybackLogEntry, 'ts'> & { ts?: string },
): void {
  const minLevel = getMinLevel();
  if (LEVEL_RANK[entry.level] < LEVEL_RANK[minLevel]) return;

  const payload: PlaybackLogEntry = {
    ...entry,
    ts: entry.ts ?? new Date().toISOString(),
  };

  const line = JSON.stringify(payload);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export async function withTiming<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}
