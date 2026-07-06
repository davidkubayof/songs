'use client';

import type { LogLevel, PlaybackLogEntry } from '@/lib/logger/types';

const BUFFER_SIZE = 100;
const STORAGE_KEY = 'songs-playback-logs';
const TRACE_KEY = 'songs-playback-trace';

const buffer: PlaybackLogEntry[] = [];
let currentTraceId: string | null = null;

function persistBuffer(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
  }
}

function loadBuffer(): void {
  if (buffer.length > 0) return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PlaybackLogEntry[];
    if (Array.isArray(parsed)) {
      buffer.push(...parsed.slice(-BUFFER_SIZE));
    }
  } catch {
  }
}

export function createClientTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function setTraceId(id: string): void {
  currentTraceId = id;
  try {
    sessionStorage.setItem(TRACE_KEY, id);
  } catch {
  }
}

export function getTraceId(): string | null {
  if (currentTraceId) return currentTraceId;
  try {
    currentTraceId = sessionStorage.getItem(TRACE_KEY);
  } catch {
  }
  return currentTraceId;
}

export function clientLog(
  entry: Omit<PlaybackLogEntry, 'ts' | 'domain'> & {
    domain?: PlaybackLogEntry['domain'];
  },
): void {
  loadBuffer();
  const payload: PlaybackLogEntry = {
    ts: new Date().toISOString(),
    domain: entry.domain ?? 'playback.player',
    traceId: entry.traceId ?? getTraceId() ?? undefined,
    ...entry,
  };
  buffer.push(payload);
  if (buffer.length > BUFFER_SIZE) {
    buffer.splice(0, buffer.length - BUFFER_SIZE);
  }
  persistBuffer();
}

export function getClientLogEntries(): PlaybackLogEntry[] {
  loadBuffer();
  return [...buffer];
}

function formatEntryLine(entry: PlaybackLogEntry): string {
  const time = entry.ts.slice(11, 19);
  const meta = entry.meta
    ? ' ' +
      Object.entries(entry.meta)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ')
    : '';
  const err = entry.err ? ` err=${entry.err}` : '';
  const vid = entry.videoId ? ` videoId=${entry.videoId}` : '';
  const tid = entry.trackId ? ` trackId=${entry.trackId}` : '';
  const trace = entry.traceId ? ` traceId=${entry.traceId}` : '';
  return `${time} ${entry.level.padEnd(5)} ${entry.domain} ${entry.event}${trace}${vid}${tid}${meta}${err}`;
}

export function getDiagnosticReport(): string {
  loadBuffer();
  const traceId = getTraceId() ?? 'none';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const isPwa =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const isIos = /iPhone|iPad|iPod/i.test(ua);

  const lines = [
    '=== Songs Playback Diagnostic ===',
    `time: ${new Date().toISOString()}`,
    `ua: ${ua}`,
    `pwa: ${isPwa}`,
    `ios: ${isIos}`,
    `traceId: ${traceId}`,
    '',
    '[CLIENT]',
    ...buffer.map(formatEntryLine),
    '',
    '[SERVER — search Vercel logs by traceId]',
  ];

  return lines.join('\n');
}

export async function sendDiagnosticReport(): Promise<void> {
  if (process.env.NEXT_PUBLIC_DIAG_ENABLED !== 'true') return;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const isPwa =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const isIos = /iPhone|iPad|iPod/i.test(ua);

  try {
    await fetch('/api/diag/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: getClientLogEntries(),
        userAgent: ua,
        isPwa,
        isIos,
        traceId: getTraceId(),
      }),
    });
  } catch {
  }
}
