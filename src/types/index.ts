/**
 * WHY `types/` exists:
 *
 * Structural types shared across layers — `Result`, `Entity`, `AsyncState`,
 * the API envelope. Things with no domain meaning.
 *
 * Domain entities (Doctor, Product, HealthRecord, CartItem, Booking) do NOT
 * live here. They live in `@models`, which is a deliberately separate folder:
 * mixing "what shape is a paginated response" with "what is a prescription"
 * in one barrel produces a god-module every file imports.
 *
 * The rule: `@app-types` is structure, `@models` is domain, and a module's own
 * `types/` is anything only that module cares about.
 *
 * Aliased as `@app-types` (not `@types`) so it can never be confused with the
 * `@types/*` scope in node_modules.
 */

export * from './common.types';
export * from './api.types';
