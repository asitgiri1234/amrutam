/**
 * The environment contract.
 *
 * WHY an interface: every environment file must supply *every* key. Adding a
 * new flag and forgetting to set it in production becomes a compile error
 * rather than an `undefined` that only surfaces in a release build.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface AppConfig {
  readonly env: AppEnvironment;

  /* ---- Networking ------------------------------------------------------ */
  readonly apiBaseUrl: string;
  /** Milliseconds before an HTTP request is aborted. */
  readonly apiTimeoutMs: number;
  /** How many times the transport retries idempotent, retryable failures. */
  readonly apiRetryCount: number;

  /* ---- Diagnostics ----------------------------------------------------- */
  readonly logLevel: LogLevel;
  /** Send crashes/errors to the reporting backend. Off locally so we don't
   *  pollute production dashboards with developer noise. */
  readonly enableCrashReporting: boolean;
  readonly enableAnalytics: boolean;
  /** Surfaces the React Query devtools / in-app debug menu. */
  readonly enableDevTools: boolean;

  /* ---- Behaviour ------------------------------------------------------- */
  /** Serve mock data instead of hitting the network. Wired to the `mocks/`
   *  layer once the first module lands. */
  readonly useMockData: boolean;
  /** Persist the React Query cache to disk for offline-first reads. */
  readonly enableOfflineCache: boolean;
  /** How long a persisted cache entry stays usable, in ms. */
  readonly cacheTtlMs: number;
}
