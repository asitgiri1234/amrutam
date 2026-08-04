/**
 * Connectivity listener.
 *
 * WHY it is not just `NetInfo.addEventListener` at the call site:
 *
 *   1. **"Connected" is not "online".** Hotel wifi, captive portals and Indian
 *      mobile networks routinely report a connected interface with no working
 *      internet. NetInfo's `isInternetReachable` captures that distinction and
 *      it is the one that actually matters — we expose both.
 *   2. **One subscription, many consumers.** The sync manager, the query
 *      client and the UI banner all need this. N subscriptions means N native
 *      bridge callbacks per network flap.
 *   3. **A synchronous snapshot.** Code that runs before React (the queue
 *      processor) needs to ask "are we online?" without awaiting.
 */

import NetInfo, {
  NetInfoStateType,
  type NetInfoState,
} from '@react-native-community/netinfo';
import { logger } from '@utils/logger';

const log = logger.scoped('connectivity');

export interface ConnectivityStatus {
  /** A network interface is up. */
  isConnected: boolean;
  /**
   * Traffic actually reaches the internet. `null` while NetInfo is still
   * probing — treat as "assume yes" so we don't block the first request.
   */
  isInternetReachable: boolean | null;
  type: NetInfoState['type'];
  /** Cellular connections get more conservative prefetching. */
  isExpensive: boolean;
}

export type ConnectivityListener = (status: ConnectivityStatus) => void;

const INITIAL_STATUS: ConnectivityStatus = {
  isConnected: true,
  isInternetReachable: null,
  type: NetInfoStateType.unknown,
  isExpensive: false,
};

let current: ConnectivityStatus = INITIAL_STATUS;
let unsubscribeNetInfo: (() => void) | null = null;
const listeners = new Set<ConnectivityListener>();

function toStatus(state: NetInfoState): ConnectivityStatus {
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
    isExpensive:
      state.details !== null && 'isConnectionExpensive' in state.details
        ? Boolean(state.details.isConnectionExpensive)
        : state.type === NetInfoStateType.cellular,
  };
}

function hasChanged(a: ConnectivityStatus, b: ConnectivityStatus): boolean {
  return (
    a.isConnected !== b.isConnected ||
    a.isInternetReachable !== b.isInternetReachable ||
    a.type !== b.type
  );
}

/** Idempotent — safe to call from bootstrap and from a provider. */
export function startConnectivityListener(): void {
  if (unsubscribeNetInfo !== null) {
    return;
  }

  unsubscribeNetInfo = NetInfo.addEventListener(state => {
    const next = toStatus(state);

    if (!hasChanged(current, next)) {
      return;
    }

    current = next;
    log.info('connectivity changed', next);

    for (const listener of listeners) {
      listener(next);
    }
  });
}

export function stopConnectivityListener(): void {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = null;
  listeners.clear();
  current = INITIAL_STATUS;
}

/** Subscribe; returns an unsubscribe function. */
export function onConnectivityChange(
  listener: ConnectivityListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Synchronous snapshot for non-React callers. */
export function getConnectivityStatus(): ConnectivityStatus {
  return current;
}

/**
 * The question most callers actually mean.
 * `isInternetReachable === null` means "still probing" — we optimistically
 * treat that as online so the first request is not needlessly blocked.
 */
export function isOnline(): boolean {
  return current.isConnected && current.isInternetReachable !== false;
}

/** Forces a fresh probe — used after the app returns from background. */
export async function refreshConnectivity(): Promise<ConnectivityStatus> {
  const state = await NetInfo.refresh();
  current = toStatus(state);
  return current;
}
