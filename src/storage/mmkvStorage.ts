/**
 * The MMKV-backed implementation of the storage port.
 *
 * WHY MMKV over AsyncStorage: it is synchronous. That single property removes
 * an entire class of bugs — no `await` before first paint, so the theme, the
 * auth token and the offline queue are all readable during module init and the
 * app never flashes an unthemed or logged-out frame.
 *
 * Note the port's `delete()` maps to MMKV v4's `remove()`. That rename is
 * exactly the kind of churn the port exists to absorb — it happens here, once,
 * instead of at every call site.
 */

import { createMMKV } from 'react-native-mmkv';

import type { KeyValueStorage, StorageBucket } from './types';

/** Per-bucket instance ids. Separate files => independent lifetimes. */
const BUCKET_IDS: Record<StorageBucket, string> = {
  app: 'amrutam.app',
  cache: 'amrutam.cache',
  secure: 'amrutam.secure',
};

function createMmkvStorage(bucket: StorageBucket): KeyValueStorage {
  const mmkv = createMMKV({ id: BUCKET_IDS[bucket] });

  return {
    getString: key => mmkv.getString(key),
    getNumber: key => mmkv.getNumber(key),
    getBoolean: key => mmkv.getBoolean(key),

    getObject<T>(key: string): T | undefined {
      const raw = mmkv.getString(key);
      if (raw === undefined) {
        return undefined;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        // Corrupt entry: drop it rather than crashing on every read.
        mmkv.remove(key);
        return undefined;
      }
    },

    set: (key, value) => mmkv.set(key, value),
    setObject: (key, value) => mmkv.set(key, JSON.stringify(value)),

    delete: key => {
      mmkv.remove(key);
    },
    contains: key => mmkv.contains(key),
    getAllKeys: () => mmkv.getAllKeys(),
    clearAll: () => mmkv.clearAll(),
  };
}

/** Long-lived preferences and device identity. Survives logout. */
export const appStorage = createMmkvStorage('app');

/** Derived, re-fetchable data. Safe to clear at any moment. */
export const cacheStorage = createMmkvStorage('cache');

/**
 * Credentials. Isolated so `logout()` is a single `clearAll()` that cannot
 * accidentally take the user's theme or onboarding state with it.
 *
 * NOTE: MMKV's `encrypt()` is not a Keychain/Keystore replacement. When the
 * auth module lands, the encryption key itself must come from the platform
 * secure store — tracked as the first task of that milestone.
 */
export const secureStorage = createMmkvStorage('secure');
