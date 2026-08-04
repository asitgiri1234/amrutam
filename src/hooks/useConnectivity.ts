/**
 * Subscribe to connectivity from React.
 *
 * Uses `useSyncExternalStore` rather than useState+useEffect so the value is
 * correct on the very first render (no "online" flash before the effect runs)
 * and so it is tear-free under concurrent rendering.
 */

import { useCallback, useSyncExternalStore } from 'react';

import {
  getConnectivityStatus,
  onConnectivityChange,
  type ConnectivityStatus,
} from '@offline/connectivityListener';

export function useConnectivity(): ConnectivityStatus {
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

/** The boolean most callers actually want. */
export function useIsOnline(): boolean {
  const status = useConnectivity();
  return status.isConnected && status.isInternetReachable !== false;
}
