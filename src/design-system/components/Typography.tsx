/**
 * Typography — the ONLY text primitive in the app.
 *
 * WHY components should never import `Text` from react-native: RN's Text has
 * no default colour (so it renders black on a dark background), no default
 * type ramp, and no font scaling policy. Every one of those is a bug someone
 * will ship. This wrapper makes the correct thing the default:
 *
 *   - colour resolves from the theme's semantic tones, so dark mode is free
 *   - `variant` selects from the type ramp, so sizes cannot drift
 *   - `maxFontSizeMultiplier` caps OS font scaling so a 200% accessibility
 *     setting degrades gracefully instead of destroying every layout
 */

import {
  forwardRef,
  memo,
  useMemo,
  type ComponentRef,
  type ReactNode,
} from 'react';

import {
  StyleSheet,
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import {
  useTheme,
  type TextVariant,
  type Theme,
  type ThemeColors,
} from '@theme';

/** Semantic colour roles a text node may take. Restricting this to a union
 *  (rather than `string`) is what makes "no inline colors" enforceable. */
export type TextTone =
  | 'default'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'link'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const TONE_TO_COLOR: Record<TextTone, keyof ThemeColors> = {
  default: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  disabled: 'textDisabled',
  inverse: 'textInverse',
  link: 'textLink',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
};

/** Beyond ~1.4x the type ramp stops fitting the layouts it was designed for.
 *  Capping is the accessible choice — clipped text is worse than smaller text. */
const MAX_FONT_SCALE = 1.4;

export interface TypographyProps extends Omit<RNTextProps, 'style'> {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  /** Escape hatch for layout only (margins, flex). Colour and size must come
   *  from `tone` and `variant`. */
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

const TypographyComponent = forwardRef<
  ComponentRef<typeof RNText>,
  TypographyProps
>(
  (
    {
      variant = 'body',
      tone = 'default',
      align,
      style,
      maxFontSizeMultiplier = MAX_FONT_SCALE,
      children,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();

    // Flattening allocates a new style object each render; memoising it keeps
    // long lists of text nodes from churning the style registry.
    const flatStyle = useMemo(
      () =>
        StyleSheet.flatten([
          resolveTextStyle(theme, variant, tone),
          align === undefined ? undefined : { textAlign: align },
          style,
        ]),
      [align, style, theme, tone, variant],
    );

    return (
      <RNText
        ref={ref}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        style={flatStyle}
        {...rest}
      >
        {children}
      </RNText>
    );
  },
);

TypographyComponent.displayName = 'Typography';

/**
 * Memoised: Text is by far the most-instantiated component in the app — a
 * single doctor card holds five of them. This is the memo that actually pays.
 */
export const Typography = memo(TypographyComponent);

function resolveTextStyle(
  theme: Theme,
  variant: TextVariant,
  tone: TextTone,
): TextStyle {
  return {
    ...theme.typography.variants[variant],
    color: theme.colors[TONE_TO_COLOR[tone]],
  };
}

/** Convenience alias so screens can read `<Text>` without importing RN's. */
export const Text = Typography;
