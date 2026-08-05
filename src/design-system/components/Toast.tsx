/**
 * Toast — transient, non-blocking feedback.
 *
 * WHY the visual is split from the queue (which lives in `providers/`): a
 * toast has two very different concerns. *What it looks like* is a design
 * decision that belongs in the design system. *When it appears, how many stack
 * up, and when they expire* is application state. Splitting them means the
 * queue can be unit-tested without rendering, and the visual can be previewed
 * in isolation.
 *
 * Toasts are for things the user does NOT need to act on. Anything requiring a
 * decision is a Modal — a dismissible banner is the wrong place for a choice
 * the user might miss.
 */

import { memo, useEffect } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  useTheme,
  useThemedStyles,
  type Theme,
  type ThemeColors,
} from '@theme';

import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  message: string;
  title?: string;
  variant?: ToastVariant;
  /** Milliseconds on screen. `0` pins it until dismissed. */
  durationMs?: number;
  action?: ToastAction;
}

export interface ToastItem
  extends Required<Omit<ToastOptions, 'title' | 'action'>> {
  id: string;
  title?: string;
  action?: ToastAction;
}

interface VariantTokens {
  icon: IconName;
  accent: keyof ThemeColors;
  background: keyof ThemeColors;
}

const VARIANTS: Record<ToastVariant, VariantTokens> = {
  success: { icon: 'check', accent: 'success', background: 'successMuted' },
  error: { icon: 'alertCircle', accent: 'danger', background: 'dangerMuted' },
  warning: {
    icon: 'alertTriangle',
    accent: 'warning',
    background: 'warningMuted',
  },
  info: { icon: 'alertCircle', accent: 'info', background: 'infoMuted' },
};

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastComponent({ toast, onDismiss }: ToastProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const tokens = VARIANTS[toast.variant];

  const enterProgress = useSharedValue(0);
  const normalDuration = theme.motion.duration.normal;

  useEffect(() => {
    enterProgress.value = withTiming(1, { duration: normalDuration });
  }, [enterProgress, normalDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: enterProgress.value,
    transform: [{ translateY: (1 - enterProgress.value) * -16 }],
  }));

  const accentColor = theme.colors[tokens.accent];

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={`toast-${toast.variant}`}
      style={[
        styles.container,
        theme.elevation.lg,
        {
          backgroundColor: theme.colors[tokens.background],
          borderLeftColor: accentColor,
        },
        animatedStyle,
      ]}
    >
      <Icon name={tokens.icon} size="md" color={accentColor} />

      <View style={styles.content}>
        {toast.title === undefined ? null : (
          <Typography variant="label">{toast.title}</Typography>
        )}
        <Typography variant="body" tone="secondary">
          {toast.message}
        </Typography>
      </View>

      {toast.action === undefined ? null : (
        <Pressable
          onPress={toast.action.onPress}
          accessibilityRole="button"
          hitSlop={theme.spacing.sm}
          testID="toast-action"
        >
          <Typography variant="label" style={{ color: accentColor }}>
            {toast.action.label}
          </Typography>
        </Pressable>
      )}

      <Pressable
        onPress={() => onDismiss(toast.id)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={theme.spacing.sm}
        testID="toast-dismiss"
      >
        <Icon name="close" size="sm" color={theme.colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Memoised: the host re-renders whenever ANY toast is added or expires, so
 * without this every visible toast would re-run its entrance animation each
 * time a sibling appeared.
 */
export const Toast = memo(ToastComponent);
Toast.displayName = 'Toast';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      borderLeftWidth: 4,
      borderRadius: theme.radius.md,
      columnGap: theme.spacing.md,
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    content: {
      flex: 1,
      rowGap: theme.spacing.xxs,
    },
  });
