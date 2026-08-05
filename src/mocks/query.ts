/**
 * Query helpers — the in-memory equivalent of what the API will do server-side.
 *
 * WHY these live in the mock layer and not in `utils/`: they are a *stand-in
 * for the backend*. Real filtering, ranking and pagination happen on the
 * server against an index. Putting a client-side search in `utils/` would
 * invite a screen to use it against live data, which is exactly the mistake
 * that produces a "search" that only finds what is already on screen.
 *
 * `utils/pagination.ts` remains the shared vocabulary for page params and
 * cursors; this file is the mock *engine* that consumes them.
 */

import type { ApiListMeta, SortParam } from '@app-types/api.types';

/**
 * Normalises for accent- and case-insensitive comparison.
 * The escape is the combining-diacritical block (U+0300–U+036F) written as
 * code points rather than literal marks, which do not survive file encoding
 * reliably.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Extracts the searchable text of an entity. Each dataset supplies its own,
 * because "what counts as a match" is a per-entity decision — a product should
 * match on its ingredients, a doctor on their specialities.
 */
export type SearchableFields<T> = (item: T) => Array<string | undefined>;

/**
 * Token-AND matching: every token in the query must appear somewhere in the
 * entity's searchable text.
 *
 * WHY AND and not OR: "ashwagandha churna" should narrow to churnas made with
 * ashwagandha, not widen to everything containing either word. OR-matching is
 * the single most common reason a mock search "works" and the real one
 * disappoints.
 */
export function matchesQuery<T>(
  item: T,
  query: string,
  fields: SearchableFields<T>,
): boolean {
  const tokens = normalise(query).split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return true;
  }

  const haystack = normalise(
    fields(item)
      .filter((value): value is string => typeof value === 'string')
      .join(' '),
  );

  return tokens.every(token => haystack.includes(token));
}

/** Applies a free-text query across a collection. */
export function search<T>(
  items: readonly T[],
  query: string | undefined,
  fields: SearchableFields<T>,
): readonly T[] {
  if (query === undefined || query.trim().length === 0) {
    return items;
  }
  return items.filter(item => matchesQuery(item, query, fields));
}

/** Applies a list of predicates, skipping any that are `undefined`. */
export function applyFilters<T>(
  items: readonly T[],
  predicates: Array<((item: T) => boolean) | undefined>,
): readonly T[] {
  const active = predicates.filter(
    (predicate): predicate is (item: T) => boolean => predicate !== undefined,
  );

  if (active.length === 0) {
    return items;
  }

  return items.filter(item => active.every(predicate => predicate(item)));
}

/** Resolves a dotted path to a comparable primitive, for generic sorting. */
function valueAtPath(item: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (accumulator, segment) =>
        accumulator === null || typeof accumulator !== 'object'
          ? undefined
          : (accumulator as Record<string, unknown>)[segment],
      item,
    );
}

/**
 * Sorts a copy — never the input. Mutating would corrupt the dataset's
 * memoised array, and the next caller would silently get a different order.
 */
export function sortItems<T>(
  items: readonly T[],
  sort: SortParam | undefined,
): readonly T[] {
  if (sort === undefined) {
    return items;
  }

  const direction = sort.direction === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    const left = valueAtPath(a, sort.field);
    const right = valueAtPath(b, sort.field);

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction;
    }

    return String(left ?? '').localeCompare(String(right ?? '')) * direction;
  });
}

export interface PagedResult<T> {
  items: T[];
  meta: ApiListMeta;
}

/**
 * Slices into an API-shaped page. Returns the same `{ items, meta }` envelope
 * the real transport produces, so a repository swapped from mock to live needs
 * no reshaping.
 */
export function paginateResult<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): PagedResult<T> {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const start = (safePage - 1) * safeSize;

  return {
    items: items.slice(start, start + safeSize),
    meta: {
      page: safePage,
      pageSize: safeSize,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / safeSize)),
    },
  };
}

export interface QueryPipelineOptions<T, TFilters> {
  items: readonly T[];
  filters: TFilters & {
    query?: string;
    page?: number;
    pageSize?: number;
    sort?: SortParam;
  };
  searchableFields: SearchableFields<T>;
  predicates: Array<((item: T) => boolean) | undefined>;
  defaultPageSize?: number;
}

/**
 * The full search → filter → sort → paginate pipeline, in that order.
 *
 * Order matters: filtering before sorting means we sort a smaller set, and
 * paginating last is the only way `totalItems` reflects what the user actually
 * matched rather than the size of the whole dataset.
 */
export function runQuery<T, TFilters>({
  items,
  filters,
  searchableFields,
  predicates,
  defaultPageSize = 20,
}: QueryPipelineOptions<T, TFilters>): PagedResult<T> {
  const searched = search(items, filters.query, searchableFields);
  const filtered = applyFilters(searched, predicates);
  const sorted = sortItems(filtered, filters.sort);

  return paginateResult(
    sorted,
    filters.page ?? 1,
    filters.pageSize ?? defaultPageSize,
  );
}
