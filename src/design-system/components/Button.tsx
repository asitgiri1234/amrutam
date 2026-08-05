/**
 * Button — the app's primary action primitive.
 *
 * Design decisions worth knowing:
 *
 *  - **Variant, not props.** Callers pick a semantic variant (`primary`,
 *    `danger`) rather than passing colours. That is what keeps the action
 *    hierarchy consistent across four product areas.
 *  - **Press feedback runs on the UI thread.** Reanimated drives the scale so
 *    feedback stays smooth even while the JS thread is busy parsing a large
 *    product-list response. A JS-driven `opacity` would stutter there.
 *  - **`loading` implies `disabled`.** Double-submitting a consultation booking
 *    is a real money bug; the component refuses to let it happen.
 *  - **Minimum tap target.** Even the `sm` size reaches `MIN_TOUCH_TARGET`
 *    through hitSlop rather than visual padding.
 */

import { memo, useCallback } from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  BORDER_WIDTH,
  HIT_SLOP,
  MIN_TOUCH_TARGET,
} from '@constants/layout.constants';
import {
  useTheme,
  useThemedStyles,
  type Theme,
  type ThemeColors,
} from '@theme';

import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  /** Layout-only overrides (margin, flex). Colours must come from `variant`. */
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

const PRESSED_SCALE = 0.97;

interface VariantTokens {
  background: keyof ThemeColors;
  backgroundPressed: keyof ThemeColors;
  content: keyof ThemeColors;
  border: keyof ThemeColors | null;
}

const VARIANTS: Record<ButtonVariant, VariantTokens> = {
  primary: {
    background: 'primary',
    backgroundPressed: 'primaryPressed',
    content: 'onPrimary',
    border: null,
  },
  secondary: {
    background: 'secondary',
    backgroundPressed: 'secondaryPressed',
    content: 'onSecondary',
    border: null,
  },
  outline: {
    background: 'transparent',
    backgroundPressed: 'primaryMuted',
    content: 'primary',
    border: 'primary',
  },
  ghost: {
    background: 'transparent',
    backgroundPressed: 'surfacePressed',
    content: 'primary',
    border: null,
  },
  danger: {
    background: 'danger',
    backgroundPressed: 'dangerPressed',
    content: 'onDanger',
    border: null,
  },
};

interface SizeTokens {
  height: number;
  paddingHorizontal: number;
  gap: number;
}

const SIZES: Record<ButtonSize, SizeTokens> = {
  sm: { height: 36, paddingHorizontal: 12, gap: 6 },
  md: { height: MIN_TOUCH_TARGET, paddingHorizontal: 16, gap: 8 },
  lg: { height: 52, paddingHorizontal: 20, gap: 10 },
};

function ButtonComponent({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const isInteractive = !disabled && !loading;
  const tokens = VARIANTS[variant];
  const dimensions = SIZES[size];
  const contentColor = theme.colors[tokens.content];

  const pressProgress = useSharedValue(0);
  const fastDuration = theme.motion.duration.fast;
  const normalDuration = theme.motion.duration.normal;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.value * (1 - PRESSED_SCALE) }],
  }));

  const handlePressIn = useCallback(() => {
    pressProgress.value = withTiming(1, { duration: fastDuration });
  }, [fastDuration, pressProgress]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withTiming(0, { duration: normalDuration });
  }, [normalDuration, pressProgress]);

  return (
    <Animated.View
      style={[animatedStyle, fullWidth ? styles.stretch : styles.hug, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        testID={testID}
        hitSlop={HIT_SLOP}
        disabled={!isInteractive}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: theme.colors.ripple }}
        style={({ pressed }) => [
          styles.base,
          {
            height: dimensions.height,
            paddingHorizontal: dimensions.paddingHorizontal,
            backgroundColor:
              theme.colors[
                pressed ? tokens.backgroundPressed : tokens.background
              ],
            borderWidth: tokens.border === null ? 0 : BORDER_WIDTH.thick,
            borderColor:
              tokens.border === null
                ? theme.colors.transparent
                : theme.colors[tokens.border],
            opacity: isInteractive
              ? theme.opacity.full
              : theme.opacity.disabled,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={contentColor}
            testID="button-loading"
          />
        ) : (
          <View style={[styles.content, { columnGap: dimensions.gap }]}>
            {leftIcon === undefined ? null : (
              <Icon
                name={leftIcon}
                size={size === 'lg' ? 'lg' : 'md'}
                color={contentColor}
              />
            )}
            <Typography
              variant="button"
              style={{ color: contentColor }}
              numberOfLines={1}
            >
              {label}
            </Typography>
            {rightIcon === undefined ? null : (
              <Icon
                name={rightIcon}
                size={size === 'lg' ? 'lg' : 'md'}
                color={contentColor}
              />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Memoised with a caveat worth knowing: this only helps when `onPress` is
 * referentially stable. A caller writing `onPress={() => …}` inline defeats it.
 * Wrap handlers in `useCallback` at the call site inside lists.
 */
export const Button = memo(ButtonComponent);
Button.displayName = 'Button';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    hug: {
      alignSelf: 'flex-start',
    },
    stretch: {
      alignSelf: 'stretch',
    },
  });
