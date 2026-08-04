/**
 * Adapter: our `Theme` -> React Navigation's `Theme`.
 *
 * WHY an adapter rather than adopting React Navigation's theme directly: their
 * shape is tiny (7 colours) and coupled to their release cycle. Owning our own
 * contract means the navigation library is a replaceable detail, and screen
 * backgrounds/headers stay in sync with the design system for free.
 */

import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import type { Theme } from './types';

export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.mode === 'dark' ? NavDarkTheme : NavDefaultTheme;

  return {
    ...base,
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: base.fonts,
  };
}
