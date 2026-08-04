/**
 * ELEVATION TOKENS.
 *
 * WHY a factory rather than a constant: iOS and Android express depth
 * differently (`shadow*` vs `elevation`), and a dark UI needs a *stronger*
 * shadow than a light one to read at all. So elevation is derived from the
 * theme's shadow colour and an opacity multiplier the theme supplies.
 *
 * Consumers write `style={theme.elevation.md}` and never think about platform.
 * Note this module deliberately imports nothing from the theme types — that
 * keeps the token layer acyclic and independently testable.
 */

import { Platform, type ViewStyle } from 'react-native';

export type ElevationLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Elevation = Record<ElevationLevel, ViewStyle>;

interface ElevationSpec {
  /** Android's single-number depth cue. */
  android: number;
  /** iOS shadow geometry. */
  offsetY: number;
  radius: number;
  opacity: number;
}

const SPECS: Record<ElevationLevel, ElevationSpec> = {
  none: { android: 0, offsetY: 0, radius: 0, opacity: 0 },
  xs: { android: 1, offsetY: 1, radius: 2, opacity: 0.06 },
  sm: { android: 2, offsetY: 2, radius: 4, opacity: 0.08 },
  md: { android: 4, offsetY: 4, radius: 8, opacity: 0.1 },
  lg: { android: 8, offsetY: 8, radius: 16, opacity: 0.14 },
  xl: { android: 16, offsetY: 12, radius: 24, opacity: 0.18 },
};

/**
 * @param shadowColor Comes from the active theme, never a literal.
 * @param opacityMultiplier Dark surfaces swallow shadows, so the dark theme
 *   passes a multiplier rather than us maintaining a second hand-tuned table.
 */
export function createElevation(
  shadowColor: string,
  opacityMultiplier = 1,
): Elevation {
  const build = (spec: ElevationSpec): ViewStyle =>
    Platform.select<ViewStyle>({
      android: { elevation: spec.android, shadowColor },
      default: {
        shadowColor,
        shadowOffset: { width: 0, height: spec.offsetY },
        shadowOpacity: Math.min(spec.opacity * opacityMultiplier, 1),
        shadowRadius: spec.radius,
      },
    });

  return {
    none: build(SPECS.none),
    xs: build(SPECS.xs),
    sm: build(SPECS.sm),
    md: build(SPECS.md),
    lg: build(SPECS.lg),
    xl: build(SPECS.xl),
  };
}
