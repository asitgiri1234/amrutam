/**
 * The generic API wrapper — the only surface repositories touch.
 *
 * WHY it exists on top of axios:
 *   1. **Unwraps the envelope.** Our API returns `{ data, meta }`. Doing
 *      `response.data.data` in 200 call sites is both ugly and fragile if the
 *      envelope ever changes.
 *   2. **Normalises errors.** Everything it throws is an `ApiError`.
 *   3. **Keeps axios replaceable.** No file above `api/` imports axios, so
 *      swapping the transport (to fetch, or to a GraphQL client for one
 *      module) is contained.
 *   4. **Makes cancellation and idempotency first-class**, rather than
 *      per-call axios config that people forget.
 *
 * Endpoints are deliberately NOT defined here — see `endpoints.ts`.
 */

import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import type {
  ApiEnvelope,
  ApiListEnvelope,
  ApiListMeta,
  RequestOptions,
} from '@app-types/api.types';

import { apiClient } from './client';
import { normalizeError } from './errors';

export interface ListResult<T> {
  items: T[];
  meta: ApiListMeta;
}

function toAxiosConfig(options: RequestOptions = {}): AxiosRequestConfig {
  const { signal, skipAuth, retries, headers, idempotencyKey } = options;

  return {
    ...(signal === undefined ? {} : { signal }),
    ...(retries === undefined ? {} : { retries }),
    ...(skipAuth === undefined ? {} : { skipAuth }),
    headers: {
      ...headers,
      ...(idempotencyKey === undefined
        ? {}
        : { 'Idempotency-Key': idempotencyKey }),
    },
    // `skipAuth`/`retries` are custom keys read by our interceptors; axios
    // passes unknown config through untouched.
  } as AxiosRequestConfig;
}

export class HttpClient {
  constructor(private readonly instance: AxiosInstance = apiClient) {}

  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>({
      ...toAxiosConfig(options),
      method: 'GET',
      url,
      params,
    });
  }

  /** Paginated GET. Returns items + meta rather than the raw envelope. */
  async getList<T>(
    url: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ListResult<T>> {
    try {
      const response = await this.instance.request<ApiListEnvelope<T>>({
        ...toAxiosConfig(options),
        method: 'GET',
        url,
        params,
      });

      return { items: response.data.data, meta: response.data.meta };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async post<T, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>({
      ...toAxiosConfig(options),
      method: 'POST',
      url,
      data: body,
    });
  }

  async put<T, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>({
      ...toAxiosConfig(options),
      method: 'PUT',
      url,
      data: body,
    });
  }

  async patch<T, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>({
      ...toAxiosConfig(options),
      method: 'PATCH',
      url,
      data: body,
    });
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({
      ...toAxiosConfig(options),
      method: 'DELETE',
      url,
    });
  }

  /** Escape hatch for endpoints that do not use the standard envelope
   *  (file uploads, third-party hosts). */
  async raw<T>(requestConfig: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.request<T>(requestConfig);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  private async request<T>(requestConfig: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.request<ApiEnvelope<T>>(
        requestConfig,
      );
      return response.data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

/** Shared instance. Repositories receive this by default but may be handed a
 *  different one in tests — see `BaseRepository`. */
export const http = new HttpClient();
