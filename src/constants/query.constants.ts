/**
 * React Query tuning + the query-key registry.
 *
 * WHY a central key factory: query keys are the cache's primary key. Typing
 * `['doctors', id]` by hand in a component and `['doctor', id]` in an
 * invalidation is a bug that produces stale UI with no error anywhere. A
 * factory makes the key structure a compile-time artefact and makes
 * "invalidate everything under doctors" a one-liner.
 *
 * Modules extend this object with their own namespace when they land; they do
 * not invent keys locally.
 */

/** Staleness tiers, chosen by how fast the underlying data actually changes. */
export const StaleTime = {
  /** Live-ish data: doctor availability, cart totals. */
  realtime: 0,
  /** Default for most lists. */
  short: 30 * 1000,
  /** Product catalogue, doctor profiles. */
  medium: 5 * 60 * 1000,
  /** Reference data: specialities, categories, static content. */
  long: 60 * 60 * 1000,
  /** Effectively immutable within a session. */
  infinite: Number.POSITIVE_INFINITY,
} as const;

/** How long an unused cache entry survives before garbage collection. */
export const GcTime = {
  short: 5 * 60 * 1000,
  default: 24 * 60 * 60 * 1000,
} as const;

export const QUERY_RETRY_COUNT = 2;

/**
 * Root namespaces. Each module owns exactly one and builds its keys beneath it,
 * which is what makes scoped invalidation safe.
 */
export const QueryKeys = {
  auth: ['auth'] as const,
  consultation: ['consultation'] as const,
  shop: ['shop'] as const,
  health: ['health'] as const,
  reference: ['reference'] as const,
} as const;

export type QueryNamespace = keyof typeof QueryKeys;
