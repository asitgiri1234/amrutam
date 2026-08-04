/**
 * ToastProvider — owns the toast queue, timers and host container.
 *
 * WHY the queue is capped and FIFO: without a cap, a failed sync that retries
 * ten times stacks ten identical error toasts over the whole screen. Three is
 * enough to communicate "several things happened" without becoming a wall.
 *
 * WHY timers are tracked in a ref, not state: a re-render must not restart a
 * toast's countdown, or a busy screen keeps toasts alive indefinitely.
 *
 * The toast host renders above everything but *below* modals, and respects the
 * safe area — a toast under the notch is a toast nobody reads.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOAST_DURATION_MS } from '@constants/app.constants';
import { ToastContext, type ToastContextValue } from '@contexts/ToastContext';
import { Toast, type ToastItem, type ToastOptions } from '@design-system';
import { useTheme, type Theme } from '@theme';

const MAX_VISIBLE_TOASTS = 3;

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `toast-${idCounter}`;
}

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    for (const timer of timers.current.values()) {
      clearTimeout(timer);
    }
    timers.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback(
    (options: ToastOptions): string => {
      const id = nextId();
      const durationMs = options.durationMs ?? TOAST_DURATION_MS.short;

      const item: ToastItem = {
        id,
        message: options.message,
        variant: options.variant ?? 'info',
        durationMs,
        ...(options.title === undefined ? {} : { title: options.title }),
        ...(options.action === undefined ? {} : { action: options.action }),
      };

      setToasts(current => {
        const next = [...current, item];
        // Drop the oldest rather than refusing the newest — the most recent
        // message is almost always the relevant one.
        return next.length > MAX_VISIBLE_TOASTS
          ? next.slice(next.length - MAX_VISIBLE_TOASTS)
          : next;
      });

      // `0` pins the toast until explicitly dismissed (used for blocking
      // states like "no connection").
      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => {
            dismiss(id);
          }, durationMs),
        );
      }

      return id;
    },
    [dismiss],
  );

  // Clear every pending timer on unmount so a dismissed provider cannot
  // setState into a torn-down tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        clearTimeout(timer);
      }
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, title) =>
        show({
          message,
          variant: 'success',
          ...(title === undefined ? {} : { title }),
        }),
      error: (message, title) =>
        show({
          message,
          variant: 'error',
          durationMs: TOAST_DURATION_MS.long,
          ...(title === undefined ? {} : { title }),
        }),
      warning: (message, title) =>
        show({
          message,
          variant: 'warning',
          ...(title === undefined ? {} : { title }),
        }),
      info: (message, title) =>
        show({
          message,
          variant: 'info',
          ...(title === undefined ? {} : { title }),
        }),
      dismiss,
      dismissAll,
    }),
    [dismiss, dismissAll, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.length === 0 ? null : (
        <View
          pointerEvents="box-none"
          style={[styles.host, { top: insets.top + theme.spacing.sm }]}
        >
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    host: {
      left: theme.spacing.lg,
      position: 'absolute',
      right: theme.spacing.lg,
      rowGap: theme.spacing.sm,
      zIndex: 1000,
    },
  });
