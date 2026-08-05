/**
 * Every persisted key in the app, declared in one place.
 *
 * WHY centralised: stringly-typed keys scattered across features collide,
 * get typo'd, and become impossible to migrate or purge on logout. A single
 * frozen registry means "what do we persist?" is answerable by reading one
 * file — which matters for both GDPR/DPDP requests and for writing a correct
 * logout routine.
 *
 * Convention: `<bucket>.<domain>.<name>`.
 */

export const StorageKeys = {
  /* ---- app bucket (survives logout, NOT safe to clear) ---------------- */
  themePreference: 'app.ui.themePreference',
  onboardingCompleted: 'app.ui.onboardingCompleted',
  localeOverride: 'app.ui.locale',
  lastSyncedAt: 'app.sync.lastSyncedAt',
  installationId: 'app.device.installationId',
  /**
   * Pending offline writes.
   *
   * Namespaced `app.*`, NOT `cache.*`, and the distinction is load-bearing:
   * this holds mutations the user has made that the server has not seen yet.
   * Clearing it silently discards their work — an added cart item, a booking,
   * an uploaded record. It lives in the app bucket and must survive any cache
   * purge. (It was briefly named `cache.queue.mutations`, which invited
   * exactly the deletion it must never suffer.)
   */
  mutationQueue: 'app.queue.mutations',

  /* ---- secure bucket (cleared on logout) ------------------------------ */
  accessToken: 'secure.auth.accessToken',
  refreshToken: 'secure.auth.refreshToken',
  sessionUserId: 'secure.auth.userId',

  /* ---- cache bucket (genuinely safe to nuke at any time) --------------- */
  /** Dehydrated React Query cache. Everything here is re-fetchable. */
  queryCache: 'cache.query.persisted',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** Zustand `persist` middleware writes under this prefix. */
export const ZUSTAND_KEY_PREFIX = 'app.store.';
