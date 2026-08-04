/**
 * The React Query client and its global policy.
 *
 * WHY the defaults are set here rather than per-query:
 *   - A team of six will otherwise produce six different retry policies.
 *   - The retry predicate needs to understand `ApiError.kind`; expressing that
 *     once means no screen accidentally retries a 404 six times.
 *   - `refetchOnReconnect` is the backbone of the offline story: when the
 *     connectivity listener flips online, every stale query refetches without
 *     a single screen writing that logic.
 *
 * `throwOnError` is deliberately left false. Errors surface as `query.error`
 * so screens can render `ErrorState` inline; the ErrorBoundary is reserved for
 * genuine render crashes, not expected network failures.
 */

import { config } from '@config';
import {
  GcTime,
  QUERY_RETRY_COUNT,
  StaleTime,
} from '@constants/query.constants';
import { QueryClient } from '@tanstack/react-query';
import { exponentialBackoff } from '@utils/network';

import { ApiError } from './errors';

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= QUERY_RETRY_COUNT) {
    return false;
  }
  if (error instanceof ApiError) {
    return error.isRetryable;
  }
  // Unknown error shapes are usually programmer errors — retrying just hides
  // them behind a longer spinner.
  return false;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: StaleTime.short,
        gcTime: config.enableOfflineCache ? GcTime.default : GcTime.short,
        retry: shouldRetry,
        retryDelay: attempt => exponentialBackoff(attempt),
        // React Native has no window focus; the AppState listener in
        // `providers/QueryProvider` drives this instead.
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Showing cached data instantly and revalidating behind it is the
        // whole reason the offline cache exists.
        refetchOnMount: true,
        networkMode: config.enableOfflineCache ? 'offlineFirst' : 'online',
      },
      mutations: {
        // Mutations are never retried automatically — a retried booking is a
        // double booking. The offline queue replays them explicitly, with an
        // idempotency key.
        retry: false,
        networkMode: config.enableOfflineCache ? 'offlineFirst' : 'online',
      },
    },
  });
}

/** App-wide instance. Exported so non-React code (the sync manager, deep-link
 *  handlers) can invalidate caches. */
export const queryClient = createQueryClient();
