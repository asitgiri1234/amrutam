/**
 * Pagination helpers.
 *
 * WHY both cursor and offset are modelled: they are not interchangeable.
 * Offset pagination is simple but duplicates/skips rows when the underlying
 * list mutates — fatal for an infinitely-scrolled product catalogue with live
 * inventory. Cursor pagination is stable but cannot jump to page N. The app
 * will need both, so both are first-class here and the `getNextPageParam`
 * helpers plug straight into React Query's `useInfiniteQuery`.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/* ---- Offset ----------------------------------------------------------- */

export interface OffsetPageParams {
  page: number;
  pageSize: number;
}

export interface OffsetPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function firstOffsetPage(
  pageSize = DEFAULT_PAGE_SIZE,
): OffsetPageParams {
  return { page: 1, pageSize: clampPageSize(pageSize) };
}

export function clampPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

export function toOffset(params: OffsetPageParams): number {
  return (Math.max(1, params.page) - 1) * clampPageSize(params.pageSize);
}

/** `useInfiniteQuery({ getNextPageParam: nextOffsetPage })` */
export function nextOffsetPage<T>(
  lastPage: OffsetPage<T>,
): OffsetPageParams | undefined {
  return lastPage.page < lastPage.totalPages
    ? { page: lastPage.page + 1, pageSize: lastPage.pageSize }
    : undefined;
}

export function previousOffsetPage<T>(
  firstPage: OffsetPage<T>,
): OffsetPageParams | undefined {
  return firstPage.page > 1
    ? { page: firstPage.page - 1, pageSize: firstPage.pageSize }
    : undefined;
}

/* ---- Cursor ----------------------------------------------------------- */

export interface CursorPageParams {
  cursor: string | null;
  limit: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
}

export function firstCursorPage(limit = DEFAULT_PAGE_SIZE): CursorPageParams {
  return { cursor: null, limit: clampPageSize(limit) };
}

export function nextCursorPage<T>(
  lastPage: CursorPage<T>,
  limit = DEFAULT_PAGE_SIZE,
): CursorPageParams | undefined {
  if (!lastPage.hasMore || lastPage.nextCursor === null) {
    return undefined;
  }
  return { cursor: lastPage.nextCursor, limit: clampPageSize(limit) };
}

/* ---- Shared ----------------------------------------------------------- */

/**
 * Flattens `useInfiniteQuery`'s `data.pages` into one array.
 * Kept generic over the page shape so it works for both strategies.
 */
export function flattenPages<T>(pages: Array<{ items: T[] }> | undefined): T[] {
  if (pages === undefined) {
    return [];
  }
  return pages.flatMap(page => page.items);
}

/**
 * Deduplicates by id while preserving order. Necessary in practice: with
 * offset pagination a concurrent insert *will* hand you the same row twice,
 * and duplicate keys crash FlashList's recycling.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}

/** True when the list is close enough to the end to prefetch. */
export function shouldFetchNextPage(
  visibleIndex: number,
  totalLoaded: number,
  threshold = 5,
): boolean {
  return totalLoaded > 0 && visibleIndex >= totalLoaded - threshold;
}
