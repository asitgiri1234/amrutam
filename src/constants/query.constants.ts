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
export const QueryNamespaces = {
  auth: ['auth'],
  consultation: ['consultation'],
  shop: ['shop'],
  health: ['health'],
  reference: ['reference'],
} as const;

export type QueryNamespace = keyof typeof QueryNamespaces;

/**
 * Entity key factories, built beneath the namespaces above.
 *
 * The hierarchy is what makes invalidation precise *and* cheap:
 *
 *   invalidateQueries({ queryKey: QueryKeys.doctors.all() })      // everything
 *   invalidateQueries({ queryKey: QueryKeys.doctors.lists() })    // lists only
 *   invalidateQueries({ queryKey: QueryKeys.doctors.detail(id) }) // one doctor
 *
 * React Query matches keys by prefix, so a broader key subsumes the narrower
 * ones automatically — but only if every key is built from these factories.
 * A hand-written `['doctors', id]` at one call site silently escapes all of it.
 *
 * `filters` is typed `unknown` rather than a concrete filter type so this file
 * stays free of imports from `@models` and `@repositories`; the repositories
 * pass their own typed filters through.
 */
export const QueryKeys = {
  doctors: {
    all: () => ['consultation', 'doctors'] as const,
    lists: () => ['consultation', 'doctors', 'list'] as const,
    list: (filters: unknown) =>
      ['consultation', 'doctors', 'list', filters] as const,
    details: () => ['consultation', 'doctors', 'detail'] as const,
    detail: (doctorId: string) =>
      ['consultation', 'doctors', 'detail', doctorId] as const,
    /** Slots are volatile and keyed by range, so they sit under the doctor
     *  but invalidate independently of the profile. */
    slots: (doctorId: string, range: unknown) =>
      ['consultation', 'doctors', 'slots', doctorId, range] as const,
  },

  bookings: {
    all: () => ['consultation', 'bookings'] as const,
    lists: () => ['consultation', 'bookings', 'list'] as const,
    list: (filters: unknown) =>
      ['consultation', 'bookings', 'list', filters] as const,
    details: () => ['consultation', 'bookings', 'detail'] as const,
    detail: (bookingId: string) =>
      ['consultation', 'bookings', 'detail', bookingId] as const,
  },

  products: {
    all: () => ['shop', 'products'] as const,
    lists: () => ['shop', 'products', 'list'] as const,
    list: (filters: unknown) => ['shop', 'products', 'list', filters] as const,
    details: () => ['shop', 'products', 'detail'] as const,
    detail: (productId: string) =>
      ['shop', 'products', 'detail', productId] as const,
    bySlug: (slug: string) => ['shop', 'products', 'slug', slug] as const,
    related: (productId: string) =>
      ['shop', 'products', 'related', productId] as const,
  },

  cart: {
    /** A singleton per user — no id segment, and no `list`. */
    all: () => ['shop', 'cart'] as const,
  },

  healthRecords: {
    all: () => ['health', 'records'] as const,
    lists: () => ['health', 'records', 'list'] as const,
    list: (filters: unknown) => ['health', 'records', 'list', filters] as const,
    details: () => ['health', 'records', 'detail'] as const,
    detail: (recordId: string) =>
      ['health', 'records', 'detail', recordId] as const,
  },
} as const;

export type QueryKeyFactory = typeof QueryKeys;
