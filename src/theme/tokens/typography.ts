/**
 * TYPOGRAPHY TOKENS.
 *
 * WHY variants rather than loose fontSize props: a `variant="h2"` API means the
 * type ramp is defined once and cannot drift. Engineers pick a semantic role,
 * not a pixel value, so the ramp stays consistent across four product areas
 * built by four different people.
 *
 * `lineHeight` is always expressed in absolute points (not a multiplier)
 * because React Native's `lineHeight` is absolute; deriving it here keeps
 * vertical rhythm predictable across platforms.
 */

import { Platform, type TextStyle } from 'react-native';

/** Platform system fonts. Swap the values here when a brand font is licensed —
 *  nothing else in the codebase names a font family. */
export const fontFamily = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  bold: Platform.select({ ios: 'System', default: 'sans-serif' }),
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const letterSpacing = {
  tighter: -0.6,
  tight: -0.3,
  normal: 0,
  wide: 0.3,
  wider: 0.8,
} as const;

/**
 * The type ramp. Each entry is a complete, ready-to-spread `TextStyle`.
 * Colour is deliberately absent — it comes from the theme at render time.
 */
export const textVariants = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: 44,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    lineHeight: 38,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xl,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    lineHeight: 26,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 21,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  button: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xxs,
    lineHeight: 14,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  letterSpacing,
  variants: textVariants,
} as const;

export type Typography = typeof typography;
export type TextVariant = keyof typeof textVariants;
