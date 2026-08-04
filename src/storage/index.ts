/**
 * WHY `storage/` exists:
 *
 * Persistence is a *capability*, not a feature. Every layer above it (stores,
 * offline queue, auth, theme) needs to read and write durable state, and none
 * of them should care that the engine is MMKV. This folder owns:
 *
 *   - the port          (`types.ts`)
 *   - the adapters      (`mmkvStorage.ts`, `memoryStorage.ts`)
 *   - the key registry  (`keys.ts`)
 *   - framework bridges (`zustandStorage.ts`)
 *
 * The bucket split (app / cache / secure) is the important design decision:
 * it makes "clear the cache" and "log the user out" independent, safe
 * operations instead of two routines that must remember to skip each other's
 * keys.
 */

export type { KeyValueStorage, StorageBucket } from './types';
export { StorageKeys, ZUSTAND_KEY_PREFIX } from './keys';
export type { StorageKey } from './keys';
export { appStorage, cacheStorage, secureStorage } from './mmkvStorage';
export { createMemoryStorage } from './memoryStorage';
export { createPersistStorage } from './zustandStorage';
