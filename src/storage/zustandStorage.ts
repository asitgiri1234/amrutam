/**
 * Bridges the storage port to Zustand's `persist` middleware.
 *
 * WHY: stores should not know *where* they persist. Handing them this adapter
 * means switching the engine (MMKV -> encrypted -> remote) never touches a
 * single store file.
 */

import { createJSONStorage, type StateStorage } from 'zustand/middleware';

import { ZUSTAND_KEY_PREFIX } from './keys';
import type { KeyValueStorage } from './types';

function toStateStorage(storage: KeyValueStorage): StateStorage {
  return {
    getItem: name => storage.getString(ZUSTAND_KEY_PREFIX + name) ?? null,
    setItem: (name, value) => {
      storage.set(ZUSTAND_KEY_PREFIX + name, value);
    },
    removeItem: name => {
      storage.delete(ZUSTAND_KEY_PREFIX + name);
    },
  };
}

/**
 * Pass to `persist(..., { storage: createPersistStorage<T>(appStorage) })`.
 * Typed per-store so partialised state stays type-safe.
 */
export function createPersistStorage<T>(storage: KeyValueStorage) {
  return createJSONStorage<T>(() => toStateStorage(storage));
}
