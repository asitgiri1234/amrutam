/**
 * WHY `queue/` exists — see the long note in `queue.types.ts`.
 *
 * Short version: writes made while offline must survive an app kill, must not
 * be duplicated, and must preserve order within a flow. That is a state
 * machine, not a helper function, so it gets its own boundary with its own
 * tests.
 *
 * Infrastructure only at this stage — no task types are registered yet.
 */

export { MutationQueue, mutationQueue } from './mutationQueue';
export {
  QueueProcessor,
  queueProcessor,
  registerTaskHandler,
} from './queueProcessor';
export type { TaskHandler } from './queueProcessor';
export type {
  EnqueueOptions,
  QueueListener,
  QueueSnapshot,
  QueuedTask,
  QueuedTaskStatus,
} from './queue.types';
