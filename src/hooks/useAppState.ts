/**
 * Track foreground/background transitions.
 *
 * WHY a hook rather than each caller adding a listener: several features need
 * this (sync on foreground, pause a video consultation, re-check auth), and
 * each `AppState.addEventListener` is a native bridge subscription. It also
 * centralises the one detail people get wrong — distinguishing "returned to
 * foreground" from "is currently active", which are different events.
 */

import { useEffect, useRef, useState } from 'react';

import { AppState, type AppStateStatus } from 'react-native';

export function useAppState(): AppStateStatus {
  const [state, setState] = useState<AppStateStatus>(
    () => AppState.currentState,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setState);
    return () => {
      subscription.remove();
    };
  }, []);

  return state;
}

/**
 * Fires only on the background -> active transition, which is the event that
 * usually matters (refresh data, re-authenticate).
 */
export function useOnForeground(callback: () => void): void {
  const previous = useRef<AppStateStatus>(AppState.currentState);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      const wasBackgrounded =
        previous.current === 'background' || previous.current === 'inactive';

      if (wasBackgrounded && next === 'active') {
        callbackRef.current();
      }

      previous.current = next;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
