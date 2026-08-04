/**
 * The storage *port* (in the hexagonal-architecture sense).
 *
 * WHY an interface instead of importing MMKV everywhere: MMKV is a JSI native
 * module. Importing it directly from feature code would (a) make every unit
 * test need a native runtime, and (b) weld us to one storage engine forever.
 * With a port, the in-memory adapter serves tests, MMKV serves the device, and
 * a future encrypted/SQLite adapter is a drop-in.
 */

export interface KeyValueStorage {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  /** JSON-decoded read. Returns `undefined` on missing *or* malformed data. */
  getObject<T>(key: string): T | undefined;

  set(key: string, value: string | number | boolean): void;
  /** JSON-encoded write. */
  setObject<T>(key: string, value: T): void;

  delete(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

/** Logical partitions. Each maps to its own physical MMKV instance so that
 *  clearing the cache can never take the user's session with it. */
export type StorageBucket = 'app' | 'cache' | 'secure';
