/**
 * Toast contract. See `contexts/ThemeContext.ts` for why the contract lives
 * apart from the provider.
 */

import { createContext } from 'react';

import type { ToastOptions } from '@design-system';

export interface ToastContextValue {
  /** Returns the toast id so the caller can dismiss it early. */
  show: (options: ToastOptions) => string;
  /** Shorthands — the vast majority of call sites want one of these. */
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

ToastContext.displayName = 'ToastContext';
