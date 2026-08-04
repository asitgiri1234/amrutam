/**
 * Screen — the standard page shell.
 *
 * WHY every screen should use it instead of a bare `View`:
 *   - safe-area insets applied on the correct edges (a screen inside a tab
 *     navigator must NOT pad the bottom; the tab bar already does)
 *   - themed background, so a screen is never white in dark mode
 *   - a single, consistent decision about keyboard avoidance
 *   - `loading` / `error` / `empty` slots, so every screen in the app handles
 *     those four states identically without each author re-deciding
 *
 * That last point is the real payoff. Four product areas built by four people
 * otherwise produce four different loading treatments.
 */

import type { ReactNode } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, Loader } from '@design-system';
import { useTheme, type Theme } from '@theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for screens hosting a FlashList —
   *  nesting a virtualised list inside a ScrollView breaks recycling. */
  scrollable?: boolean;
  /** Defaults to top+left+right: bottom is owned by the tab bar. */
  edges?: readonly Edge[];
  /** Applies the standard horizontal gutter. */
  padded?: boolean;
  /** Renders a centred loader instead of children. */
  loading?: boolean;
  /** Renders an ErrorState instead of children. */
  error?: Error | null;
  onRetry?: () => void;
  /** Pinned below the content — action bars, checkout totals. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

export function Screen({
  children,
  scrollable = false,
  edges = DEFAULT_EDGES,
  padded = true,
  loading = false,
  error = null,
  onRetry,
  footer,
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const body = loading ? (
    <Loader fullscreen label="Loading" />
  ) : error !== null ? (
    <ErrorState
      onRetry={onRetry}
      description={error.message}
      testID="screen-error"
    />
  ) : scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        padded ? styles.padded : null,
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        padded ? styles.padded : null,
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, style]}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        // iOS needs padding; Android's windowSoftInputMode already resizes,
        // and applying padding there double-counts the keyboard.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
        {footer === undefined ? null : (
          <View
            style={[styles.footer, padded ? styles.paddedHorizontal : null]}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    footer: {
      borderTopColor: theme.colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingVertical: theme.spacing.md,
    },
    padded: {
      paddingHorizontal: theme.spacing.lg,
    },
    paddedHorizontal: {
      paddingHorizontal: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xxl,
    },
  });
