/**
 * Layout constants that are structural rather than stylistic.
 *
 * WHY not in the theme: the theme describes *design decisions* that a designer
 * owns (colour, type, spacing scale). These are *platform mechanics* an
 * engineer owns — minimum tap target sizes mandated by the accessibility
 * guidelines, tab bar heights the navigator needs to reserve. Mixing the two
 * makes the theme unreviewable by design.
 */

import { Platform } from 'react-native';

/** WCAG / Apple HIG minimum interactive size. Every touchable in the design
 *  system meets this, padding out with hitSlop when the visual is smaller. */
export const MIN_TOUCH_TARGET = 44;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const HIT_SLOP_LARGE = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

export const TAB_BAR_HEIGHT = Platform.select({ ios: 49, default: 56 });
export const HEADER_HEIGHT = Platform.select({ ios: 44, default: 56 });

/** Standard horizontal gutter for screen content. */
export const SCREEN_GUTTER = 16;

/** Sizes for Avatar and any square media thumbnail. */
export const AVATAR_SIZE = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Hairline that still renders on high-density screens. */
export const BORDER_WIDTH = {
  hairline: Platform.select({ ios: 0.5, default: 1 }),
  thin: 1,
  thick: 2,
} as const;
