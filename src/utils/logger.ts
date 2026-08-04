/* eslint-disable no-console */
/**
 * The only sanctioned logging surface.
 *
 * WHY not raw `console.log`:
 *   1. **Level gating.** `config.logLevel` silences debug/info in production,
 *      so we don't pay string-formatting cost on release hot paths.
 *   2. **Redaction.** This is a health app. A stray `logger.debug('payload',
 *      response)` must never print a token or a diagnosis to the device log,
 *      which is readable by other tooling on a rooted device.
 *   3. **A single seam to crash reporting.** `setLogSink` lets the error
 *      service subscribe without `utils/` depending on `services/` — keeping
 *      the dependency graph pointing downward.
 */

import { config } from '@config';
import type { LogLevel } from '@config';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

/** Keys whose values are replaced with `[redacted]` anywhere in a logged
 *  object graph. Extend this list, never shorten it. */
const REDACTED_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'otp',
  'pin',
  'aadhaar',
  'ssn',
  'cardnumber',
  'cvv',
  'diagnosis',
  'prescription',
  'healthrecord',
]);

const REDACTED = '[redacted]';
const MAX_DEPTH = 6;

export interface LogEntry {
  level: Exclude<LogLevel, 'silent'>;
  scope: string;
  message: string;
  data: unknown[];
  timestamp: number;
}

/** Downstream consumer (crash reporting, remote log drain). */
export type LogSink = (entry: LogEntry) => void;

let sink: LogSink | null = null;

/** Registered once at bootstrap by `services/errorReporting`. */
export function setLogSink(next: LogSink | null): void {
  sink = next;
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return '[max depth]';
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => redact(item, depth + 1));
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEYS.has(key.toLowerCase())
      ? REDACTED
      : redact(item, depth + 1);
  }
  return result;
}

function shouldLog(level: Exclude<LogLevel, 'silent'>): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[config.logLevel];
}

function emit(
  level: Exclude<LogLevel, 'silent'>,
  scope: string,
  message: string,
  data: unknown[],
): void {
  const safeData = data.map(item => redact(item));

  // The sink always receives the entry (crash reporting wants breadcrumbs even
  // for levels we don't print); only the console output is level-gated.
  sink?.({ level, scope, message, data: safeData, timestamp: Date.now() });

  if (!shouldLog(level)) {
    return;
  }

  const prefix = `[${scope}]`;
  switch (level) {
    case 'error':
      console.error(prefix, message, ...safeData);
      break;
    case 'warn':
      console.warn(prefix, message, ...safeData);
      break;
    default:
      console.log(prefix, message, ...safeData);
  }
}

export interface Logger {
  debug(message: string, ...data: unknown[]): void;
  info(message: string, ...data: unknown[]): void;
  warn(message: string, ...data: unknown[]): void;
  error(message: string, ...data: unknown[]): void;
  /** Derive a child logger, e.g. `logger.scoped('api')`. */
  scoped(scope: string): Logger;
}

function createLogger(scope: string): Logger {
  return {
    debug: (message, ...data) => emit('debug', scope, message, data),
    info: (message, ...data) => emit('info', scope, message, data),
    warn: (message, ...data) => emit('warn', scope, message, data),
    error: (message, ...data) => emit('error', scope, message, data),
    scoped: child => createLogger(`${scope}:${child}`),
  };
}

export const logger = createLogger('app');

/** Exposed for tests that need to assert redaction behaviour. */
export const __testing = { redact };
