import {
  clampPageSize,
  dedupeById,
  flattenPages,
  nextCursorPage,
  nextOffsetPage,
  shouldFetchNextPage,
  toOffset,
  type CursorPage,
  type OffsetPage,
} from './pagination';

function offsetPage<T>(overrides: Partial<OffsetPage<T>> = {}): OffsetPage<T> {
  return {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 100,
    totalPages: 5,
    ...overrides,
  };
}

describe('clampPageSize', () => {
  it('falls back to the default for nonsense input', () => {
    expect(clampPageSize(0)).toBe(20);
    expect(clampPageSize(-5)).toBe(20);
    expect(clampPageSize(Number.NaN)).toBe(20);
  });

  it('caps runaway page sizes so a client cannot ask for the whole table', () => {
    expect(clampPageSize(5_000)).toBe(100);
  });
});

describe('toOffset', () => {
  it('is zero-based despite pages being one-based', () => {
    expect(toOffset({ page: 1, pageSize: 20 })).toBe(0);
    expect(toOffset({ page: 3, pageSize: 20 })).toBe(40);
  });

  it('treats page 0 as page 1 rather than producing a negative offset', () => {
    expect(toOffset({ page: 0, pageSize: 20 })).toBe(0);
  });
});

describe('nextOffsetPage', () => {
  it('advances while pages remain', () => {
    expect(nextOffsetPage(offsetPage({ page: 2 }))).toEqual({
      page: 3,
      pageSize: 20,
    });
  });

  it('returns undefined on the last page so React Query stops', () => {
    expect(nextOffsetPage(offsetPage({ page: 5 }))).toBeUndefined();
  });
});

describe('nextCursorPage', () => {
  const page: CursorPage<{ id: string }> = {
    items: [],
    nextCursor: 'abc',
    previousCursor: null,
    hasMore: true,
  };

  it('uses the returned cursor', () => {
    expect(nextCursorPage(page)).toEqual({ cursor: 'abc', limit: 20 });
  });

  it('stops when the server says there is no more, even with a cursor', () => {
    expect(nextCursorPage({ ...page, hasMore: false })).toBeUndefined();
  });
});

describe('dedupeById', () => {
  it('drops duplicates that concurrent inserts cause, keeping first order', () => {
    const result = dedupeById([
      { id: 'a' },
      { id: 'b' },
      { id: 'a' },
      { id: 'c' },
    ]);

    expect(result.map(item => item.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('flattenPages', () => {
  it('handles the undefined data React Query gives before the first fetch', () => {
    expect(flattenPages(undefined)).toEqual([]);
  });

  it('concatenates pages in order', () => {
    expect(flattenPages([{ items: [1, 2] }, { items: [3] }])).toEqual([
      1, 2, 3,
    ]);
  });
});

describe('shouldFetchNextPage', () => {
  it('triggers within the threshold of the end', () => {
    expect(shouldFetchNextPage(15, 20, 5)).toBe(true);
  });

  it('does not trigger early', () => {
    expect(shouldFetchNextPage(10, 20, 5)).toBe(false);
  });

  it('does not trigger on an empty list', () => {
    expect(shouldFetchNextPage(0, 0, 5)).toBe(false);
  });
});
