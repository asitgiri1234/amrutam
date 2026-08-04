/**
 * In-memory implementation of the storage port.
 *
 * WHY it ships in `src/` rather than in test helpers: it is also the fallback
 * for any environment without JSI (Jest, Storybook web, a future RN-Web build).
 * Having a real second implementation is what keeps the port honest — an
 * abstraction with exactly one implementation is just indirection.
 */

import type { KeyValueStorage } from './types';

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string | number | boolean>();

  return {
    getString: key => {
      const value = map.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getNumber: key => {
      const value = map.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getBoolean: key => {
      const value = map.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getObject<T>(key: string): T | undefined {
      const raw = map.get(key);
      if (typeof raw !== 'string') {
        return undefined;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        map.delete(key);
        return undefined;
      }
    },

    set: (key, value) => {
      map.set(key, value);
    },
    setObject: (key, value) => {
      map.set(key, JSON.stringify(value));
    },

    delete: key => {
      map.delete(key);
    },
    contains: key => map.has(key),
    getAllKeys: () => Array.from(map.keys()),
    clearAll: () => {
      map.clear();
    },
  };
}
