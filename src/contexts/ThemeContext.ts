/**
 * WHY `contexts/` exists (and is separate from `providers/`):
 *
 * A React context has two halves — the *contract* (the value shape + the
 * `createContext` handle) and the *implementation* (the component that computes
 * and supplies the value). Keeping the contract in its own dependency-light
 * module means consumers (`useTheme`) never have to import the provider, which
 * would otherwise drag storage, MMKV and Appearance listeners into every unit
 * test that renders a Button.
 */

import { createContext } from 'react';

import type { Theme, ThemePreference } from '@theme/types';

export interface ThemeContextValue {
  /** The fully resolved theme for this render. */
  theme: Theme;
  /** What the user picked — may be `system`, unlike `theme.mode`. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Convenience for a light/dark switch; resolves `system` first. */
  toggleTheme: () => void;
}

/**
 * `null` default so `useTheme` can throw a useful error when a component is
 * rendered outside the provider, instead of silently rendering an unthemed UI.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

ThemeContext.displayName = 'ThemeContext';
