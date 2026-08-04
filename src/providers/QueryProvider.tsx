/**
 * QueryProvider — React Query wiring, plus the two native bridges it needs.
 *
 * WHY these two effects live here and not in every screen:
 *
 *  1. **AppState -> refetch.** React Query's `refetchOnWindowFocus` is a web
 *     concept; there is no window. Without this bridge, a user who backgrounds
 *     the app for an hour returns to stale prices and stale doctor
 *     availability with no indication anything is old.
 *
 *  2. **NetInfo -> onlineManager.** React Query has its own idea of "online"
 *     that defaults to a browser API. Feeding it our connectivity listener is
 *     what makes `networkMode: 'offlineFirst'` and paused mutations behave
 *     correctly — otherwise queries fire into a dead socket and fail instead
 *     of waiting.
 */

import { useEffect, type ReactNode } from 'react';

import { AppState, type AppStateStatus } from 'react-native';

import { queryClient } from '@api/queryClient';
import {
  getConnectivityStatus,
  onConnectivityChange,
  startConnectivityListener,
} from '@offline';
import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';

export interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    startConnectivityListener();

    onlineManager.setOnline(
      getConnectivityStatus().isConnected &&
        getConnectivityStatus().isInternetReachable !== false,
    );

    return onConnectivityChange(status => {
      onlineManager.setOnline(
        status.isConnected && status.isInternetReachable !== false,
      );
    });
  }, []);

  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      focusManager.setFocused(state === 'active');
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
