/**
 * Local development.
 *
 * Optimised for feedback speed and debuggability: verbose logs, devtools on,
 * no retries (a failing request should fail loudly and immediately, not after
 * three silent attempts), and no telemetry leaving the machine.
 */

import type { AppConfig } from '../types';

export const developmentConfig: AppConfig = {
  env: 'development',

  apiBaseUrl: 'https://api.dev.amrutam.internal/v1',
  apiTimeoutMs: 30_000,
  apiRetryCount: 0,

  logLevel: 'debug',
  enableCrashReporting: false,
  enableAnalytics: false,
  enableDevTools: true,

  useMockData: false,
  enableOfflineCache: true,
  cacheTtlMs: 5 * 60 * 1000,
};
