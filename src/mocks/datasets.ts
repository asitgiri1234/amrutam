/**
 * LazyDataset — the piece that makes 35,000 mock entities affordable.
 *
 * THE PROBLEM: 5,000 doctors + 20,000 products + 10,000 records is a lot of
 * object allocation. Doing it at import time would add hundreds of
 * milliseconds to every cold start and every Jest file, for data most screens
 * never touch.
 *
 * THE DESIGN — three access paths with three different costs:
 *
 *   `at(index)` / `byId(id)`   O(1), allocates ONE entity, never materialises.
 *                              Works because ids encode their index and each
 *                              index owns a derived seed (see `deriveSeed`).
 *                              This is what a detail screen uses.
 *
 *   `stream()`                 Lazy generator. Allocates one entity at a time,
 *                              so a caller that stops early pays only for what
 *                              it read.
 *
 *   `all()`                    Materialises the whole set ONCE and memoises it.
 *                              Only list/search/filter needs this, because a
 *                              filter is inherently a full scan. The first
 *                              call is the expensive one; every later call is
 *                              free.
 *
 * Nothing here runs until something asks. Importing this module costs nothing
 * beyond defining three objects.
 */

import { logger } from '@utils/logger';

import {
  buildLazy,
  buildOne,
  parseSequentialId,
  DEFAULT_SEED,
  type MockFactory,
} from './mockUtils';

const log = logger.scoped('mocks');

export interface LazyDatasetOptions<T> {
  /** Used for ids (`doctor-00042`) and for index recovery in `byId`. */
  idPrefix: string;
  factory: MockFactory<T>;
  count: number;
  seed?: number;
}

export class LazyDataset<T> {
  private materialised: T[] | null = null;

  readonly idPrefix: string;
  readonly count: number;

  private readonly factory: MockFactory<T>;
  private readonly seed: number;

  constructor({
    idPrefix,
    factory,
    count,
    seed = DEFAULT_SEED,
  }: LazyDatasetOptions<T>) {
    this.idPrefix = idPrefix;
    this.factory = factory;
    this.count = count;
    this.seed = seed;
  }

  /** O(1). Returns `undefined` for an out-of-range index. */
  at(index: number): T | undefined {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) {
      return undefined;
    }
    return buildOne(this.factory, index, this.seed);
  }

  /**
   * O(1) — the whole point of encoding the index in the id. A mock repository
   * can serve a detail screen for entity 19,998 of 20,000 without generating
   * the other 19,999.
   */
  byId(id: string): T | undefined {
    const index = parseSequentialId(this.idPrefix, id);
    return index === null ? undefined : this.at(index);
  }

  /** Lazy. Stops allocating the moment the consumer stops pulling. */
  stream(): Generator<T> {
    return buildLazy(this.factory, this.count, { seed: this.seed });
  }

  /**
   * Materialises once, then memoises. Call only when a full scan is genuinely
   * required (filtering, sorting, searching).
   */
  all(): readonly T[] {
    if (this.materialised === null) {
      const startedAt = Date.now();
      this.materialised = Array.from(this.stream());

      // Logged because a surprise 300ms stall during development should be
      // attributable, not mysterious. Silent in production (`logLevel: error`).
      log.debug(
        `materialised ${this.count} ${this.idPrefix} fixtures in ${
          Date.now() - startedAt
        }ms`,
      );
    }

    return this.materialised;
  }

  /** True once `all()` has been paid for. Used by tests to assert laziness. */
  get isMaterialised(): boolean {
    return this.materialised !== null;
  }

  /** Drops the cache. Tests use this to keep cases independent. */
  reset(): void {
    this.materialised = null;
  }
}
