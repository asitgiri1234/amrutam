/**
 * AppProviders — the composition root.
 *
 * WHY the nesting order is not arbitrary. Read outside-in:
 *
 *   GestureHandlerRootView  must be the outermost native view or gestures in
 *                           nested navigators silently stop working on Android.
 *   SafeAreaProvider        supplies insets; the theme's StatusBar styling and
 *                           the toast host both need them.
 *   ThemeProvider           everything visual below it depends on the theme,
 *                           including the navigation container's colours.
 *   QueryProvider           data layer. Above navigation so a screen can fetch
 *                           on mount, below theme so its error UI is themed.
 *   ToastProvider           needs the theme and safe area; must sit above
 *                           navigation so a toast survives a screen change.
 *   ErrorBoundary           innermost of the providers so its fallback screen
 *                           can use the theme and show a toast — a boundary
 *                           above ThemeProvider could only render unstyled text.
 *
 * Getting this order wrong produces bugs that look unrelated to providers
 * (gestures dead on one screen, a white flash on cold start, an unthemed crash
 * screen), which is exactly why it is centralised in one documented file.
 */

import type { ReactNode } from 'react';

import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@components/ErrorBoundary';

import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
