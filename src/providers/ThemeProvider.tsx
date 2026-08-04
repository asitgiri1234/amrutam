/**
 * ThemeProvider — resolves the active theme and keeps it in sync with the OS.
 *
 * Two decisions worth calling out:
 *
 *  1. **The stored preference is read synchronously at module scope.** MMKV
 *     lets us do that. The alternative (an async read in an effect) means the
 *     first frame renders in the wrong theme and then flips — a flash of white
 *     on a dark-mode device that looks broken every single cold start.
 *
 *  2. **`system` is a real, persisted choice**, not the absence of one. A user
 *     who explicitly picks "match my phone" should keep matching it when the
 *     phone switches at sunset; a user who picked "always dark" should not.
 *     Collapsing the two loses that distinction permanently.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { StatusBar, useColorScheme, type ColorSchemeName } from 'react-native';

import { ThemeContext, type ThemeContextValue } from '@contexts/ThemeContext';
import { appStorage, StorageKeys } from '@storage';
import {
  darkTheme,
  lightTheme,
  type Theme,
  type ThemeMode,
  type ThemePreference,
} from '@theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Synchronous read — see note (1) above. */
function readStoredPreference(): ThemePreference {
  const stored = appStorage.getString(StorageKeys.themePreference);
  return isThemePreference(stored) ? stored : 'system';
}

function resolveMode(
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): ThemeMode {
  if (preference !== 'system') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Test/Storybook override — bypasses storage and the OS setting. */
  forcedPreference?: ThemePreference;
}

export function ThemeProvider({
  children,
  forcedPreference,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => forcedPreference ?? readStoredPreference(),
  );

  useEffect(() => {
    if (forcedPreference !== undefined) {
      setPreferenceState(forcedPreference);
    }
  }, [forcedPreference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    appStorage.set(StorageKeys.themePreference, next);
  }, []);

  const mode = resolveMode(preference, systemScheme);
  const theme: Theme = mode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = useCallback(() => {
    // Resolve `system` to its current concrete mode first, then flip. Toggling
    // from `system` to `system` would be a no-op the user would read as a bug.
    setPreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference, toggleTheme }),
    [preference, setPreference, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
}
