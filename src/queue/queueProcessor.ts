/**
 * QueueProcessor — drains the mutation queue when the device is online.
 *
 * WHY it is strictly serial: parallel draining reorders writes. "Add item,
 * remove item" processed concurrently can leave the item in the cart. One task
 * at a time is slower and correct; that is the right trade for money and
 * medical data.
 *
 * WHY it is started explicitly rather than on import: a module-scope timer
 * makes tests flaky and makes app startup do network work before the user has
 * even authenticated.
 *
 * NO BUSINESS LOGIC YET. `taskHandlers` is an empty registry — modules
 * register how their task types are executed. The default handler simply
 * replays the recorded HTTP request, which covers most cases.
 */

import { ApiError, normalizeError } from '@api/errors';
import { http } from '@api/httpClient';
import { isOnline, onConnectivityChange } from '@offline/connectivityListener';
import { logger } from '@utils/logger';
import { exponentialBackoff } from '@utils/network';

import { mutationQueue, type MutationQueue } from './mutationQueue';
import type { QueuedTask } from './queue.types';

const log = logger.scoped('queue:processor');

/** Modules register a handler when the default HTTP replay is not enough
 *  (e.g. a multipart upload, or a task that must resolve a local id first). */
export type TaskHandler = (task: QueuedTask) => Promise<void>;

const taskHandlers = new Map<string, TaskHandler>();

export function registerTaskHandler(type: string, handler: TaskHandler): void {
  taskHandlers.set(type, handler);
}

/** Replays the recorded request. Sufficient for straightforward mutations. */
async function defaultHandler(task: QueuedTask): Promise<void> {
  const options = { idempotencyKey: task.idempotencyKey };

  switch (task.method) {
    case 'POST':
      await http.post(task.url, task.payload, options);
      return;
    case 'PUT':
      await http.put(task.url, task.payload, options);
      return;
    case 'PATCH':
      await http.patch(task.url, task.payload, options);
      return;
    case 'DELETE':
      await http.delete(task.url, options);
      return;
    default:
      throw new Error(`Queued task cannot use method ${task.method}`);
  }
}

export class QueueProcessor {
  private running = false;
  private draining = false;
  private unsubscribeConnectivity: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly queue: MutationQueue = mutationQueue) {}

  /** Idempotent. Called once from bootstrap. */
  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;

    // Regaining connectivity is the main trigger; the interval is a safety net
    // for tasks whose backoff expires while we are already online.
    this.unsubscribeConnectivity = onConnectivityChange(status => {
      if (status.isConnected && status.isInternetReachable !== false) {
        void this.drain();
      }
    });

    void this.drain();
  }

  stop(): void {
    this.running = false;
    this.unsubscribeConnectivity?.();
    this.unsubscribeConnectivity = null;

    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Processes ready tasks one at a time until none remain or we go offline. */
  async drain(): Promise<void> {
    if (this.draining || !this.running) {
      return;
    }

    this.draining = true;

    try {
      while (this.running && isOnline()) {
        const task = this.queue.peek();

        if (task === undefined) {
          break;
        }

        await this.process(task);
      }
    } finally {
      this.draining = false;
    }
  }

  private async process(task: QueuedTask): Promise<void> {
    this.queue.markInFlight(task.id);

    const handler = taskHandlers.get(task.type) ?? defaultHandler;

    try {
      await handler(task);
      this.queue.markSucceeded(task.id);
      log.debug('task succeeded', { id: task.id, type: task.type });
    } catch (error) {
      const normalized =
        error instanceof ApiError ? error : normalizeError(error);

      // A validation failure or a 404 will never succeed on replay. Retrying
      // burns battery and delays every task behind it in the same scope.
      if (!normalized.isRetryable) {
        this.queue.markDeadLettered(task.id, normalized.message);
        return;
      }

      this.queue.markFailed(
        task.id,
        normalized.message,
        exponentialBackoff(task.attempts),
      );
    }
  }
}

export const queueProcessor = new QueueProcessor();
