/**
 * The doctor list's data source.
 *
 * Owns three things the screen should not:
 *   1. translating UI filter state into the repository's wire filters
 *   2. paging, via `useInfiniteQuery`
 *   3. flattening pages into the single array FlashList consumes
 *
 * WHY offset paging and not cursor: the repository contract's `list` is
 * offset-based, and the mock mirrors it. Cursor paging is the better choice
 * for a catalogue with live inserts (see `utils/pagination.ts`), and swapping
 * to it later touches this file and the repository — not the screen.
 */

import { useCallback, useMemo } from 'react';

import type { ListResult } from '@api/httpClient';
import { QueryKeys, StaleTime } from '@constants/query.constants';
import type { Doctor } from '@models';
import type { DoctorFilters } from '@repositories/contracts';
import {
  EXPERIENCE_MAX_YEARS,
  EXPERIENCE_MIN_YEARS,
  type DoctorListFilters,
} from '@store/consultation.store';
import { useInfiniteQuery } from '@tanstack/react-query';

import { getDoctorRepository } from '../repositories';

export const DOCTOR_PAGE_SIZE = 20;

/**
 * Maps UI filter state to repository filters.
 *
 * Empty values become `undefined` rather than empty arrays or empty strings.
 * That matters for more than tidiness: the filter object is part of the query
 * key, so `{ specialities: [] }` and `{}` would be two different cache entries
 * for identical results.
 */
export function toRepositoryFilters(
  filters: DoctorListFilters,
): Omit<DoctorFilters, 'page' | 'pageSize'> {
  const trimmedQuery = filters.query.trim();
  const experience = filters.experience;

  return {
    ...(trimmedQuery.length > 0 ? { query: trimmedQuery } : {}),
    ...(filters.specialities.length > 0
      ? { specialities: filters.specialities }
      : {}),
    ...(filters.modes.length > 0 ? { modes: filters.modes } : {}),
    ...(experience === null
      ? {}
      : {
          minExperienceYears: EXPERIENCE_MIN_YEARS[experience],
          ...(EXPERIENCE_MAX_YEARS[experience] === null
            ? {}
            : {
                maxExperienceYears: EXPERIENCE_MAX_YEARS[experience] as number,
              }),
        }),
    ...(filters.maxFeeMinor === null
      ? {}
      : { maxFeeMinor: filters.maxFeeMinor }),
    ...(filters.minRating === null ? {} : { minRating: filters.minRating }),
    ...(filters.acceptingPatientsOnly ? { acceptingPatientsOnly: true } : {}),
  };
}

export interface UseDoctorListResult {
  doctors: Doctor[];
  /** Total matching the filters — not the number loaded so far. */
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: Error | null;
  loadNextPage: () => void;
  refresh: () => void;
  retry: () => void;
}

export function useDoctorList(filters: DoctorListFilters): UseDoctorListResult {
  const repositoryFilters = useMemo(
    () => toRepositoryFilters(filters),
    [filters],
  );

  const query = useInfiniteQuery({
    queryKey: QueryKeys.doctors.list(repositoryFilters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getDoctorRepository().list(
        {
          ...repositoryFilters,
          page: pageParam,
          pageSize: DOCTOR_PAGE_SIZE,
        },
        { signal },
      ),
    getNextPageParam: (lastPage: ListResult<Doctor>) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    // Doctor profiles change slowly; availability does not, but that is a
    // separate query. Refetching this list on every mount would throw away a
    // scrolled position for no benefit.
    staleTime: StaleTime.medium,
  });

  const doctors = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data],
  );

  const totalCount = query.data?.pages[0]?.meta.totalItems ?? 0;

  const loadNextPage = useCallback(() => {
    // Guarding here rather than at the call site: FlashList fires
    // `onEndReached` repeatedly while the user sits at the bottom, and without
    // this every one of those would queue another fetch.
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  const retry = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    doctors,
    totalCount,
    // `isLoading` is true only for the first load of a given filter set, so a
    // filter change shows the skeleton rather than a blank screen.
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error,
    loadNextPage,
    refresh,
    retry,
  };
}
