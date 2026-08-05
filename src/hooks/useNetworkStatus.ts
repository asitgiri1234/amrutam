/**
 * Subscribe to connectivity from React.
 *
 * WHY `useSyncExternalStore` rather than useState + useEffect: the value is
 * correct on the very first render, so there is no "online" flash before the
 * effect runs, and it is tear-free under concurrent rendering. A component
 * that renders an offline banner must not render the wrong answer once.
 */

import { useCallback, useSyncExternalStore } from 'react';

import {
  getConnectivityStatus,
  onConnectivityChange,
  type ConnectivityStatus,
} from '@offline/connectivityListener';

/** Full connectivity detail: interface state, reachability, type, cost. */
export function useNetworkStatus(): ConnectivityStatus {
  const subscribe = useCallback(
    (onStoreChange: () => void) => onConnectivityChange(onStoreChange),
    [],
  );

  return useSyncExternalStore(
    subscribe,
    getConnectivityStatus,
    getConnectivityStatus,
  );
}

/**
 * The boolean most callers actually want.
 *
 * `isInternetReachable === null` means NetInfo is still probing; we treat that
 * as online so the first request is not needlessly blocked. Only an explicit
 * `false` — a connected interface with no working internet, i.e. hotel wifi or
 * a captive portal — counts as offline.
 */
export function useIsOnline(): boolean {
  const status = useNetworkStatus();
  return status.isConnected && status.isInternetReachable !== false;
}

/**
 * True on a metered connection. Feature code should consult this before
 * prefetching images or syncing large payloads.
 */
export function useIsExpensiveConnection(): boolean {
  return useNetworkStatus().isExpensive;
}

/** @deprecated Use `useNetworkStatus`. Kept so existing imports keep working. */
export const useConnectivity = useNetworkStatus;
