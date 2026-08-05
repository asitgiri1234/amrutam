/**
 * Cache manager — TTL'd read-through cache on top of the storage port.
 *
 * WHY this exists alongside React Query's cache: they solve different halves
 * of the problem.
 *
 *   React Query  = in-memory, per-session, request deduplication + staleness.
 *   This         = on-disk, survives app restarts, readable synchronously
 *                  before React mounts.
 *
 * The user who opens the app on the Delhi metro with no signal needs the
 * *disk* cache. React Query's cache is empty at that moment.
 *
 * Deliberately dumb: it stores opaque JSON with a timestamp. It knows nothing
 * about entities, which is what keeps it usable by every module.
 *
 * NO BUSINESS LOGIC YET — the eviction policy and per-entity TTLs get tuned
 * when the first module measures real payload sizes.
 */

import { cacheStorage, type KeyValueStorage } from '@storage';
import { logger } from '@utils/logger';

const log = logger.scoped('cache');

interface CacheEnvelope<T> {
  value: T;
  storedAt: number;
  /** Absolute expiry in epoch ms. */
  expiresAt: number;
  /** Bumped when a payload shape changes, invalidating old entries. */
  version: number;
}

/** Raise this to invalidate every cached entry after a breaking shape change. */
export const CACHE_SCHEMA_VERSION = 1;

export interface CacheEntry<T> {
  value: T;
  /** True when past TTL. Stale entries are still returned — showing slightly
   *  old data beats showing a spinner with no network. */
  isStale: boolean;
  storedAt: number;
}

export interface CacheManagerOptions {
  storage?: KeyValueStorage;
  defaultTtlMs?: number;
}

export class CacheManager {
  private readonly storage: KeyValueStorage;
  private readonly defaultTtlMs: number;

  constructor({
    storage = cacheStorage,
    defaultTtlMs = 15 * 60 * 1000,
  }: CacheManagerOptions = {}) {
    this.storage = storage;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Returns the entry even when stale, flagged as such. The caller decides:
   * a list screen shows stale data immediately and revalidates; a payment
   * screen refuses stale data outright.
   */
  get<T>(key: string): CacheEntry<T> | undefined {
    const envelope = this.storage.getObject<CacheEnvelope<T>>(key);

    if (envelope === undefined) {
      return undefined;
    }

    if (envelope.version !== CACHE_SCHEMA_VERSION) {
      this.storage.delete(key);
      return undefined;
    }

    return {
      value: envelope.value,
      storedAt: envelope.storedAt,
      isStale: Date.now() > envelope.expiresAt,
    };
  }

  /** Fresh entries only — for callers that must not show stale data. */
  getFresh<T>(key: string): T | undefined {
    const entry = this.get<T>(key);
    return entry === undefined || entry.isStale ? undefined : entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number = this.defaultTtlMs): void {
    const now = Date.now();

    this.storage.setObject<CacheEnvelope<T>>(key, {
      value,
      storedAt: now,
      expiresAt: now + ttlMs,
      version: CACHE_SCHEMA_VERSION,
    });
  }

  has(key: string): boolean {
    return this.storage.contains(key);
  }

  /**
   * Drops one entry. `invalidate` is kept as an alias because "invalidate" is
   * the verb the sync manager and React Query both use for the same idea, and
   * forcing one name at every call site would read wrong in half of them.
   */
  remove(key: string): void {
    this.storage.delete(key);
  }

  /** @see remove */
  invalidate(key: string): void {
    this.remove(key);
  }

  /** Scoped invalidation, e.g. `invalidatePrefix('doctors:')` after a sync. */
  invalidatePrefix(prefix: string): number {
    const matching = this.storage
      .getAllKeys()
      .filter(key => key.startsWith(prefix));

    for (const key of matching) {
      this.storage.delete(key);
    }

    log.debug(`invalidated ${matching.length} entries for prefix`, { prefix });
    return matching.length;
  }

  /** Drops every expired entry. Called on cold start, off the critical path. */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const key of this.storage.getAllKeys()) {
      const envelope = this.storage.getObject<CacheEnvelope<unknown>>(key);

      if (
        envelope === undefined ||
        envelope.version !== CACHE_SCHEMA_VERSION ||
        envelope.expiresAt < now
      ) {
        this.storage.delete(key);
        removed += 1;
      }
    }

    log.debug(`pruned ${removed} expired entries`);
    return removed;
  }

  clear(): void {
    this.storage.clearAll();
  }
}

export const cacheManager = new CacheManager();
