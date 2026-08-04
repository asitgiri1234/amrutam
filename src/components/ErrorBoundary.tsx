/**
 * ErrorBoundary — catches render-phase crashes.
 *
 * WHY a class component in 2026: React still offers no hook equivalent.
 * `componentDidCatch` / `getDerivedStateFromError` are only available on
 * classes, and every "hook-based error boundary" library is a class underneath.
 *
 * WHAT IT DOES NOT CATCH — worth knowing, because assuming otherwise leads to
 * silent failures:
 *   - errors in event handlers (use try/catch or the toast)
 *   - errors in async code / promises (the global handler covers those)
 *   - errors in the boundary's own render
 *
 * `resetKeys` exists so a boundary wrapped around a screen recovers when the
 * user navigates elsewhere and back, instead of staying broken for the rest of
 * the session.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { reportFatalError } from '@services/errorReporting.service';

import { ErrorFallback } from './ErrorFallback';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Changing any value here clears the error state. */
  resetKeys?: readonly unknown[];
  /** Label used in crash reports, e.g. "ConsultationTab". */
  scope?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function haveKeysChanged(
  previous: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined,
): boolean {
  if (previous === undefined || next === undefined) {
    return false;
  }
  if (previous.length !== next.length) {
    return true;
  }
  return previous.some((value, index) => !Object.is(value, next[index]));
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidUpdate(previousProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      haveKeysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportFatalError(error, {
      scope: this.props.scope ?? 'unknown',
      componentStack: info.componentStack ?? undefined,
    });

    this.props.onError?.(error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error === null) {
      return children;
    }

    if (fallback !== undefined) {
      return fallback(error, this.reset);
    }

    return <ErrorFallback error={error} onReset={this.reset} />;
  }
}
