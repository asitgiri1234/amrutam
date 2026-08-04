/**
 * Loader — indeterminate progress.
 *
 * WHY the `MIN_LOADING_MS`-style concerns live at the call site, not here:
 * this component's only job is to render correctly. But two things it *does*
 * own, because getting them wrong is a repeated bug:
 *
 *   - the spinner colour tracks the theme (a black spinner on a dark sheet is
 *     invisible)
 *   - `fullscreen` centres inside the parent AND announces itself to screen
 *     readers, so a blocking load is not a silent void for assistive tech.
 */

import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme, type Theme } from '@theme';

import { Typography } from './Typography';

export interface LoaderProps {
  size?: 'small' | 'large';
  /** Overrides the themed colour — only for coloured surfaces. */
  color?: string;
  /** Fills and centres in the available space. */
  fullscreen?: boolean;
  /** Announced to screen readers and shown beneath the spinner. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Loader({
  size = 'small',
  color,
  fullscreen = false,
  label,
  style,
  testID = 'loader',
}: LoaderProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      accessibilityState={{ busy: true }}
      style={[fullscreen ? styles.fullscreen : styles.inline, style]}
    >
      <ActivityIndicator size={size} color={color ?? theme.colors.primary} />
      {label === undefined ? null : (
        <Typography variant="bodySmall" tone="secondary" style={styles.label}>
          {label}
        </Typography>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fullscreen: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.xxl,
    },
    inline: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });
