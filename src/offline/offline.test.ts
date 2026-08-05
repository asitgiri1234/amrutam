/**
 * Offline infrastructure tests.
 *
 * Focused on the three things that fail silently and expensively:
 *
 *   1. **Persistence exclusions.** If health data ever gets dehydrated to
 *      disk, nothing throws — it just quietly writes PHI as plaintext JSON.
 *      Only a test catches that.
 *   2. **Queue lifecycle.** Claim/retry/dead-letter is a state machine; an
 *      off-by-one in attempt counting means either infinite retries or writes
 *      abandoned on the first blip.
 *   3. **Snapshot identity.** `useSyncExternalStore` re-renders forever if the
 *      snapshot is not reference-stable, and that only shows up at runtime.
 */

import { CacheManager } from '@offline/cacheManager';
import { MutationQueue } from '@queue/mutationQueue';
import { createMemoryStorage, StorageKeys } from '@storage';
import type { Query } from '@tanstack/react-query';

import { createQueryPersister, shouldPersistQuery } from './queryPersistence';

/** Minimal stand-in — `shouldPersistQuery` only reads status and key. */
function fakeQuery(queryKey: unknown[], status: string): Query {
  return { queryKey, state: { status } } as unknown as Query;
}

describe('query persistence rules', () => {
  it('persists ordinary successful queries', () => {
    expect(shouldPersistQuery(fakeQuery(['shop', 'products'], 'success'))).toBe(
      true,
    );
  });

  it('never persists health data', () => {
    // Writing PHI to disk as plaintext JSON is the failure this prevents.
    expect(
      shouldPersistQuery(fakeQuery(['health', 'records'], 'success')),
    ).toBe(false);
  });

  it('never persists auth state', () => {
    expect(shouldPersistQuery(fakeQuery(['auth', 'session'], 'success'))).toBe(
      false,
    );
  });

  it('does not persist errored or pending queries', () => {
    // Restoring a failure as if it were data strands the screen on an error
    // it can never retry out of.
    expect(shouldPersistQuery(fakeQuery(['shop'], 'error'))).toBe(false);
    expect(shouldPersistQuery(fakeQuery(['shop'], 'pending'))).toBe(false);
  });

  it('tolerates a non-string first key segment', () => {
    expect(shouldPersistQuery(fakeQuery([42], 'success'))).toBe(true);
  });
});

describe('query persister', () => {
  it('round-trips a client through storage', () => {
    const storage = createMemoryStorage();
    const persister = createQueryPersister(storage);

    const client = {
      buster: 'v1',
      timestamp: 1,
      clientState: { mutations: [], queries: [] },
    };

    persister.persistClient(client);
    expect(persister.restoreClient()).toEqual(client);

    persister.removeClient();
    expect(persister.restoreClient()).toBeUndefined();
  });

  it('returns undefined rather than throwing on corrupt data', () => {
    const storage = createMemoryStorage();
    storage.set(StorageKeys.queryCache, 'not json');

    expect(createQueryPersister(storage).restoreClient()).toBeUndefined();
  });
});

describe('cache manager', () => {
  const makeCache = () =>
    new CacheManager({ storage: createMemoryStorage(), defaultTtlMs: 1_000 });

  it('supports get / set / remove / clear', () => {
    const cache = makeCache();

    cache.set('a', { value: 1 });
    expect(cache.get<{ value: number }>('a')?.value).toEqual({ value: 1 });

    cache.remove('a');
    expect(cache.get('a')).toBeUndefined();

    cache.set('b', 1);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });

  it('returns stale entries flagged, rather than hiding them', () => {
    const cache = makeCache();
    cache.set('k', 'v', -1); // already expired

    const entry = cache.get<string>('k');
    // Showing slightly old data beats showing a spinner with no network —
    // but the caller must be able to tell.
    expect(entry?.value).toBe('v');
    expect(entry?.isStale).toBe(true);
    expect(cache.getFresh('k')).toBeUndefined();
  });

  it('invalidates by prefix', () => {
    const cache = makeCache();
    cache.set('doctors:1', 1);
    cache.set('doctors:2', 2);
    cache.set('products:1', 3);

    expect(cache.invalidatePrefix('doctors:')).toBe(2);
    expect(cache.get('products:1')).toBeDefined();
  });
});

