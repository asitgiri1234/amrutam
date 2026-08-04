/**
 * WHY `utils/` exists:
 *
 * Pure, dependency-light functions that more than one feature needs. The bar
 * for landing something here is deliberately high:
 *
 *   1. It must be **pure** (or explicitly time/random-dependent and documented
 *      as such) — no React, no navigation, no network.
 *   2. It must have **at least two callers**, or an obvious second caller.
 *      One-off helpers belong next to their consumer.
 *   3. It must not import from `screens/`, `modules/` or `api/`. `utils/` sits
 *      at the bottom of the graph; everything may depend on it and it depends
 *      on almost nothing.
 *
 * Without rule 3 a "utils" folder inevitably becomes a junk drawer that
 * imports half the app and makes every test slow.
 */

export { logger, setLogSink } from './logger';
export type { Logger, LogEntry, LogSink } from './logger';

export { debounce } from './debounce';
export type { Debounced, DebounceOptions } from './debounce';

export { throttle } from './throttle';
export type { Throttled, ThrottleOptions } from './throttle';

export * from './date';
export * from './validation';
export * from './formatter';
export * from './network';
export * from './pagination';
