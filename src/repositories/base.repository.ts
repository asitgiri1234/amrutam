/**
 * BaseRepository — the shared contract for all data access.
 *
 * WHY the repository pattern in a React Native app (it is not just enterprise
 * ceremony):
 *
 *   1. **One place per entity where data comes from.** A doctor profile may
 *      come from the network, the offline cache, or a mock. The screen should
 *      not know or care, and should not change when the answer changes.
 *   2. **Testable business logic.** Hooks depend on a repository *interface*,
 *      so a test swaps in a fake with zero network mocking.
 *   3. **A seam for the offline layer.** Read-through caching and queued writes
 *      hook in here, once, instead of in every hook.
 *   4. **Type-safe query keys per entity.** Cache invalidation is otherwise a
 *      stringly-typed guessing game.
 *
 * Concrete repositories are NOT part of the foundation milestone — each module
 * brings its own. This file defines the shape they must take.
 */

import { http, type HttpClient } from '@api/httpClient';
import type { RequestOptions } from '@app-types/api.types';
import type { Entity } from '@app-types/common.types';
import { logger } from '@utils/logger';

/**
 * Every repository declares a query-key namespace so cache invalidation can be
 * scoped ("everything under doctors") without string surgery.
 */
export abstract class BaseRepository<T extends Entity> {
  protected readonly http: HttpClient;
  protected readonly log;

  /**
   * @param namespace Root segment of this entity's query keys, e.g. `doctors`.
   * @param client Injectable so tests can supply a stub transport.
   */
  constructor(protected readonly namespace: string, client: HttpClient = http) {
    this.http = client;
    this.log = logger.scoped(`repo:${namespace}`);
  }

  /* ---- Query key factory ---------------------------------------------
   * `as const` tuples so React Query's key inference stays precise and a
   * typo becomes a type error rather than a silent cache miss. */

  keys = {
    all: () => [this.namespace] as const,
    lists: () => [this.namespace, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [this.namespace, 'list', filters] as const,
    details: () => [this.namespace, 'detail'] as const,
    detail: (id: string) => [this.namespace, 'detail', id] as const,
  };

  /**
   * Subclasses implement the actual calls. Declared abstract rather than
   * provided so a repository cannot accidentally inherit a generic endpoint
   * that does not exist for its entity.
   */
  abstract findById(id: string, options?: RequestOptions): Promise<T>;
}
