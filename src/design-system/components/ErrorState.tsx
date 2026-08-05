/**
 * ErrorState — "something failed, here is what you can do about it".
 *
 * WHY the `variant` distinction: users treat these three very differently and
 * so should we.
 *
 *   offline    — their fault-ish, self-healing. Say so, offer retry, do not
 *                apologise as if we broke.
 *   notFound   — the thing is gone. Retry is useless; offer navigation instead.
 *   generic    — our fault. Apologise, offer retry, and surface a support code.
 *
 * The `supportCode` prop exists because "Something went wrong" with no
 * identifier makes a support ticket unactionable. It maps to the API layer's
 * `requestId`, which is also what lands in crash reporting.
 */

import { memo } from 'react';

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, useThemedStyles, type Theme } from '@theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

export type ErrorStateVariant = 'generic' | 'offline' | 'notFound';

export interface ErrorStateProps {
  variant?: ErrorStateVariant;
  /** Overrides the variant's default copy. */
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Correlation id shown in small print for support. */
  supportCode?: string;
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface VariantCopy {
  icon: IconName;
  title: string;
  description: string;
}

const VARIANT_COPY: Record<ErrorStateVariant, VariantCopy> = {
  generic: {
    icon: 'alertTriangle',
    title: 'Something went wrong',
    description: 'We could not load this right now. Please try again.',
  },
  offline: {
    icon: 'wifiOff',
    title: 'You are offline',
    description:
      'Check your connection. Anything you do now will sync once you are back online.',
  },
  notFound: {
    icon: 'alertCircle',
    title: 'Not found',
    description: 'This item is no longer available.',
  },
};

function ErrorStateComponent({
  variant = 'generic',
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  supportCode,
  fullscreen = true,
  style,
  testID = 'error-state',
}: ErrorStateProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const copy = VARIANT_COPY[variant];

  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;

  const accentColor =
    variant === 'offline' ? theme.colors.warning : theme.colors.danger;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${resolvedTitle}. ${resolvedDescription}`}
      style={[styles.container, fullscreen ? styles.fullscreen : null, style]}
    >
      <View
        style={[
          styles.iconWell,
          {
            backgroundColor:
              variant === 'offline'
                ? theme.colors.warningMuted
                : theme.colors.dangerMuted,
          },
        ]}
      >
        <Icon name={copy.icon} size={32} color={accentColor} />
      </View>

      <Typography variant="h4" align="center" style={styles.title}>
        {resolvedTitle}
      </Typography>

      <Typography variant="body" tone="secondary" align="center">
        {resolvedDescription}
      </Typography>

      {onRetry === undefined ? null : (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="outline"
          leftIcon="refresh"
          style={styles.action}
          testID="error-state-retry"
        />
      )}

      {supportCode === undefined ? null : (
        <Typography variant="caption" tone="tertiary" align="center">
          {`Reference: ${supportCode}`}
        </Typography>
      )}
    </View>
  );
}

export const ErrorState = memo(ErrorStateComponent);
ErrorState.displayName = 'ErrorState';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    action: {
      marginTop: theme.spacing.sm,
    },
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
      paddingVertical: theme.spacing.xxxl,
      rowGap: theme.spacing.sm,
    },
    fullscreen: {
      flex: 1,
    },
    iconWell: {
      alignItems: 'center',
      borderRadius: theme.radius.circle,
      height: 72,
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
      width: 72,
    },
    title: {
      marginTop: theme.spacing.xs,
    },
  });
