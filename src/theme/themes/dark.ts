/**
 * DARK THEME.
 *
 * WHY it is not a mechanical inversion of light: dark UIs need lighter brand
 * tints (a 500-weight green on near-black fails contrast), muted surfaces built
 * from alpha whites rather than solid fills, and stronger shadow opacity. Those
 * are judgement calls that belong in a hand-written theme, which is exactly why
 * `ThemeColors` is an interface both themes must satisfy.
 */

import { createElevation } from '../tokens/elevation';
import { motion } from '../tokens/motion';
import { opacity } from '../tokens/opacity';
import { palette } from '../tokens/palette';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import type { Theme, ThemeColors } from '../types';

/** Shadows are near-invisible on dark surfaces; boost their opacity. */
const DARK_SHADOW_MULTIPLIER = 2.2;

const colors: ThemeColors = {
  background: palette.clay950,
  surface: palette.clay900,
  surfaceElevated: palette.clay850,
  surfaceSunken: palette.clay1000,
  surfacePressed: palette.whiteA08,
  scrim: palette.blackA72,

  text: palette.clay50,
  textSecondary: palette.clay300,
  textTertiary: palette.clay400,
  textDisabled: palette.clay600,
  textInverse: palette.clay950,
  textLink: palette.tulsi300,

  border: palette.clay800,
  borderStrong: palette.clay700,
  borderFocus: palette.tulsi300,

  primary: palette.tulsi300,
  primaryPressed: palette.tulsi400,
  primaryMuted: palette.tulsi900,
  onPrimary: palette.clay950,

  secondary: palette.haldi300,
  secondaryPressed: palette.haldi400,
  secondaryMuted: palette.haldi900,
  onSecondary: palette.clay950,

  success: palette.tulsi300,
  successMuted: palette.tulsi900,
  onSuccess: palette.clay950,

  warning: palette.amber400,
  warningMuted: palette.amber900,
  onWarning: palette.clay950,

  danger: palette.red400,
  dangerPressed: palette.red500,
  dangerMuted: palette.red900,
  onDanger: palette.clay950,

  info: palette.blue400,
  infoMuted: palette.blue900,
  onInfo: palette.clay950,

  skeletonBase: palette.clay850,
  skeletonHighlight: palette.clay800,
  shadow: palette.clay1000,
  ripple: palette.whiteA12,
  tabBarBackground: palette.clay900,
  tabBarActive: palette.tulsi300,
  tabBarInactive: palette.clay500,
  transparent: palette.transparent,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors,
  spacing,
  radius,
  typography,
  elevation: createElevation(colors.shadow, DARK_SHADOW_MULTIPLIER),
  opacity,
  motion,
};
