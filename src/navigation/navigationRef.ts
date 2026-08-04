/**
 * Imperative navigation handle.
 *
 * WHY it exists: several things need to navigate from outside React —
 *   - a push notification tapped while the app is backgrounded
 *   - the auth interceptor, when a refresh fails and the session must end
 *   - a deep link resolved before any screen has mounted
 *
 * The ref is guarded by `isReady()`. Calling `navigate` before the container
 * mounts is a no-op in React Navigation and a silent bug for us, so these
 * wrappers queue nothing and warn instead of failing quietly.
 */

import {
  createNavigationContainerRef,
  type NavigationContainerRefWithCurrent,
} from '@react-navigation/native';
import { logger } from '@utils/logger';

import type { RootStackParamList } from './types';

const log = logger.scoped('navigation');

export const navigationRef: NavigationContainerRefWithCurrent<RootStackParamList> =
  createNavigationContainerRef<RootStackParamList>();

export function navigate<T extends keyof RootStackParamList>(
  screen: T,
  params?: RootStackParamList[T],
): void {
  if (!navigationRef.isReady()) {
    log.warn('navigate() called before the navigator was ready', { screen });
    return;
  }

  // React Navigation's `navigate` is a set of overloads that TypeScript cannot
  // resolve against a generic route name. The public signature above is the
  // type-safe surface; this one cast is contained to a single line.
  (
    navigationRef.navigate as unknown as (
      name: string,
      params?: unknown,
    ) => void
  )(screen, params);
}

export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/** Current route name — used for analytics screen tracking. */
export function getCurrentRouteName(): string | undefined {
  return navigationRef.isReady()
    ? navigationRef.getCurrentRoute()?.name
    : undefined;
}
