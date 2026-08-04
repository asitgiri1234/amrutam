/**
 * The wire contract.
 *
 * WHY these live in `types/` rather than `api/`: repositories, the offline
 * queue and the mock factories all speak this shape. Keeping it in the shared
 * type layer means `offline/` can describe a queued request without importing
 * axios.
 */

/** Standard envelope every endpoint returns. */
export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  /** Server-generated id, echoed in logs and crash reports for correlation. */
  requestId?: string;
}

export interface ApiListMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiListEnvelope<T> {
  data: T[];
  meta: ApiListMeta;
}

/** The error body our backend returns. Mirrored by `ApiError` in `api/errors`. */
export interface ApiErrorBody {
  code: string;
  message: string;
  /** Field-level messages for form validation (422). */
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  signal?: AbortSignal;
  /** Skip the auth interceptor — used for login/refresh endpoints. */
  skipAuth?: boolean;
  /** Per-request override of the transport retry count. */
  retries?: number;
  headers?: Record<string, string>;
  /**
   * Marks a mutation as safe to replay. The offline queue refuses to enqueue
   * anything without one, so a flaky connection can never double-charge a
   * shop order.
   */
  idempotencyKey?: string;
}

export interface SortParam {
  field: string;
  direction: 'asc' | 'desc';
}
