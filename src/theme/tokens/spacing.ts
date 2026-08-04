/**
 * SPACING SCALE — a 4pt grid.
 *
 * WHY a fixed scale instead of arbitrary numbers: on a 4pt grid every screen
 * built by every engineer lines up automatically. Arbitrary padding is the
 * single most common source of "it looks slightly off" review comments, and it
 * is unreviewable at scale. Named tokens make the intent (`spacing.lg`) legible
 * and make a global density change a one-line edit.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
  colossal: 64,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
