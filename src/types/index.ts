/**
 * WHY `types/` exists:
 *
 * Types that are genuinely *shared* across layers. Domain types (Doctor,
 * Product, HealthRecord) deliberately do NOT live here — they belong to their
 * module, next to the code that owns them. A global `types/` folder that
 * accumulates every entity becomes an unreviewable god-module that every file
 * imports, which defeats module boundaries entirely.
 *
 * The rule: if two unrelated layers both need it, it lives here. Otherwise it
 * lives with its owner.
 *
 * Aliased as `@app-types` (not `@types`) so it can never be confused with the
 * `@types/*` scope in node_modules.
 */

export * from './common.types';
export * from './api.types';
