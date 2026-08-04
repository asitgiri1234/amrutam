/**
 * The only sanctioned way to read the theme.
 *
 * WHY `useThemedStyles` exists: `StyleSheet.create` at module scope cannot see
 * the theme, and building a fresh style object on every render is wasteful in
 * long lists. The factory pattern gives us both — theme-aware styles that are
 * memoised per theme object, so they are recomputed only when the theme
 * actually changes (mode switch), not on every render.
 *
 * Usage:
 *   const styles = useThemedStyles(createStyles);
 *   const createStyles = (t: Theme) => StyleSheet.create({ ... });  // module scope
 */

import { useContext, useMemo } from 'react';

import { ThemeContext, type ThemeContextValue } from '@contexts/ThemeContext';

import type { Theme } from './types';

export function useThemeContext(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (value === null) {
    throw new Error(
      'useTheme() was called outside of <ThemeProvider>. Wrap the tree in <AppProviders>.',
    );
  }

  return value;
}

/** Read the resolved theme object. */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Read + control the user's light/dark/system preference. */
export function useThemePreference(): Omit<ThemeContextValue, 'theme'> {
  const { preference, setPreference, toggleTheme } = useThemeContext();
  return { preference, setPreference, toggleTheme };
}

/**
 * Build a theme-aware stylesheet, memoised on the theme identity.
 * `factory` must be defined at module scope so its identity is stable.
 */
export function useThemedStyles<T extends object>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
