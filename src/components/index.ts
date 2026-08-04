/**
 * WHY `components/` exists alongside `design-system/`:
 *
 *   design-system/  primitives with zero app knowledge. A Button does not know
 *                   this is a healthcare app. Reusable in any product.
 *   components/     app-level compositions that DO know about this app — a
 *                   Screen shell that understands our tab-bar layout, an
 *                   ErrorBoundary wired to our crash reporter.
 *
 * Both are shared; the difference is *what they are allowed to know*. Keeping
 * the primitives ignorant is what makes them safe to change, and what would
 * let the design system be extracted into its own package later.
 *
 * Anything used by only one feature belongs in that module, not here.
 */

export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

export { ErrorFallback } from './ErrorFallback';
export type { ErrorFallbackProps } from './ErrorFallback';

export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
