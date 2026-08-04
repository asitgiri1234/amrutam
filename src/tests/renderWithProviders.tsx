/**
 * The standard render helper.
 *
 * WHY tests must not use RTL's bare `render`: a component rendered without the
 * providers is a component in a state that never occurs in the app. `useTheme`
 * throws, queries have no client, toasts have no host. Wrapping once here
 * means a test asserts on real behaviour, and means adding a provider later
 * does not require touching a hundred test files.
 *
 * A fresh QueryClient per render is deliberate: a shared one leaks cache
 * between tests and produces the worst kind of failure — one that only
 * reproduces when the whole suite runs.
 */

import type { ReactElement, ReactNode } from 'react';

import { ThemeProvider } from '@providers/ThemeProvider';
import { ToastProvider } from '@providers/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ThemePreference } from '@theme';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Retries turn a one-line assertion failure into a multi-second timeout.
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderWithProvidersOptions
  extends Omit<RenderOptions, 'wrapper'> {
  /** Force a theme so a test can assert dark-mode rendering explicitly. */
  theme?: ThemePreference;
  queryClient?: QueryClient;
}

export type RenderWithProvidersResult = Awaited<ReturnType<typeof render>> & {
  queryClient: QueryClient;
};

/**
 * `async` because React Native Testing Library v14 made `render` and
 * `fireEvent` asynchronous — they await React's concurrent commit rather than
 * assuming a synchronous flush. Every call site must `await`.
 */
export async function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): Promise<RenderWithProvidersResult> {
  const {
    theme = 'light',
    queryClient = createTestQueryClient(),
    ...rest
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider forcedPreference={theme}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  const result = await render(ui, { wrapper: Wrapper, ...rest });

  return Object.assign(result, { queryClient });
}
