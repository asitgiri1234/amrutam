/**
 * MutationQueue — durable storage and lifecycle for pending writes.
 *
 * Scope of THIS file: persistence, ordering and state transitions. It does not
 * perform network calls — that is `queueProcessor.ts`. Splitting them means the
 * (fiddly, correctness-critical) state machine is unit-testable with no
 * transport at all.
 *
 * NO BUSINESS LOGIC YET. Task *types* are registered by modules when they land;
 * the queue itself stays domain-agnostic.
 */

import { appStorage, StorageKeys, type KeyValueStorage } from '@storage';
import { logger } from '@utils/logger';

import type {
  EnqueueOptions,
  QueueListener,
  QueueSnapshot,
  QueuedTask,
} from './queue.types';

const log = logger.scoped('queue');

const DEFAULT_MAX_ATTEMPTS = 5;

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export class MutationQueue {
  private tasks: QueuedTask[] = [];
  private readonly listeners = new Set<QueueListener>();

  constructor(
    private readonly storage: KeyValueStorage = appStorage,
    private readonly storageKey: string = StorageKeys.mutationQueue,
  ) {
    this.tasks = this.storage.getObject<QueuedTask[]>(this.storageKey) ?? [];

    // A task marked inFlight when the app died never completed. Reset it so it
    // is retried rather than stranded — this is why the idempotency key is
    // mandatory.
    let recovered = 0;
    for (const task of this.tasks) {
      if (task.status === 'inFlight') {
        task.status = 'pending';
        task.updatedAt = Date.now();
        recovered += 1;
      }
    }

    if (recovered > 0) {
      log.info(`recovered ${recovered} in-flight tasks after restart`);
      this.persist();
    }
  }

  enqueue<TPayload>(options: EnqueueOptions<TPayload>): QueuedTask<TPayload> {
    const now = Date.now();

    const task: QueuedTask<TPayload> = {
      id: createId(),
      scope: options.scope,
      type: options.type,
      method: options.method,
      url: options.url,
      payload: options.payload,
      idempotencyKey: options.idempotencyKey ?? createId(),
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
      ordered: options.ordered ?? true,
    };

    this.tasks.push(task as QueuedTask);
    this.persist();

    log.debug('enqueued', { id: task.id, type: task.type, scope: task.scope });
    return task;
  }

  /**
   * The next task eligible to run, respecting per-scope ordering and backoff.
   * Returns `undefined` when nothing is ready — which is different from
   * "nothing is queued".
   */
  peek(now: number = Date.now()): QueuedTask | undefined {
    const blockedScopes = new Set(
      this.tasks
        .filter(task => task.status === 'inFlight' && task.ordered)
        .map(task => task.scope),
    );

    return this.tasks
      .filter(
        task =>
          task.status === 'pending' &&
          task.nextAttemptAt <= now &&
          !(task.ordered && blockedScopes.has(task.scope)),
      )
      .sort((a, b) => a.createdAt - b.createdAt)[0];
  }

  markInFlight(id: string): void {
    this.update(id, task => {
      task.status = 'inFlight';
      task.attempts += 1;
    });
  }

  markSucceeded(id: string): void {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.persist();
  }

  /** @param retryDelayMs When omitted the task is retried immediately. */
  markFailed(id: string, error: string, retryDelayMs = 0): void {
    this.update(id, task => {
      const exhausted = task.attempts >= task.maxAttempts;

      task.status = exhausted ? 'deadLettered' : 'pending';
      task.lastError = error;
      task.nextAttemptAt = Date.now() + retryDelayMs;

      if (exhausted) {
        log.warn('task dead-lettered', { id, type: task.type, error });
      }
    });
  }

  /** Non-retryable failure (validation, 404) — skip the remaining attempts. */
  markDeadLettered(id: string, error: string): void {
    this.update(id, task => {
      task.status = 'deadLettered';
      task.lastError = error;
    });
  }

  remove(id: string): void {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.persist();
  }

  /** Everything in a scope — for "cancel this checkout". */
  removeScope(scope: string): number {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.scope !== scope);
    this.persist();
    return before - this.tasks.length;
  }

  getAll(): readonly QueuedTask[] {
    return this.tasks;
  }

  getDeadLettered(): readonly QueuedTask[] {
    return this.tasks.filter(task => task.status === 'deadLettered');
  }

  /** Puts dead-lettered tasks back in play — the "retry" button in the UI. */
  retryDeadLettered(): number {
    let count = 0;

    for (const task of this.tasks) {
      if (task.status === 'deadLettered') {
        task.status = 'pending';
        task.attempts = 0;
        task.nextAttemptAt = Date.now();
        count += 1;
      }
    }

    if (count > 0) {
      this.persist();
    }
    return count;
  }

  snapshot(): QueueSnapshot {
    return {
      pending: this.count('pending'),
      inFlight: this.count('inFlight'),
      failed: this.count('failed'),
      deadLettered: this.count('deadLettered'),
    };
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    this.tasks = [];
    this.persist();
  }

  private count(status: QueuedTask['status']): number {
    return this.tasks.filter(task => task.status === status).length;
  }

  private update(id: string, mutate: (task: QueuedTask) => void): void {
    const task = this.tasks.find(candidate => candidate.id === id);

    if (task === undefined) {
      return;
    }

    mutate(task);
    task.updatedAt = Date.now();
    this.persist();
  }

  private persist(): void {
    this.storage.setObject(this.storageKey, this.tasks);

    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const mutationQueue = new MutationQueue();
