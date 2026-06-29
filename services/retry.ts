import {
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_ATTEMPTS,
} from '@/constants/music';

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
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
      if (!isRetryable(error) || attempt === maxAttempts) break;
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
