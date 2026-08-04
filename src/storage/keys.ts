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
  /* ---- app bucket (survives logout) ----------------------------------- */
  themePreference: 'app.ui.themePreference',
  onboardingCompleted: 'app.ui.onboardingCompleted',
  localeOverride: 'app.ui.locale',
  lastSyncedAt: 'app.sync.lastSyncedAt',
  installationId: 'app.device.installationId',

  /* ---- secure bucket (cleared on logout) ------------------------------ */
  accessToken: 'secure.auth.accessToken',
  refreshToken: 'secure.auth.refreshToken',
  sessionUserId: 'secure.auth.userId',

  /* ---- cache bucket (safe to nuke at any time) ------------------------ */
  queryCache: 'cache.query.persisted',
  mutationQueue: 'cache.queue.mutations',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** Zustand `persist` middleware writes under this prefix. */
export const ZUSTAND_KEY_PREFIX = 'app.store.';
