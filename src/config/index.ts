/**
 * WHY `config/` exists:
 *
 * Environment differences are a *build-time* concern, not a runtime one.
 * `process.env.APP_ENV` is inlined by Babel
 * (`transform-inline-environment-variables`), so this switch collapses to a
 * constant at bundle time and the other two configs are dead-code-eliminated.
 * That means no environment string is shipped where it could be tampered with,
 * and no runtime lookup on a hot path.
 *
 * Usage:
 *   APP_ENV=staging npx react-native run-android --mode=release
 *
 * Everything reads the same frozen object:
 *   import { config } from '@config';
 */

import { developmentConfig } from './env/development';
import { productionConfig } from './env/production';
import { stagingConfig } from './env/staging';
import type { AppConfig, AppEnvironment } from './types';

const CONFIGS: Record<AppEnvironment, AppConfig> = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

function resolveEnvironment(): AppEnvironment {
  const raw = process.env.APP_ENV;

  if (raw === 'staging' || raw === 'production' || raw === 'development') {
    return raw;
  }

  // Unset APP_ENV means a plain `react-native run-*`, i.e. a developer machine.
  // Defaulting to `production` here would be the dangerous choice: it would
  // silently point local debugging at live user data.
  return 'development';
}

export const APP_ENV: AppEnvironment = resolveEnvironment();

/** Frozen so a stray assignment can't reconfigure the app mid-session. */
export const config: AppConfig = Object.freeze({ ...CONFIGS[APP_ENV] });

export const isDevelopment = APP_ENV === 'development';
export const isStaging = APP_ENV === 'staging';
export const isProduction = APP_ENV === 'production';

export type { AppConfig, AppEnvironment, LogLevel } from './types';
