/**
 * SyncManager — orchestrates "catch up with the server".
 *
 * WHY a coordinator rather than each feature syncing itself: sync has to
 * happen at exactly four moments (cold start, return to foreground, regaining
 * connectivity, manual pull-to-refresh) and those triggers are app-wide.
 * Duplicating that in every module produces four modules all syncing at once
 * on a 2G connection.
 *
 * Order matters and is fixed here:
 *   1. drain the write queue  — the server must see our writes before we ask
 *      it for state, or we overwrite local changes with stale server data
 *   2. prune the disk cache   — cheap, keeps storage bounded
 *   3. invalidate stale reads — React Query then refetches what is on screen
 *
 * NO BUSINESS LOGIC YET: `registerSyncTask` is the extension point modules use
 * to add domain-specific reconciliation.
 */

import { queryClient } from '@api/queryClient';
import { appStorage, StorageKeys } from '@storage';
import { logger } from '@utils/logger';

import { cacheManager } from './cacheManager';
import { isOnline } from './connectivityListener';

const log = logger.scoped('sync');

export type SyncTrigger =
  | 'coldStart'
  | 'foreground'
  | 'connectivityRestored'
  | 'manual';

export interface SyncResult {
  trigger: SyncTrigger;
  startedAt: number;
  durationMs: number;
  skipped: boolean;
  errors: string[];
}

/** A unit of domain reconciliation contributed by a module. */
export type SyncTask = (trigger: SyncTrigger) => Promise<void>;

const syncTasks = new Map<string, SyncTask>();

export function registerSyncTask(name: string, task: SyncTask): void {
  syncTasks.set(name, task);
}

export function unregisterSyncTask(name: string): void {
  syncTasks.delete(name);
}

/** Minimum gap between automatic syncs. Foregrounding the app ten times in a
 *  minute must not mean ten full syncs. */
const MIN_SYNC_INTERVAL_MS = 30_000;

export class SyncManager {
  private inFlight: Promise<SyncResult> | null = null;

  /** Injected at bootstrap to avoid `offline/` depending on `queue/`. */
  private drainQueue: (() => Promise<void>) | null = null;

  setQueueDrainer(drain: (() => Promise<void>) | null): void {
    this.drainQueue = drain;
  }

  getLastSyncedAt(): number | undefined {
    return appStorage.getNumber(StorageKeys.lastSyncedAt);
  }

  async sync(trigger: SyncTrigger): Promise<SyncResult> {
    // Coalesce concurrent callers onto one run rather than queuing a second.
    if (this.inFlight !== null) {
      return this.inFlight;
    }

    this.inFlight = this.run(trigger).finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  private async run(trigger: SyncTrigger): Promise<SyncResult> {
    const startedAt = Date.now();
    const errors: string[] = [];

    const lastSyncedAt = this.getLastSyncedAt() ?? 0;
    const tooSoon =
      trigger !== 'manual' && startedAt - lastSyncedAt < MIN_SYNC_INTERVAL_MS;

    if (!isOnline() || tooSoon) {
      return {
        trigger,
        startedAt,
        durationMs: 0,
        skipped: true,
        errors,
      };
    }

    log.info('sync started', { trigger });

    // 1. Push local writes first — see the note at the top of this file.
    if (this.drainQueue !== null) {
      try {
        await this.drainQueue();
      } catch (error) {
        errors.push(`queue: ${String(error)}`);
      }
    }

    // 2. Bound disk usage.
    try {
      cacheManager.prune();
    } catch (error) {
      errors.push(`cache: ${String(error)}`);
    }

    // 3. Module-specific reconciliation.
    for (const [name, task] of syncTasks) {
      try {
        await task(trigger);
      } catch (error) {
        errors.push(`${name}: ${String(error)}`);
        log.warn('sync task failed', { name, error });
      }
    }

    // 4. Let React Query refetch whatever is currently mounted.
    await queryClient.invalidateQueries({ refetchType: 'active' });

    appStorage.set(StorageKeys.lastSyncedAt, Date.now());

    const durationMs = Date.now() - startedAt;
    log.info('sync finished', { trigger, durationMs, errors: errors.length });

    return { trigger, startedAt, durationMs, skipped: false, errors };
  }
}

export const syncManager = new SyncManager();
