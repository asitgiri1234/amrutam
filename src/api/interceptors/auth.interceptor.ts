/**
 * Auth interceptor — attaches the bearer token and handles 401 refresh.
 *
 * WHY the single-flight refresh matters: when a token expires, a screen with
 * five parallel queries produces five simultaneous 401s. Naively refreshing in
 * each one fires five refresh calls, four of which use an already-rotated
 * refresh token and get rejected — logging the user out mid-session. The
 * `pendingRefresh` promise ensures exactly one refresh happens and the other
 * four requests wait for it.
 *
 * The refresh *implementation* is injected rather than imported. `api/` must
 * not depend on an auth module that does not exist yet, and this keeps the
 * dependency arrow pointing the right way when it does.
 */

import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

import { logger } from '@utils/logger';

import { ApiError, normalizeError } from '../errors';

const log = logger.scoped('api:auth');

/** Supplied at bootstrap by the auth module. */
export interface AuthTokenProvider {
  getAccessToken(): string | undefined;
  /** Resolves with a fresh access token, or `null` if refresh is impossible. */
  refresh(): Promise<string | null>;
  /** Called when refresh fails — the session is unrecoverable. */
  onSessionExpired(): void;
}

/** Requests that must not carry a token (login, refresh, public content). */
interface AuthAwareConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  /** Guards against an infinite retry loop when the refreshed token is also
   *  rejected. */
  hasRetriedAfterRefresh?: boolean;
}

let tokenProvider: AuthTokenProvider | null = null;
let pendingRefresh: Promise<string | null> | null = null;

export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  tokenProvider = provider;
}

function refreshOnce(): Promise<string | null> {
  if (pendingRefresh !== null) {
    return pendingRefresh;
  }

  const provider = tokenProvider;
  if (provider === null) {
    return Promise.resolve(null);
  }

  pendingRefresh = provider
    .refresh()
    .catch(error => {
      log.warn('Token refresh failed', error);
      return null;
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

export function attachAuthInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use(config => {
    const typed = config as AuthAwareConfig;

    if (typed.skipAuth === true) {
      return config;
    }

    const token = tokenProvider?.getAccessToken();
    if (token !== undefined && token.length > 0) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  });

  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const normalized = normalizeError(error);
      const config = error.config as AuthAwareConfig | undefined;

      const shouldAttemptRefresh =
        normalized.kind === 'unauthorized' &&
        normalized.status === 401 &&
        config !== undefined &&
        config.skipAuth !== true &&
        config.hasRetriedAfterRefresh !== true &&
        tokenProvider !== null;

      if (!shouldAttemptRefresh || config === undefined) {
        throw normalized;
      }

      const freshToken = await refreshOnce();

      if (freshToken === null) {
        tokenProvider?.onSessionExpired();
        throw new ApiError({
          kind: 'unauthorized',
          message: 'Session expired',
          status: 401,
          cause: error,
        });
      }

      config.hasRetriedAfterRefresh = true;
      config.headers.set('Authorization', `Bearer ${freshToken}`);

      return client.request(config);
    },
  );
}

/** Test seam — resets module state between cases. */
export function __resetAuthInterceptor(): void {
  tokenProvider = null;
  pendingRefresh = null;
}
