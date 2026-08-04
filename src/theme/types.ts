/**
 * THEME CONTRACT.
 *
 * `ThemeColors` is the semantic colour surface every component may use. It is
 * an explicit interface (rather than `typeof lightTheme`) on purpose: adding a
 * role forces both themes to implement it, so dark mode can never silently
 * fall behind light mode. That single constraint is what makes "everything
 * supports light and dark" a compile-time guarantee instead of a QA task.
 */

import type { Elevation } from './tokens/elevation';
import type { Motion } from './tokens/motion';
import type { Opacity } from './tokens/opacity';
import type { Radius } from './tokens/radius';
import type { Spacing } from './tokens/spacing';
import type { Typography } from './tokens/typography';

/** The two concrete themes we ship. */
export type ThemeMode = 'light' | 'dark';

/** What the user can *choose*. `system` follows the OS setting. */
export type ThemePreference = ThemeMode | 'system';

export interface ThemeColors {
  /* ---- Surfaces ------------------------------------------------------- */
  /** App background, behind everything. */
  background: string;
  /** Default card / sheet surface. */
  surface: string;
  /** A surface that sits above `surface` (menus, raised cards). */
  surfaceElevated: string;
  /** A recessed surface (input wells, code blocks). */
  surfaceSunken: string;
  /** Pressed-state background for list rows and touchables. */
  surfacePressed: string;
  /** Full-screen dimming behind modals. */
  scrim: string;

  /* ---- Content -------------------------------------------------------- */
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  /** Text drawn on top of a strongly coloured surface. */
  textInverse: string;
  /** Anchor / link colour. */
  textLink: string;

  /* ---- Borders -------------------------------------------------------- */
  border: string;
  borderStrong: string;
  borderFocus: string;

  /* ---- Brand ---------------------------------------------------------- */
  primary: string;
  primaryPressed: string;
  /** Low-emphasis tint of primary — chips, selected backgrounds. */
  primaryMuted: string;
  onPrimary: string;

  secondary: string;
  secondaryPressed: string;
  secondaryMuted: string;
  onSecondary: string;

  /* ---- Status --------------------------------------------------------- */
  success: string;
  successMuted: string;
  onSuccess: string;

  warning: string;
  warningMuted: string;
  onWarning: string;

  danger: string;
  dangerPressed: string;
  dangerMuted: string;
  onDanger: string;

  info: string;
  infoMuted: string;
  onInfo: string;

  /* ---- Component-specific --------------------------------------------- */
  skeletonBase: string;
  skeletonHighlight: string;
  /** Source colour for platform shadows. */
  shadow: string;
  /** Android ripple / iOS highlight. */
  ripple: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  /** For anything that must explicitly render nothing. */
  transparent: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: Spacing;
  radius: Radius;
  typography: Typography;
  elevation: Elevation;
  opacity: Opacity;
  motion: Motion;
}
