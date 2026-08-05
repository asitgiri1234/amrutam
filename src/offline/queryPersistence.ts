/**
 * React Query cache persistence.
 *
 * WHY this is the piece that makes the app genuinely offline-capable: React
 * Query's cache is in-memory and dies with the process. A user who opens the
 * app on the Delhi metro with no signal gets an empty cache and a spinner —
 * unless the cache was written to disk on the previous run. This is that.
 *
 * WHY the SYNC persister rather than the async one: MMKV is synchronous, so
 * the dehydrated cache can be read during module init, before React renders.
 * The async persister would restore a frame or two late, producing a visible
 * flash of empty state on every cold start — the exact thing persistence
 * exists to prevent.
 *
 * THE IMPORTANT PART — what is deliberately NOT persisted:
 *
 *   1. **Health data.** Anything under the `health` query namespace is
 *      excluded. Persisting it would write diagnoses and lab results to disk
 *      as plaintext JSON, which contradicts the rules stated in
 *      `models/healthRecord.model.ts` and `store/health.store.ts`. Health
 *      records get offline support later via the encrypted bucket with an
 *      explicit retention policy — not by falling into a generic cache.
 *   2. **Auth.** Session state is not re-fetchable from a stale disk copy and
 *      must never be resurrected from one.
 *   3. **Errored or pending queries.** Restoring a failure as if it were data
 *      produces a screen that shows an error it can never retry out of.
 *   4. **Mutations.** The offline queue owns unsent writes, with idempotency
 *      keys and retry policy. Two mechanisms replaying the same mutation is
 *      how a user gets charged twice.
 */

import { config } from '@config';
import { cacheStorage, StorageKeys, type KeyValueStorage } from '@storage';
import type { Query } from '@tanstack/react-query';
import {
  removeOldestQuery,
  type PersistedClient,
  type Persister,
} from '@tanstack/react-query-persist-client';
import { logger } from '@utils/logger';

const log = logger.scoped('offline:persist');

/**
 * Bump to invalidate every persisted cache after a breaking change to the
 * shape of what we store. Cheaper and safer than a migration for data that is
 * re-fetchable by definition.
 */
export const PERSIST_BUSTER = 'v1';

/** Query namespaces that must never touch disk. See the note above. */
const NON_PERSISTED_NAMESPACES = new Set(['health', 'auth']);

/**
 * `true` when this query may be written to disk.
 * Exported so the rule is unit-testable rather than buried in a closure.
 */
export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== 'success') {
    return false;
  }

  const [namespace] = query.queryKey;
  return (
    typeof namespace !== 'string' || !NON_PERSISTED_NAMESPACES.has(namespace)
  );
}

/**
 * A `Persister` backed by the storage port rather than by MMKV directly, so
 * tests use the in-memory adapter and nothing needs a JSI runtime.
 */
export function createQueryPersister(
  storage: KeyValueStorage = cacheStorage,
): Persister {
  return {
    persistClient(client: PersistedClient): void {
      try {
        storage.setObject(StorageKeys.queryCache, client);
      } catch (error) {
        // A failed cache write must never break the app — the data is still
        // in memory and still re-fetchable.
        log.warn('failed to persist query cache', error);
      }
    },

    restoreClient(): PersistedClient | undefined {
      // `getObject` already drops and returns undefined for malformed JSON.
      return storage.getObject<PersistedClient>(StorageKeys.queryCache);
    },

    removeClient(): void {
      storage.delete(StorageKeys.queryCache);
    },
  };
}

export const queryPersister = createQueryPersister();

/**
 * Options for `PersistQueryClientProvider`.
 *
 * `maxAge` bounds how stale a restored cache may be. Beyond it the whole
 * persisted client is discarded rather than partially trusted — a half-fresh
 * cache is harder to reason about than an empty one.
 */
export function createPersistOptions(persister: Persister = queryPersister) {
  return {
    persister,
    maxAge: config.cacheTtlMs,
    buster: PERSIST_BUSTER,
    dehydrateOptions: {
      shouldDehydrateQuery: shouldPersistQuery,
      // The offline queue owns unsent writes; see note (4) above.
      shouldDehydrateMutation: () => false,
    },
    /** Evicts the largest/oldest entries if the payload exceeds MMKV limits. */
    retry: removeOldestQuery,
  };
}

/** Drops the persisted cache. Called on logout, and by tests. */
export function clearPersistedQueryCache(
  persister: Persister = queryPersister,
): void {
  void persister.removeClient();
  log.info('persisted query cache cleared');
}

/**
 * True when persistence is enabled for this build. Kept as a function rather
 * than a constant so tests can reason about it alongside `config`.
 */
export function isQueryPersistenceEnabled(): boolean {
  return config.enableOfflineCache;
}

/* Deliberately NOT provided: a manual `persistNow(client)` flush.
 * `PersistQueryClientProvider` already writes on cache change (throttled), and
 * a hand-rolled dehydration would have to mirror React Query's internal
 * `dehydrate()` format exactly — a silent drift risk on every minor upgrade,
 * in exchange for nothing the provider does not already do. */
