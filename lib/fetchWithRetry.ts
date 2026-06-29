const RETRY_DELAYS = [400, 800, 1200];

export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  let last: Response | null = null;

  for (let i = 0; i < RETRY_DELAYS.length; i++) {
    const res = await fetch(input, init);
    if (res.ok) return res;
    last = res;
    await new Promise((r) => setTimeout(r, RETRY_DELAYS[i]));
  }

  return last ?? fetch(input, init);
}
