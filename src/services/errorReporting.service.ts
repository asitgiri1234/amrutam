/**
 * Global error handling.
 *
 * WHY a global handler in addition to the ErrorBoundary: the boundary only
 * catches *render-phase* errors. The two most common production crashes are
 * neither — an unhandled promise rejection in a data layer, and a native
 * exception. Without this, both terminate the app with no telemetry at all.
 *
 * WHY the reporting backend is injected rather than imported: whichever vendor
 * we pick (Sentry, Crashlytics, Bugsnag) should not be an import in a hundred
 * files, and this module must remain testable and free of native deps. The app
 * calls `setCrashReporter()` once at bootstrap.
 *
 * Note what is deliberately absent: any attempt to *recover*. A global handler
 * that swallows errors turns crashes into corruption. It reports, and lets the
 * platform do what it was going to do.
 */

import { config } from '@config';
import { logger, setLogSink, type LogEntry } from '@utils/logger';

const log = logger.scoped('errors');

export interface ErrorContext {
  scope?: string;
  componentStack?: string;
  [key: string]: unknown;
}

/** The vendor-agnostic surface a crash reporting SDK must satisfy. */
export interface CrashReporter {
  captureException(error: Error, context?: ErrorContext): void;
  /** Breadcrumbs give a crash its story — what happened in the 30s before. */
  addBreadcrumb(entry: LogEntry): void;
  setUser(userId: string | null): void;
}

let reporter: CrashReporter | null = null;

export function setCrashReporter(next: CrashReporter | null): void {
  reporter = next;

  // Route every log entry into the reporter as a breadcrumb. `logger` already
  // redacts tokens and health data, so nothing sensitive leaves the device.
  setLogSink(
    next === null
      ? null
      : entry => {
          next.addBreadcrumb(entry);
        },
  );
}

export function setReportingUser(userId: string | null): void {
  reporter?.setUser(userId);
}

/** Called by ErrorBoundary. */
export function reportFatalError(error: Error, context?: ErrorContext): void {
  log.error('Fatal render error', { message: error.message, ...context });

  if (config.enableCrashReporting) {
    reporter?.captureException(error, context);
  }
}

/** Called for handled-but-notable failures (a sync task that gave up). */
export function reportHandledError(
  error: unknown,
  context?: ErrorContext,
): void {
  const normalised = error instanceof Error ? error : new Error(String(error));

  log.warn('Handled error', { message: normalised.message, ...context });

  if (config.enableCrashReporting) {
    reporter?.captureException(normalised, { handled: true, ...context });
  }
}

/**
 * Installs the JS-engine-level handlers. Call once, as early as possible —
 * `app/bootstrap.ts` does this before React mounts.
 */
export function installGlobalErrorHandlers(): void {
  installUnhandledRejectionHandler();
  installGlobalExceptionHandler();
}

function installGlobalExceptionHandler(): void {
  // `ErrorUtils` is a React Native global with no public type declaration.
  const errorUtils = (
    globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
        setGlobalHandler: (
          handler: (error: unknown, isFatal?: boolean) => void,
        ) => void;
      };
    }
  ).ErrorUtils;

  if (errorUtils === undefined) {
    return;
  }

  const previousHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error, isFatal) => {
    const normalised =
      error instanceof Error ? error : new Error(String(error));

    reportFatalError(normalised, {
      scope: 'global',
      isFatal: isFatal ?? false,
    });

    // Chain to the default handler — it is what shows the red box in dev and
    // terminates cleanly in release. Suppressing it hides bugs.
    previousHandler(error, isFatal);
  });
}

function installUnhandledRejectionHandler(): void {
  const globalWithRejection = globalThis as unknown as {
    addEventListener?: (
      type: string,
      listener: (event: { reason?: unknown }) => void,
    ) => void;
  };

  // Hermes surfaces unhandled rejections through this event when the
  // promise-rejection tracking flag is on (RN enables it in dev by default).
  globalWithRejection.addEventListener?.('unhandledrejection', event => {
    reportHandledError(event.reason, { scope: 'unhandledRejection' });
  });
}
