/**
 * Staging / QA.
 *
 * Behaves like production (real retries, crash reporting, offline cache) but
 * keeps devtools and info-level logs so QA can attach useful detail to bug
 * reports. Analytics stays off so staging traffic never contaminates product
 * metrics.
 */

import type { AppConfig } from '../types';

export const stagingConfig: AppConfig = {
  env: 'staging',

  apiBaseUrl: 'https://api.staging.amrutam.com/v1',
  apiTimeoutMs: 20_000,
  apiRetryCount: 2,

  logLevel: 'info',
  enableCrashReporting: true,
  enableAnalytics: false,
  enableDevTools: true,

  useMockData: false,
  enableOfflineCache: true,
  cacheTtlMs: 15 * 60 * 1000,
};
