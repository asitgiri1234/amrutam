/**
 * Store factory — the house style for every Zustand store.
 *
 * WHY a factory instead of calling `create()` directly in each store:
 *
 *   1. **Consistent middleware.** `subscribeWithSelector` everywhere, so
 *      non-React code (the sync manager, the queue processor) can react to
 *      state changes without mounting a component. Persistence is opt-in.
 *   2. **One place to change persistence.** Switching storage engines or
 *      adding migrations touches this file, not five stores.
 *   3. **A reset contract.** Logout must clear every store. Registering each
 *      store here means `resetAllStores()` cannot miss one — the most common
 *      "previous user's data leaked" bug in a multi-account app.
 *
 * WHY Zustand and not Redux/Context for this app: server state lives in React
 * Query, so the remaining global state is small — session, cart badge, UI
 * flags. Zustand's selector-based subscriptions mean a cart-count change
 * re-renders the badge and nothing else, which Context cannot do without
 * splitting into a dozen providers.
 */

import {
  create,
  type StateCreator,
  type StoreApi,
  type UseBoundStore,
} from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { appStorage, createPersistStorage } from '@storage';

export interface PersistConfig<T> {
  /**
   * Only these keys are written to disk. Never persist tokens here — those
   * belong in the `secure` storage bucket.
   */
  partialize: (state: T) => Partial<T>;
  /** Bump when the persisted shape changes; pair with `migrate`. */
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
}

export interface StoreOptions<T> {
  /** Store name — also the persistence key. */
  name: string;
  /**
   * Omit to keep the store in memory only. Most stores should be in-memory:
   * persisting server data is React Query's job, and persisting derived UI
   * state creates confusing resume behaviour.
   */
  persist?: PersistConfig<T>;
}

export type AppStore<T> = UseBoundStore<StoreApi<T>>;

/** Registry of reset functions, so logout can clear everything at once. */
const resetFns = new Set<() => void>();

/** Call on logout. Clears every store created through this factory. */
export function resetAllStores(): void {
  for (const reset of resetFns) {
    reset();
  }
}

export function createAppStore<T extends object>(
  initializer: StateCreator<T>,
  options: StoreOptions<T>,
): AppStore<T> {
  const persistConfig = options.persist;

  const withPersistence: StateCreator<T> =
    persistConfig === undefined
      ? initializer
      : (persist(initializer, {
          name: options.name,
          storage: createPersistStorage<T>(appStorage),
          partialize: persistConfig.partialize as (state: T) => T,
          version: persistConfig.version ?? 1,
          ...(persistConfig.migrate === undefined
            ? {}
            : { migrate: persistConfig.migrate }),
        }) as unknown as StateCreator<T>);

  const store = create<T>()(
    subscribeWithSelector(withPersistence) as unknown as StateCreator<T>,
  );

  const initialState = { ...store.getState() };
  resetFns.add(() => {
    store.setState(initialState, true);
  });

  return store;
}
