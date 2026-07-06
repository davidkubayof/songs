import {
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_ATTEMPTS,
} from '@/constants/music';
import { logPlayback } from '@/lib/logger/server';

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  traceId?: string;
  domain?: string;
}

export function isNoStreamingDataError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes('streaming data not available');
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  if (isNoStreamingDataError(error)) return false;
  if (msg.includes('400') || msg.includes('401') || msg.includes('404')) {
    return false;
  }
  const code = (error as NodeJS.ErrnoException).code;
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
    return true;
  }
  return msg.includes('network') || msg.includes('timeout') || msg.includes('5');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? RETRY_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? RETRY_BASE_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const err = error instanceof Error ? error.message : String(error);
      if (!isRetryable(error) || attempt === maxAttempts) {
        if (attempt === maxAttempts) {
          logPlayback({
            level: 'error',
            domain: 'playback.resolve',
            event: 'retry_exhausted',
            traceId: options.traceId,
            meta: {
              attempt,
              maxAttempts,
              context: options.domain ?? 'retry',
            },
            err,
          });
        }
        break;
      }
      logPlayback({
        level: 'warn',
        domain: 'playback.resolve',
        event: 'retry_attempt',
        traceId: options.traceId,
        meta: {
          attempt,
          maxAttempts,
          context: options.domain ?? 'retry',
        },
        err,
      });
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
