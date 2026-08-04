/**
 * Production.
 *
 * Everything that could leak internal detail or slow the app is off. Logging is
 * `error`-only: the logger still forwards those to crash reporting, but nothing
 * is written to the device console where it could expose PHI from a health
 * record payload.
 */

import type { AppConfig } from '../types';

export const productionConfig: AppConfig = {
  env: 'production',

  apiBaseUrl: 'https://api.amrutam.com/v1',
  apiTimeoutMs: 15_000,
  apiRetryCount: 2,

  logLevel: 'error',
  enableCrashReporting: true,
  enableAnalytics: true,
  enableDevTools: false,

  useMockData: false,
  enableOfflineCache: true,
  cacheTtlMs: 60 * 60 * 1000,
};
