/**
 * QueryProvider — React Query wiring, the two native bridges it needs, and
 * disk persistence.
 *
 * WHY these live here and not in every screen:
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
 *
 *  3. **Persistence.** Swaps in `PersistQueryClientProvider` when
 *     `config.enableOfflineCache` is on, so a cold start restores the previous
 *     session's cache instead of showing spinners with no network. What is and
 *     is not written to disk is decided in `offline/queryPersistence.ts` — most
 *     importantly, health data never is.
 *
 * The provider is chosen once at render rather than conditionally *inside* one
 * tree, because swapping provider identity mid-session would remount every
 * consumer below it.
 */

import { useEffect, type ReactNode } from 'react';

import { AppState, type AppStateStatus } from 'react-native';

import { queryClient } from '@api/queryClient';
import {
  createPersistOptions,
  getConnectivityStatus,
  isQueryPersistenceEnabled,
  onConnectivityChange,
  startConnectivityListener,
} from '@offline';
import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

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

  if (!isQueryPersistenceEnabled()) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={createPersistOptions()}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