describe('mutation queue', () => {
  const makeQueue = () =>
    new MutationQueue(createMemoryStorage(), 'test.queue');

  const task = {
    scope: 'shop.cart',
    type: 'cart.add',
    method: 'POST' as const,
    url: '/cart/items',
    payload: { productId: 'p1' },
  };

  it('enqueues with an idempotency key even when none is supplied', () => {
    const queued = makeQueue().enqueue(task);

    // A replayed write without one can double-charge a customer.
    expect(queued.idempotencyKey).toBeTruthy();
    expect(queued.status).toBe('pending');
  });

  it('dequeue claims the task so a second drain cannot take it', () => {
    const queue = makeQueue();
    queue.enqueue(task);

    const claimed = queue.dequeue();
    expect(claimed?.status).toBe('inFlight');
    expect(claimed?.attempts).toBe(1);

    // Ordered scope is now blocked — nothing else is claimable.
    expect(queue.dequeue()).toBeUndefined();
  });

  it('preserves order within a scope', () => {
    const queue = makeQueue();
    const first = queue.enqueue(task);
    queue.enqueue(task);

    expect(queue.dequeue()?.id).toBe(first.id);
  });

  it('dead-letters only after attempts are exhausted', () => {
    const queue = makeQueue();
    const queued = queue.enqueue({ ...task, maxAttempts: 2 });

    queue.dequeue();
    queue.markFailed(queued.id, 'boom');
    expect(queue.snapshot().deadLettered).toBe(0);

    queue.dequeue();
    queue.markFailed(queued.id, 'boom');
    expect(queue.snapshot().deadLettered).toBe(1);
  });

  it('retry resets attempts and clears the error', () => {
    const queue = makeQueue();
    const queued = queue.enqueue({ ...task, maxAttempts: 1 });

    queue.dequeue();
    queue.markFailed(queued.id, 'boom');
    expect(queue.snapshot().deadLettered).toBe(1);

    queue.retry(queued.id);

    const [retried] = queue.getAll();
    expect(retried?.status).toBe('pending');
    expect(retried?.attempts).toBe(0);
    expect(retried?.lastError).toBeUndefined();
  });

  it('removes a succeeded task entirely', () => {
    const queue = makeQueue();
    const queued = queue.enqueue(task);

    queue.dequeue();
    queue.markSucceeded(queued.id);

    expect(queue.getAll()).toHaveLength(0);
  });

  it('recovers in-flight tasks after a restart', () => {
    const storage = createMemoryStorage();
    const first = new MutationQueue(storage, 'test.queue');
    const queued = first.enqueue(task);
    first.dequeue();

    // Simulate the app being killed mid-request.
    const restarted = new MutationQueue(storage, 'test.queue');
    const [recovered] = restarted.getAll();

    expect(recovered?.id).toBe(queued.id);
    // Reset to pending so it is retried rather than stranded — which is
    // exactly why the idempotency key is mandatory.
    expect(recovered?.status).toBe('pending');
  });

  it('returns a reference-stable snapshot between changes', () => {
    const queue = makeQueue();

    const before = queue.snapshot();
    expect(queue.snapshot()).toBe(before);

    queue.enqueue(task);

    // New object only after an actual change — this is what stops
    // useSyncExternalStore from re-rendering forever.
    expect(queue.snapshot()).not.toBe(before);
    expect(queue.snapshot()).toBe(queue.snapshot());
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const queue = makeQueue();
    const listener = jest.fn();

    const unsubscribe = queue.subscribe(listener);
    queue.enqueue(task);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    queue.enqueue(task);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clears a whole scope, for an abandoned flow', () => {
    const queue = makeQueue();
    queue.enqueue(task);
    queue.enqueue({ ...task, scope: 'health.upload' });

    expect(queue.removeScope('shop.cart')).toBe(1);
    expect(queue.getAll()).toHaveLength(1);
  });
});
