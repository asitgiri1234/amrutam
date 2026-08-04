/**
 * Logging interceptor — request/response timing and correlation.
 *
 * WHY it exists beyond `console.log`:
 *   - It measures duration, which is the number you actually want when a
 *     screen "feels slow" and you need to know whether it is the network or
 *     the render.
 *   - It stamps a client-side request id onto every call. When a user reports
 *     a bug, that id ties the device log to the server log.
 *   - It routes through `logger`, which redacts tokens and health data. A raw
 *     `console.log(config)` in a health app is a data-leak waiting to happen.
 *
 * Everything here is a no-op at `logLevel: 'error'` (production) except the
 * request id, which is cheap and always useful.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { logger } from '@utils/logger';

import { normalizeError } from '../errors';

const log = logger.scoped('api');

interface TimedConfig extends InternalAxiosRequestConfig {
  metadata?: { startedAt: number; requestId: string };
}

let counter = 0;

function nextRequestId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function attachLoggingInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use(config => {
    const typed = config as TimedConfig;
    const requestId = nextRequestId();

    typed.metadata = { startedAt: Date.now(), requestId };
    config.headers.set('X-Client-Request-Id', requestId);

    log.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, {
      requestId,
      params: config.params,
    });

    return config;
  });

  client.interceptors.response.use(
    response => {
      const typed = response.config as TimedConfig;
      const elapsed =
        typed.metadata === undefined
          ? 0
          : Date.now() - typed.metadata.startedAt;

      log.debug(`← ${response.status} ${response.config.url} (${elapsed}ms)`, {
        requestId: typed.metadata?.requestId,
      });

      return response;
    },
    (error: unknown) => {
      const normalized = normalizeError(error);

      // Cancellations are routine (screen unmounted mid-flight) and would
      // otherwise drown out real failures.
      if (normalized.kind !== 'cancelled') {
        log.warn(`✗ ${normalized.kind} ${normalized.status ?? ''}`, {
          message: normalized.message,
          code: normalized.code,
          requestId: normalized.requestId,
        });
      }

      throw normalized;
    },
  );
}
