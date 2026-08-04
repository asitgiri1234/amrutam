/**
 * Retry interceptor — bounded exponential backoff for transient failures.
 *
 * WHY at the transport layer rather than in React Query: React Query retries
 * *queries*, but mutations, prefetches and the offline queue all go through
 * axios too. Putting it here means one policy governs every call.
 *
 * Two safety rails that are easy to get wrong:
 *   - Only idempotent methods retry automatically. A retried POST can create a
 *     duplicate order. Non-idempotent calls retry only when the caller has
 *     supplied an `Idempotency-Key`.
 *   - Jitter is on. Without it, every request queued during an outage fires at
 *     the same millisecond when the network returns and takes the API down
 *     again.
 */

import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

import { logger } from '@utils/logger';
import {
  exponentialBackoff,
  isIdempotentMethod,
  isRetryableStatus,
  sleep,
} from '@utils/network';

import { normalizeError } from '../errors';

const log = logger.scoped('api:retry');

interface RetryableConfig extends InternalAxiosRequestConfig {
  /** Per-request override; falls back to the client default. */
  retries?: number;
  attempt?: number;
}

export function attachRetryInterceptor(
  client: AxiosInstance,
  defaultRetries: number,
): void {
  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const config = error.config as RetryableConfig | undefined;

      if (config === undefined) {
        throw normalizeError(error);
      }

      const maxRetries = config.retries ?? defaultRetries;
      const attempt = config.attempt ?? 0;

      const hasIdempotencyKey =
        config.headers?.get?.('Idempotency-Key') !== undefined &&
        config.headers.get('Idempotency-Key') !== null;

      const mayRetryMethod =
        isIdempotentMethod(config.method) || hasIdempotencyKey;

      const shouldRetry =
        attempt < maxRetries &&
        mayRetryMethod &&
        isRetryableStatus(error.response?.status);

      if (!shouldRetry) {
        throw normalizeError(error);
      }

      const delay = exponentialBackoff(attempt);
      config.attempt = attempt + 1;

      log.debug(
        `retrying ${config.method?.toUpperCase()} ${config.url} in ${delay}ms`,
        { attempt: config.attempt, maxRetries },
      );

      await sleep(delay);
      return client.request(config);
    },
  );
}
