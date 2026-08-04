/**
 * WHY `providers/` exists:
 *
 * Every non-trivial React Native app accumulates six to ten providers, and the
 * order they nest in is load-bearing (see the comment in `AppProviders.tsx`).
 * Leaving that pile inline in `App.tsx` means the single most order-sensitive
 * code in the app lives in the file people edit most casually.
 *
 * Concentrating it here also gives tests a real composition root:
 * `renderWithProviders` in `tests/` reuses the same tree, so a component
 * behaves identically in a test and in the app.
 */

export { AppProviders } from './AppProviders';
export type { AppProvidersProps } from './AppProviders';

export { ThemeProvider } from './ThemeProvider';
export type { ThemeProviderProps } from './ThemeProvider';

export { QueryProvider } from './QueryProvider';
export type { QueryProviderProps } from './QueryProvider';

export { ToastProvider } from './ToastProvider';
export type { ToastProviderProps } from './ToastProvider';
