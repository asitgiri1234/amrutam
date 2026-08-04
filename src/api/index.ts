/**
 * WHY `api/` exists:
 *
 * It is the *transport* boundary — the only place that knows HTTP exists.
 * Its job is to turn "the network" into a predictable, typed, testable
 * function call, and to absorb every way the network can be unpleasant:
 * flaky connections, expired tokens, rate limits, four different axios error
 * shapes, envelopes, retries, cancellation.
 *
 * Its job is explicitly NOT to know what a Doctor is. That belongs to
 * `repositories/`, one layer up. Keeping the two separate is what lets us
 * unit-test business rules with a fake repository and integration-test the
 * transport with a mock server, independently.
 *
 * Layering:
 *   screens -> hooks -> repositories -> api -> axios
 */

export { apiClient, createApiClient } from './client';
export type { CreateApiClientOptions } from './client';

export { http, HttpClient } from './httpClient';
export type { ListResult } from './httpClient';

export { ApiError, isApiError, normalizeError } from './errors';
export type { ApiErrorKind } from './errors';

export { Endpoints } from './endpoints';

export { createQueryClient, queryClient } from './queryClient';

export { setAuthTokenProvider } from './interceptors/auth.interceptor';
export type { AuthTokenProvider } from './interceptors/auth.interceptor';
