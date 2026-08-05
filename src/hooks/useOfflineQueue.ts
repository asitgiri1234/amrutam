/**
 * Observe and control the offline write queue from React.
 *
 * WHAT THIS IS FOR: a pending-sync badge, a "3 changes waiting to upload"
 * banner, and a retry affordance for writes that gave up. Those are the UI
 * surfaces every offline-capable app needs and that are impossible to build
 * without a subscription to queue state.
 *
 * WHAT IT IS NOT FOR: enqueuing. Screens do not enqueue directly — a
 * repository does, because only the repository knows the endpoint, the payload
 * shape and the idempotency key. Exposing `enqueue` here would invite a
 * component to hand-roll a mutation and skip all three.
 *
 * Generic by construction: nothing below knows what a booking or a cart is.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { mutationQueue } from '@queue/mutationQueue';
import type { QueueSnapshot, QueuedTask } from '@queue/queue.types';
import { queueProcessor } from '@queue/queueProcessor';

export interface OfflineQueueState extends QueueSnapshot {
  /** Anything at all waiting: pending, in-flight or given up. */
  total: number;
  /** True while there is unsent work — drives the "syncing" indicator. */
  hasPendingWork: boolean;
  /** True when something needs the user's attention rather than time. */
  hasFailures: boolean;
}

export interface OfflineQueueControls {
  /** Kick a drain immediately, e.g. from a pull-to-refresh. */
  flush: () => Promise<void>;
  /** Put every dead-lettered task back in play. Returns how many. */
  retryFailed: () => number;
  /** Retry one task by id. */
  retryTask: (id: string) => void;
  /** Abandon one task — the user chose to discard that change. */
  discardTask: (id: string) => void;
  /** Snapshot of the tasks that have given up, for a detail list. */
  getFailedTasks: () => readonly QueuedTask[];
}

export type UseOfflineQueueResult = OfflineQueueState & OfflineQueueControls;

/** `snapshot()` is reference-stable between changes, which this depends on. */
function subscribe(onStoreChange: () => void): () => void {
  return mutationQueue.subscribe(onStoreChange);
}

function getSnapshot(): QueueSnapshot {
  return mutationQueue.snapshot();
}

export function useOfflineQueue(): UseOfflineQueueResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const flush = useCallback(() => queueProcessor.drain(), []);

  const retryFailed = useCallback(() => {
    const count = mutationQueue.retryDeadLettered();
    // Retrying without draining would leave the tasks pending until the next
    // connectivity change, which reads as "the retry button did nothing".
    void queueProcessor.drain();
    return count;
  }, []);

  const retryTask = useCallback((id: string) => {
    mutationQueue.retry(id);
    void queueProcessor.drain();
  }, []);

  const discardTask = useCallback((id: string) => {
    mutationQueue.remove(id);
  }, []);

  const getFailedTasks = useCallback(() => mutationQueue.getDeadLettered(), []);

  return useMemo(
    () => ({
      ...snapshot,
      total:
        snapshot.pending +
        snapshot.inFlight +
        snapshot.failed +
        snapshot.deadLettered,
      hasPendingWork: snapshot.pending > 0 || snapshot.inFlight > 0,
      hasFailures: snapshot.deadLettered > 0,
      flush,
      retryFailed,
      retryTask,
      discardTask,
      getFailedTasks,
    }),
    [discardTask, flush, getFailedTasks, retryFailed, retryTask, snapshot],
  );
}
