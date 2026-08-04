/**
 * Cross-cutting type utilities.
 *
 * WHY a shared file: these appear in every layer's signatures. Redefining
 * `Nullable<T>` in six modules is how a codebase ends up with six subtly
 * different notions of "missing".
 */

export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ValueOf<T> = T[keyof T];

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/** Every domain entity carries a string id. FlashList keying and cache
 *  normalisation both depend on this being universal. */
export interface Entity {
  id: string;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

/**
 * Explicit success/failure without exceptions.
 *
 * WHY: repositories return `Result` instead of throwing. Throwing is fine at
 * the transport boundary, but once a value crosses into feature code the
 * caller should be *forced* by the type system to consider the failure branch.
 * `try/catch` gives no such guarantee and silently swallows typos.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok;
}

/** The four states any async view can be in. Modelled as a union so
 *  "loading and error at the same time" is unrepresentable. */
export type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

export type VoidFn = () => void;
