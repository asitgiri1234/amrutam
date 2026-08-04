/**
 * WHY `offline/` exists:
 *
 * "Offline support" is not a feature you bolt on — it is a property of the
 * data layer, and retrofitting it means rewriting every screen. So the
 * infrastructure lands with the foundation even though no module uses it yet.
 *
 * The target user is concrete: someone on the Delhi metro with intermittent 4G
 * who wants to re-read yesterday's prescription and add a product to their
 * cart. That requires three independent capabilities, which is why this folder
 * has three files rather than one "offline service":
 *
 *   cacheManager        — reads survive a cold start with no network
 *   connectivityListener — a single, honest answer to "are we online?"
 *   syncManager          — one coordinated catch-up, not N racing ones
 *
 * Writes live in `queue/`, deliberately separate: their failure semantics are
 * completely different (see `queue/queue.types.ts`).
 */

export {
  CacheManager,
  cacheManager,
  CACHE_SCHEMA_VERSION,
} from './cacheManager';
export type { CacheEntry, CacheManagerOptions } from './cacheManager';

export {
  getConnectivityStatus,
  isOnline,
  onConnectivityChange,
  refreshConnectivity,
  startConnectivityListener,
  stopConnectivityListener,
} from './connectivityListener';
export type {
  ConnectivityListener,
  ConnectivityStatus,
} from './connectivityListener';

export {
  SyncManager,
  syncManager,
  registerSyncTask,
  unregisterSyncTask,
} from './syncManager';
export type { SyncResult, SyncTask, SyncTrigger } from './syncManager';
