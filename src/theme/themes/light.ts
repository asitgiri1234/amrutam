/**
 * LIGHT THEME — maps the raw palette onto semantic roles.
 *
 * WHY this file may name colours: it *is* the mapping layer. Nothing
 * downstream of here is permitted a literal (enforced by
 * `react-native/no-color-literals` in .eslintrc.js).
 */

import { createElevation } from '../tokens/elevation';
import { motion } from '../tokens/motion';
import { opacity } from '../tokens/opacity';
import { palette } from '../tokens/palette';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import type { Theme, ThemeColors } from '../types';

const colors: ThemeColors = {
  background: palette.clay25,
  surface: palette.clay0,
  surfaceElevated: palette.clay0,
  surfaceSunken: palette.clay50,
  surfacePressed: palette.clay100,
  scrim: palette.blackA40,

  text: palette.clay900,
  textSecondary: palette.clay600,
  textTertiary: palette.clay500,
  textDisabled: palette.clay400,
  textInverse: palette.clay0,
  textLink: palette.tulsi600,

  border: palette.clay200,
  borderStrong: palette.clay300,
  borderFocus: palette.tulsi500,

  primary: palette.tulsi500,
  primaryPressed: palette.tulsi600,
  primaryMuted: palette.tulsi50,
  onPrimary: palette.clay0,

  secondary: palette.haldi500,
  secondaryPressed: palette.haldi600,
  secondaryMuted: palette.haldi50,
  onSecondary: palette.clay0,

  success: palette.tulsi500,
  successMuted: palette.tulsi50,
  onSuccess: palette.clay0,

  warning: palette.amber500,
  warningMuted: palette.amber50,
  onWarning: palette.clay0,

  danger: palette.red500,
  dangerPressed: palette.red600,
  dangerMuted: palette.red50,
  onDanger: palette.clay0,

  info: palette.blue500,
  infoMuted: palette.blue50,
  onInfo: palette.clay0,

  skeletonBase: palette.clay100,
  skeletonHighlight: palette.clay50,
  shadow: palette.clay1000,
  ripple: palette.blackA08,
  tabBarBackground: palette.clay0,
  tabBarActive: palette.tulsi500,
  tabBarInactive: palette.clay500,
  transparent: palette.transparent,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors,
  spacing,
  radius,
  typography,
  elevation: createElevation(colors.shadow),
  opacity,
  motion,
};
