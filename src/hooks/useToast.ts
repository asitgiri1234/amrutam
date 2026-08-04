/**
 * Access the toast queue.
 *
 * Throws outside the provider rather than returning a no-op: a silently
 * swallowed toast is a bug you discover from a support ticket.
 */

import { useContext } from 'react';

import { ToastContext, type ToastContextValue } from '@contexts/ToastContext';

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);

  if (value === null) {
    throw new Error(
      'useToast() was called outside of <ToastProvider>. Wrap the tree in <AppProviders>.',
    );
  }

  return value;
}
