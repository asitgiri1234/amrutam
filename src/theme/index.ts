/**
 * WHY `theme/` exists:
 *
 * It is the *design contract* of the app — the single place where visual
 * decisions live. Everything visual (colour, space, radius, type, depth,
 * motion) is a named token here, and no other layer is permitted a literal.
 *
 * Three properties fall out of that:
 *   1. Light and dark mode are correct by construction, because `ThemeColors`
 *      is an interface both themes must implement.
 *   2. A rebrand or density change is a one-file diff, not an audit.
 *   3. Designers and engineers share a vocabulary (`spacing.lg`, `radius.pill`)
 *      that survives handoff.
 *
 * Deliberately depends on nothing but `react-native` and `@contexts` — the
 * theme sits at the bottom of the dependency graph so anything may use it.
 */

export * from './types';
export * from './useTheme';
export { lightTheme } from './themes/light';
export { darkTheme } from './themes/dark';
export { toNavigationTheme } from './navigationTheme';

export { palette } from './tokens/palette';
export type { Palette, PaletteKey } from './tokens/palette';
export { spacing } from './tokens/spacing';
export type { Spacing, SpacingKey } from './tokens/spacing';
export { radius } from './tokens/radius';
export type { Radius, RadiusKey } from './tokens/radius';
export { typography, textVariants } from './tokens/typography';
export type { TextVariant } from './tokens/typography';
export { createElevation } from './tokens/elevation';
export type { Elevation, ElevationLevel } from './tokens/elevation';
export { opacity } from './tokens/opacity';
export { motion, duration, easing, spring } from './tokens/motion';
