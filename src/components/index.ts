/**
 * WHY `components/` exists alongside `design-system/`:
 *
 *   design-system/  presentational primitives with zero app knowledge — a
 *                   Button does not know this is a healthcare app, and a
 *                   Screen only knows about safe areas and the theme. Both
 *                   are reusable in any product.
 *   components/     compositions wired to app *infrastructure* — the
 *                   ErrorBoundary reports to our crash reporter, and its
 *                   fallback reads our environment config.
 *
 * The dividing line is dependency direction, not complexity: nothing in
 * `design-system/` may import from `services/`, `config/` or `api/`. That is
 * what would let the design system be extracted into its own package.
 *
 * `Screen` lives in `design-system/` for exactly that reason — it composes
 * Loader and ErrorState and touches nothing but the theme.
 *
 * Anything used by only one feature belongs in that module, not here.
 */

export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

export { ErrorFallback } from './ErrorFallback';
export type { ErrorFallbackProps } from './ErrorFallback';
