/**
 * Repository capability interfaces.
 *
 * WHY small interfaces instead of one fat base class: not every entity is
 * writable (health records from a lab are read-only), and not every entity is
 * listable. Composing capabilities means a repository's type tells you exactly
 * what the entity supports, and a screen cannot call `create()` on something
 * that has no create endpoint.
 */

import type { ListResult } from '@api/httpClient';
import type { RequestOptions } from '@app-types/api.types';
import type { Entity } from '@app-types/common.types';
import type { CursorPage, CursorPageParams } from '@utils/pagination';

export interface Readable<T extends Entity> {
  findById(id: string, options?: RequestOptions): Promise<T>;
}

export interface Listable<
  T extends Entity,
  TFilters = Record<string, unknown>,
> {
  list(filters: TFilters, options?: RequestOptions): Promise<ListResult<T>>;
}

export interface CursorListable<
  T extends Entity,
  TFilters = Record<string, unknown>,
> {
  listByCursor(
    params: CursorPageParams & TFilters,
    options?: RequestOptions,
  ): Promise<CursorPage<T>>;
}

export interface Creatable<T extends Entity, TInput> {
  /** `options.idempotencyKey` is required by convention for anything the
   *  offline queue may replay. */
  create(input: TInput, options?: RequestOptions): Promise<T>;
}

export interface Updatable<T extends Entity, TInput> {
  update(id: string, input: TInput, options?: RequestOptions): Promise<T>;
}

export interface Deletable {
  remove(id: string, options?: RequestOptions): Promise<void>;
}

/** Read-through cache hook point, implemented by the offline layer. */
export interface CacheableRepository {
  /** Cache key prefix used by `offline/cacheManager`. */
  readonly cacheNamespace: string;
  /** Milliseconds a cached entry stays usable offline. */
  readonly cacheTtlMs: number;
}
