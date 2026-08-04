/**
 * WHY `queue/` is a top-level folder and not a file inside `offline/`:
 *
 * The mutation queue is the hardest correctness problem in an offline-capable
 * commerce + healthcare app, and it deserves its own boundary. `offline/`
 * handles *reads* (cache, sync, connectivity). `queue/` handles *writes*, which
 * have entirely different failure semantics:
 *
 *   - a failed read can be retried freely; a failed write may have partially
 *     succeeded
 *   - reads can be dropped; writes must survive an app kill
 *   - reads are independent; writes often must run in order (add to cart ->
 *     checkout)
 *
 * Those constraints are why every queued task carries an idempotency key, a
 * dependency-friendly ordering, and an explicit terminal state.
 */

import type { HttpMethod } from '@app-types/api.types';

export type QueuedTaskStatus =
  | 'pending'
  | 'inFlight'
  | 'failed'
  /** Retries exhausted or a non-retryable error. Requires user attention. */
  | 'deadLettered';

/**
 * A durable description of a mutation. Must be JSON-serialisable — it is
 * written to disk and may be replayed after an app restart, so it cannot
 * capture closures or component state.
 */
export interface QueuedTask<TPayload = unknown> {
  id: string;
  /** Groups related tasks, e.g. `shop.cart`. Used for ordering and for
   *  cancelling a whole flow. */
  scope: string;
  /** What this task does — the processor dispatches on it. */
  type: string;

  /* ---- Transport ------------------------------------------------------ */
  method: HttpMethod;
  url: string;
  payload: TPayload;
  /** REQUIRED. A replayed write without one can double-charge a customer. */
  idempotencyKey: string;

  /* ---- Lifecycle ------------------------------------------------------ */
  status: QueuedTaskStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  /** Epoch ms before which the task must not be attempted (backoff). */
  nextAttemptAt: number;
  lastError?: string;

  /**
   * Tasks in the same scope run in creation order. Set false only for
   * genuinely independent writes (e.g. "mark notification read").
   */
  ordered: boolean;
}

export interface EnqueueOptions<TPayload> {
  scope: string;
  type: string;
  method: HttpMethod;
  url: string;
  payload: TPayload;
  idempotencyKey?: string;
  maxAttempts?: number;
  ordered?: boolean;
}

export interface QueueSnapshot {
  pending: number;
  inFlight: number;
  failed: number;
  deadLettered: number;
}

export type QueueListener = (snapshot: QueueSnapshot) => void;
