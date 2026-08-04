/**
 * Error normalisation — the most important file in the API layer.
 *
 * WHY: axios throws four structurally different things (a response error, a
 * request error with no response, a cancellation, and a plain JS error from an
 * interceptor). If that leaks past the transport, every screen ends up writing
 * `err?.response?.data?.message ?? err.message ?? 'Something went wrong'`, and
 * each one gets it slightly wrong.
 *
 * Everything above `api/` sees exactly one shape: `ApiError`, with a `kind`
 * that maps 1:1 onto a UI decision.
 */

import axios from 'axios';

import type { ApiErrorBody } from '@app-types/api.types';

export type ApiErrorKind =
  /** No network, DNS failure, airplane mode. Retryable; show offline UI. */
  | 'network'
  /** Server took too long. Retryable. */
  | 'timeout'
  /** 401/403. Triggers the refresh flow, then logout. */
  | 'unauthorized'
  /** 404. Retry is pointless; navigate away. */
  | 'notFound'
  /** 422 with field errors. Feed straight into React Hook Form. */
  | 'validation'
  /** 429. Back off. */
  | 'rateLimited'
  /** 5xx. Our fault; retryable. */
  | 'server'
  /** Request was aborted by us (screen unmounted). Never show UI for this. */
  | 'cancelled'
  /** Anything we failed to classify. */
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Machine-readable code from the backend, e.g. `SLOT_ALREADY_BOOKED`. */
  readonly code?: string;
  /** Field-level messages for 422 responses. */
  readonly fieldErrors?: Record<string, string[]>;
  /** Correlation id — surfaced in ErrorState and sent to crash reporting. */
  readonly requestId?: string;
  readonly cause?: unknown;

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    status?: number;
    code?: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors;
    this.requestId = params.requestId;
    this.cause = params.cause;

    // Required so `instanceof ApiError` works after TS downlevels to ES5-ish
    // targets, which Hermes still effectively is for class extends of Error.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True when another attempt could plausibly succeed. */
  get isRetryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'server' ||
      this.kind === 'rateLimited'
    );
  }

  /** Copy safe to show a user. Never expose `message` from a 500 directly —
   *  it can contain stack traces or internal hostnames. */
  get userMessage(): string {
    switch (this.kind) {
      case 'network':
        return 'You appear to be offline. Check your connection and try again.';
      case 'timeout':
        return 'That took too long. Please try again.';
      case 'unauthorized':
        return 'Your session has expired. Please sign in again.';
      case 'notFound':
        return 'We could not find what you were looking for.';
      case 'validation':
        return this.message;
      case 'rateLimited':
        return 'Too many requests. Please wait a moment.';
      case 'server':
        return 'Something went wrong on our side. Please try again.';
      case 'cancelled':
        return '';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401 || status === 403) {
    return 'unauthorized';
  }
  if (status === 404) {
    return 'notFound';
  }
  if (status === 422 || status === 400) {
    return 'validation';
  }
  if (status === 429) {
    return 'rateLimited';
  }
  if (status >= 500) {
    return 'server';
  }
  return 'unknown';
}

/**
 * The single funnel every thrown value passes through.
 * Accepts `unknown` on purpose — catch clauses are `unknown` under strict mode
 * and we must not assume the shape of what we caught.
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError({
      kind: 'cancelled',
      message: 'Request cancelled',
      cause: error,
    });
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        kind: 'timeout',
        message: 'Request timed out',
        cause: error,
      });
    }

    const { response } = error;

    if (response === undefined) {
      // Request left the app but never got a response.
      return new ApiError({
        kind: 'network',
        message: 'Network request failed',
        cause: error,
      });
    }

    const body = response.data as Partial<ApiErrorBody> | undefined;

    return new ApiError({
      kind: kindFromStatus(response.status),
      message: body?.message ?? error.message,
      status: response.status,
      code: body?.code,
      fieldErrors: body?.fieldErrors,
      requestId:
        body?.requestId ??
        (typeof response.headers['x-request-id'] === 'string'
          ? response.headers['x-request-id']
          : undefined),
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      kind: 'unknown',
      message: error.message,
      cause: error,
    });
  }

  return new ApiError({
    kind: 'unknown',
    message: 'An unexpected error occurred',
    cause: error,
  });
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
