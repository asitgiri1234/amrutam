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

  // ON in development because there is no backend yet. The repository layer
  // resolves to the mock implementation, so feature screens are built against
  // the real contract with 35,000 generated fixtures behind it. Flip to false
  // the day the dev API is reachable — nothing above the repository changes.
  useMockData: true,
  enableOfflineCache: true,
  cacheTtlMs: 5 * 60 * 1000,
};
