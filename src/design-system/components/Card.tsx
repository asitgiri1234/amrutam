/**
 * Card — the standard content container.
 *
 * WHY a component rather than a style object: a card is not just a rounded
 * rectangle. It is a surface + elevation + padding + optional press behaviour,
 * and each of those has a dark-mode variant. Exposing it as a style would let
 * callers take the border but forget the elevation, which is exactly how a
 * design system erodes.
 *
 * `variant` distinguishes the three real cases:
 *   elevated — floats above the background (default for list items)
 *   outlined — flat with a border (dense lists, where shadows create noise)
 *   filled   — recessed, for secondary/inline content
 */

import type { ReactNode } from 'react';

import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BORDER_WIDTH } from '@constants/layout.constants';
import { useTheme, type ElevationLevel, type Theme } from '@theme';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  /** Supplying this turns the card into a touchable with press feedback and
   *  the correct accessibility role. */
  onPress?: () => void;
  elevation?: ElevationLevel;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  elevation,
  style,
  accessibilityLabel,
  testID,
}: CardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const paddingValue = {
    none: theme.spacing.none,
    sm: theme.spacing.md,
    md: theme.spacing.lg,
    lg: theme.spacing.xxl,
  }[padding];

  const variantStyle: ViewStyle = {
    elevated: {
      backgroundColor: theme.colors.surfaceElevated,
      ...theme.elevation[elevation ?? 'sm'],
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: BORDER_WIDTH.thin,
    },
    filled: {
      backgroundColor: theme.colors.surfaceSunken,
    },
  }[variant];

  const content = (
    <View style={[styles.base, variantStyle, { padding: paddingValue }, style]}>
      {children}
    </View>
  );

  if (onPress === undefined) {
    return (
      <View testID={testID} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: theme.colors.ripple }}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    pressed: {
      opacity: theme.opacity.pressed,
    },
  });
