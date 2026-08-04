/**
 * Transport-level helpers shared by the API client, the offline queue and the
 * sync manager.
 *
 * WHY here and not in `api/`: the offline queue needs the same retry maths and
 * the same "is this worth retrying?" judgement, and `offline/` must not depend
 * on `api/` (the queue is transport-agnostic by design). Putting the pure
 * functions in `utils/` keeps both consumers pointing downward.
 */

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Rejects with `reason` if `promise` has not settled within `ms`.
 * Note this does not *cancel* the underlying work — use an AbortSignal for
 * that. It only stops the caller waiting forever.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  reason = 'Request timed out',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(reason)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  }) as Promise<T>;
}

/** 5xx and 429 are worth another attempt; 4xx means *we* are wrong. */
export function isRetryableStatus(status: number | undefined): boolean {
  if (status === undefined) {
    // No status at all == the request never reached the server (DNS, socket,
    // airplane mode). Always worth retrying.
    return true;
  }
  return status === 408 || status === 429 || status >= 500;
}

/** Only methods with no side effects may be retried blindly. POST retries
 *  need an idempotency key, which the queue supplies. */
export function isIdempotentMethod(method: string | undefined): boolean {
  const normalised = (method ?? 'get').toLowerCase();
  return ['get', 'head', 'options', 'put', 'delete'].includes(normalised);
}

export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  /** Randomises the delay to avoid a thundering herd when connectivity
   *  returns and every queued mutation retries at the same instant. */
  jitter?: boolean;
}

export function exponentialBackoff(
  attempt: number,
  options: BackoffOptions = {},
): number {
  const { baseMs = 500, maxMs = 30_000, jitter = true } = options;

  const raw = Math.min(baseMs * 2 ** Math.max(0, attempt), maxMs);
  return jitter ? Math.round(raw * (0.5 + Math.random() * 0.5)) : raw;
}

export type QueryValue = string | number | boolean | null | undefined;

/**
 * Serialises a params object, dropping `null`/`undefined` and expanding arrays
 * to repeated keys (`?tag=a&tag=b`) — the convention our backend expects.
 */
export function buildQueryString(
  params: Record<string, QueryValue | QueryValue[]>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          search.append(key, String(item));
        }
      }
      continue;
    }
    search.append(key, String(value));
  }

  const serialised = search.toString();
  return serialised.length > 0 ? `?${serialised}` : '';
}

/** Joins URL segments without doubling or dropping slashes. */
export function joinUrl(...segments: string[]): string {
  return segments
    .filter(segment => segment.length > 0)
    .map((segment, index) =>
      index === 0
        ? segment.replace(/\/+$/, '')
        : segment.replace(/^\/+|\/+$/g, ''),
    )
    .filter(segment => segment.length > 0)
    .join('/');
}
