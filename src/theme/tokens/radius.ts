/**
 * CORNER RADIUS SCALE.
 *
 * WHY tokenised: radius carries brand personality. Shipping `borderRadius: 8`
 * in forty files means a design refresh becomes forty pull requests. `pill` and
 * `circle` are intentionally absurd numbers — RN clamps them to half the
 * shorter side, which is exactly the "fully rounded" behaviour we want without
 * needing to know the element's size.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  pill: 999,
  circle: 9999,
} as const;

export type Radius = typeof radius;
export type RadiusKey = keyof Radius;
