/**
 * WHY `services/` exists — and how it differs from `repositories/`:
 *
 *   repositories/  fetch and shape *domain data*. "Give me doctor 42."
 *   services/      cross-cutting *capabilities* with side effects that are not
 *                  data access. Crash reporting, analytics, notifications,
 *                  deep links, permissions.
 *
 * The distinguishing test: a service is something you would still need if the
 * app had no backend at all.
 *
 * Every service in here follows the same pattern — a vendor-agnostic interface
 * plus a `setX()` injection point, so no third-party SDK becomes an import in
 * a hundred files, and so tests never need native mocks.
 */

export {
  installGlobalErrorHandlers,
  reportFatalError,
  reportHandledError,
  setCrashReporter,
  setReportingUser,
} from './errorReporting.service';
export type { CrashReporter, ErrorContext } from './errorReporting.service';
