/**
 * The axios instance.
 *
 * WHY a factory plus a singleton: the singleton is what the app uses; the
 * factory is what tests and future secondary hosts (a CDN, a payments
 * provider) use. Exporting only a singleton makes the transport untestable
 * without global mocks.
 *
 * Interceptor order is deliberate — axios runs response interceptors in
 * registration order, so this reads outermost-first:
 *   logging  (sees the final outcome, including retried attempts)
 *   retry    (re-issues before auth sees a transient 500)
 *   auth     (innermost: refreshes and replays a single 401)
 */

import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';

import { config as appConfig } from '@config';

import { attachAuthInterceptor } from './interceptors/auth.interceptor';
import { attachLoggingInterceptor } from './interceptors/logging.interceptor';
import { attachRetryInterceptor } from './interceptors/retry.interceptor';

export interface CreateApiClientOptions {
  baseURL?: string;
  timeoutMs?: number;
  retries?: number;
  /** Off for third-party hosts that must not receive our bearer token. */
  withAuth?: boolean;
  axiosDefaults?: CreateAxiosDefaults;
}

export function createApiClient(
  options: CreateApiClientOptions = {},
): AxiosInstance {
  const {
    baseURL = appConfig.apiBaseUrl,
    timeoutMs = appConfig.apiTimeoutMs,
    retries = appConfig.apiRetryCount,
    withAuth = true,
    axiosDefaults,
  } = options;

  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Client-Platform': 'mobile',
    },
    ...axiosDefaults,
  });

  attachLoggingInterceptor(client);
  attachRetryInterceptor(client, retries);

  if (withAuth) {
    attachAuthInterceptor(client);
  }

  return client;
}

/** The app-wide client. Repositories use this; nothing else should. */
export const apiClient = createApiClient();
